const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, conversation_id, limit = '50', offset = '0' } = req.query;

  // Валидация
  if (!token || !conversation_id) {
    return res.status(400).json({ 
      error: 'Missing required parameters: token, conversation_id' 
    });
  }

  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: tokenValidation.error });
  }

  try {
    const tokenData = tokenValidation.data;
    
    const path = `/v2/origin/custom/${tokenData.scope_id}/chats/${conversation_id}/history`;
    const queryParams = `?limit=${limit}&offset=${offset}`;
    
    // Для GET запроса body пустой
    const headers = createAmoCrmHeaders('', tokenData.secret_key, path, 'GET');
    
    log('Getting chat history', { conversation_id, limit, offset });
    
    const response = await fetch(`https://amojo.amocrm.ru${path}${queryParams}`, {
      method: 'GET',
      headers
    });
    
    const result = await handleAmoCrmResponse(response);
    
    if (result.success) {
      log('Chat history retrieved', { 
        conversation_id, 
        messages_count: result.data.messages?.length || 0 
      });
      return res.json({ success: true, data: result.data });
    } else {
      log('Chat history failed', result);
      return res.status(500).json(result);
    }
    
  } catch (error) {
    log('Chat history error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}