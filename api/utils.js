// api/utils.js - Исправленная версия с JWT-подобными токенами

const crypto = require('crypto');

// Создание stateless токена (содержит всю информацию)
function createStatelessToken(data) {
  const payload = {
    ...data,
    created: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
  };
  
  // Простое шифрование (в продакшене используйте JWT)
  const payloadString = JSON.stringify(payload);
  const cipher = crypto.createCipher('aes-256-cbc', 'amocrm-proxy-secret-key');
  let encrypted = cipher.update(payloadString, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return Buffer.from(encrypted).toString('base64');
}

// Расшифровка stateless токена
function decodeStatelessToken(token) {
  try {
    const encrypted = Buffer.from(token, 'base64').toString('utf8');
    const decipher = crypto.createDecipher('aes-256-cbc', 'amocrm-proxy-secret-key');
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const payload = JSON.parse(decrypted);
    
    // Проверяем срок действия
    if (payload.expires < Date.now()) {
      return { valid: false, error: 'Token expired. Please get a new token.' };
    }
    
    return { valid: true, data: payload };
  } catch (error) {
    return { valid: false, error: 'Invalid token format' };
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

// Валидация токена (stateless)
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