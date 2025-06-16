const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  // Валидация
  if (!token) {
    return res.status(400).json({ 
      error: 'Missing required field: token' 
    });
  }

  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: tokenValidation.error });
  }

  try {
    const tokenData = tokenValidation.data;
    
    const requestBody = {
      account_id: tokenData.account_id
    };
    
    const path = `/v2/origin/custom/${tokenData.channel_id}/disconnect`;
    const headers = createAmoCrmHeaders(requestBody, tokenData.secret_key, path);
    
    log('Disconnecting channel', { 
      channel_id: tokenData.channel_id,
      account_id: tokenData.account_id 
    });
    
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'DELETE',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    // Удаляем токен из хранилища
    global.tokenStore.delete(token);
    
    log('Channel disconnected', { success: response.ok });
    return res.json({ 
      success: response.ok, 
      status: response.status,
      message: 'Channel disconnected and token invalidated'
    });
    
  } catch (error) {
    log('Disconnect error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}