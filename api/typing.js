const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, conversation_id, sender } = req.body;

  // Валидация
  if (!token || !conversation_id || !sender) {
    return res.status(400).json({ 
      error: 'Missing required fields: token, conversation_id, sender' 
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
      sender
    };
    
    const path = `/v2/origin/custom/${tokenData.channel_id}/typing`;
    const headers = createAmoCrmHeaders(requestBody, tokenData.secret_key, path);
    
    log('Sending typing indicator', { conversation_id, sender_id: sender.id });
    
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    log('Typing indicator sent', { conversation_id, success: response.ok });
    return res.json({ success: response.ok, status: response.status });
    
  } catch (error) {
    log('Typing indicator error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}