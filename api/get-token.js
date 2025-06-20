// api/get-token.js - Stateless версия

const { createStatelessToken, createAmoCrmHeaders, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { channel_id, secret_key, account_id, title = "ArinaBot" } = req.body;

  // Валидация
  if (!channel_id || !secret_key || !account_id) {
    return res.status(400).json({ 
      error: 'Missing required fields: channel_id, secret_key, account_id' 
    });
  }

  try {
    const requestBody = {
      account_id,
      title,
      hook_api_version: "v2"
    };
    
    const path = `/v2/origin/custom/${channel_id}/connect`;
    const headers = createAmoCrmHeaders(requestBody, secret_key, path, 'POST');
    
    log('Getting token with stateless approach', { 
      channel_id, 
      account_id, 
      title,
      signature_preview: headers['X-Signature'].substr(0, 8) + '...'
    });
    
    // Запрос к AmoCRM с новой схемой подписи
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    const result = await handleAmoCrmResponse(response);
    
    if (!result.success) {
      log('Token request failed', { 
        ...result, 
        headers_sent: headers,
        response_status: response.status 
      });
      return res.status(500).json(result);
    }
    
    if (result.data.scope_id) {
      // Создаем stateless токен со всей необходимой информацией
      const tokenData = {
        scope_id: result.data.scope_id,
        secret_key,
        channel_id,
        account_id,
        title
      };
      
      const token = createStatelessToken(tokenData);
      
      log('Stateless token created successfully', { 
        token_preview: token.substr(0, 16) + '...', 
        scope_id: result.data.scope_id,
        expires_at: new Date(Date.now() + 86400000).toISOString()
      });
      
      return res.json({ 
        success: true, 
        token,
        scope_id: result.data.scope_id,
        expires_in: 86400,
        created_at: new Date().toISOString(),
        signature_scheme: 'new',
        token_type: 'stateless'
      });
    }
    
    return res.status(400).json({ 
      error: 'Failed to get scope_id from AmoCRM', 
      amocrm_response: result.data,
      status: result.status
    });
    
  } catch (error) {
    log('Token request error', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}