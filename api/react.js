const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, conversation_id, msgid, user, type, emoji } = req.body;

  // Валидация
  if (!token || !conversation_id || !msgid || !user || !type) {
    return res.status(400).json({ 
      error: 'Missing required fields: token, conversation_id, msgid, user, type' 
    });
  }

  if (!['react', 'unreact'].includes(type)) {
    return res.status(400).json({ 
      error: 'Type must be "react" or "unreact"' 
    });
  }

  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: tokenValidation.error });
  }

  try {
    const tokenData = tokenValidation.data;
    
    const requestBody = {
      conversation_id,
      msgid,
      user,
      type,
      ...(emoji && { emoji })
    };
    
    const path = `/v2/origin/custom/${tokenData.scope_id}/react`;
    const headers = createAmoCrmHeaders(requestBody, tokenData.secret_key, path);
    
    log('Sending reaction', { conversation_id, msgid, type, emoji });
    
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    log('Reaction sent', { msgid, type, success: response.ok });
    return res.json({ success: response.ok, status: response.status });
    
  } catch (error) {
    log('Reaction error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}