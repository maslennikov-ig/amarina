// api/utils.js - Упрощенная версия без сложного шифрования

const crypto = require('crypto');

const SECRET_SALT = 'amocrm-proxy-secret-2025';

// Создание простого подписанного токена
function createStatelessToken(data) {
  try {
    const payload = {
      ...data,
      created: Date.now(),
      expires: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
    };
    
    // Простое кодирование в base64
    const payloadString = JSON.stringify(payload);
    const encodedPayload = Buffer.from(payloadString).toString('base64');
    
    // Создаем подпись для проверки целостности
    const signature = crypto
      .createHmac('sha256', SECRET_SALT)
      .update(encodedPayload)
      .digest('hex');
    
    // Объединяем payload и подпись
    const token = encodedPayload + '.' + signature;
    
    return token;
  } catch (error) {
    console.error('Token creation error:', error);
    throw new Error(`Failed to create token: ${error.message}`);
  }
}

// Расшифровка простого токена
function decodeStatelessToken(token) {
  try {
    const [encodedPayload, signature] = token.split('.');
    
    if (!encodedPayload || !signature) {
      return { valid: false, error: 'Invalid token format - missing signature' };
    }
    
    // Проверяем подпись
    const expectedSignature = crypto
      .createHmac('sha256', SECRET_SALT)
      .update(encodedPayload)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid token signature' };
    }
    
    // Декодируем payload
    const payloadString = Buffer.from(encodedPayload, 'base64').toString('utf8');
    const payload = JSON.parse(payloadString);
    
    // Проверяем срок действия
    if (payload.expires < Date.now()) {
      return { 
        valid: false, 
        error: `Token expired at ${new Date(payload.expires).toISOString()}`,
        expired_ago_minutes: Math.floor((Date.now() - payload.expires) / (1000 * 60))
      };
    }
    
    return { valid: true, data: payload };
  } catch (error) {
    console.error('Token decode error:', error);
    return { 
      valid: false, 
      error: `Token decode failed: ${error.message}` 
    };
  }
}

// Создание HMAC подписи (новая схема AmoCRM)
function createHmacSignature(message, secret) {
  return crypto
    .createHmac('sha1', secret)
    .update(message)
    .digest('hex')
    .toLowerCase();
}

// Создание заголовков для AmoCRM (новая схема подписи)
function createAmoCrmHeaders(body, secret, path, method = 'POST') {
  const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
  const date = new Date().toUTCString();
  const contentType = 'application/json';
  const contentMd5 = crypto.createHash('md5').update(bodyString).digest('hex').toLowerCase();
  
  const stringToSign = [
    method.toUpperCase(),
    contentMd5,
    contentType,
    date,
    path
  ].join('\n');
  
  const signature = createHmacSignature(stringToSign, secret);
  
  return {
    'Date': date,
    'Content-Type': contentType,
    'Content-MD5': contentMd5,
    'X-Signature': signature
  };
}

// Валидация токена
function validateToken(token) {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }
  
  return decodeStatelessToken(token);
}

// Обработка ответа от AmoCRM
async function handleAmoCrmResponse(response) {
  const responseText = await response.text();
  
  try {
    const data = JSON.parse(responseText);
    return { success: true, data, status: response.status };
  } catch (e) {
    return { 
      success: false, 
      error: 'Invalid JSON response from AmoCRM', 
      response: responseText,
      status: response.status 
    };
  }
}

// Логирование
function log(action, data) {
  console.log(`[AmoCRM Proxy] ${action}:`, JSON.stringify(data, null, 2));
}

module.exports = {
  createStatelessToken,
  validateToken,
  createAmoCrmHeaders,
  handleAmoCrmResponse,
  log
};