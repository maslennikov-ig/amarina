const crypto = require('crypto');
const { createAmoCrmHeaders, validateToken, handleAmoCrmResponse, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    token, 
    conversation_id, 
    message, 
    sender, 
    receiver, 
    silent = false,
    source
  } = req.body;

  // Валидация
  if (!token || !conversation_id || !message || !sender) {
    return res.status(400).json({ 
      error: 'Missing required fields: token, conversation_id, message, sender' 
    });
  }

  const tokenValidation = validateToken(token);
  if (!tokenValidation.valid) {
    return res.status(401).json({ error: tokenValidation.error });
  }

  try {
    const tokenData = tokenValidation.data;
    const msgid = `bot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const requestBody = {
      event_type: "new_message",
      payload: {
        timestamp: Math.floor(Date.now() / 1000),
        msec_timestamp: Date.now(),
        msgid,
        conversation_id,
        sender,
        ...(receiver && { receiver }),
        message,
        silent,
        ...(source && { source })
      }
    };
    
    const path = `/v2/origin/custom/${tokenData.scope_id}`;
    const headers = createAmoCrmHeaders(requestBody, tokenData.secret_key, path, 'POST');
    
    log('Sending message with new signature scheme', { 
      conversation_id, 
      msgid, 
      message_type: message.type,
      silent,
      signature_preview: headers['X-Signature'].substr(0, 8) + '...'
    });
    
    // Запрос к AmoCRM с новой схемой подписи
    const response = await fetch(`https://amojo.amocrm.ru${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });
    
    const result = await handleAmoCrmResponse(response);
    
    if (result.success) {
      log('Message sent successfully', { 
        msgid, 
        amocrm_msgid: result.data.new_message?.msgid,
        response_status: result.status
      });
      
      return res.json({ 
        success: true, 
        amocrm_response: result.data,
        message_id: result.data.new_message?.msgid || msgid,
        our_msgid: msgid,
        signature_scheme: 'new'
      });
    } else {
      log('Message send failed', { 
        ...result, 
        msgid,
        headers_sent: headers 
      });
      return res.status(500).json(result);
    }
    
  } catch (error) {
    log('Message send error', { error: error.message, stack: error.stack });
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}