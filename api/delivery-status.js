const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, msgid, delivery_status, error_code, error } = req.body;

  // Валидация
  if (!token || !msgid || delivery_status === undefined) {
    return res.status(400).json({ 
      error: 'Missing required fields: token, msgid, delivery_status' 
    });
  }

  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: tokenValidation.error });
  }

  try {
    const tokenData = tokenValidation.data;
    
    const requestBody = {
      msgid,
      delivery_status,
      ...(error_code && { error_code }),
      ...(error && { error })
    };
    
    const path = `/v2/origin/custom/${tokenData.scope_id}/${msgid}/delivery_status`;
    const headers = createAmoCrmHeaders(requestBody, tokenData.secret_key, path);
    
    log('Updating delivery status', { msgid, delivery_status, error_code });
    
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    const result = await handleAmoCrmResponse(response);
    
    log('Delivery status updated', { msgid, success: result.success });
    return res.json({ success: result.success, status: response.status });
    
  } catch (error) {
    log('Delivery status error', { error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}