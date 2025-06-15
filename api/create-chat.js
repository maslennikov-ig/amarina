const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, conversation_id, user, source } = req.body;

  // Валидация
  if (!token || !conversation_id || !user) {
    return res.status(400).json({ 
      error: 'Missing required fields: token, conversation_id, user' 
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
      user,
      ...(source && { source })
    };
    
    const path = `/v2/origin/custom/${tokenData.scope_id}/chats`;
    const headers = createAmoCrmHeaders(requestBody, tokenData.secret_key, path);
    
    log('Creating chat', { conversation_id, user_id: user.id });
    
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    const result = await handleAmoCrmResponse(response);
    
    if (result.success) {
      log('Chat created successfully', { 
        conversation_id, 
        chat_id: result.data.id 
      });
      return res.json({ success: true, data: result.data });
    } else {
      log('Chat creation failed', result);
      return res.status(500).json(result);
    }
    
  } catch (error) {
    log('Chat creation error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}