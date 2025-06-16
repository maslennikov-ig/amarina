// api/utils.js - Исправленная версия с современным crypto

const crypto = require('crypto');

const ENCRYPTION_KEY = 'amocrm-proxy-secret-key-32chars!'; // 32 chars
const ALGORITHM = 'aes-256-cbc';

// Создание stateless токена (содержит всю информацию)
function createStatelessToken(data) {
  const payload = {
    ...data,
    created: Date.now(),
    expires: Date.now() + (24 * 60 * 60 * 1000) // 24 часа
  };
  
  try {
    const payloadString = JSON.stringify(payload);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes256', ENCRYPTION_KEY);
    
    let encrypted = cipher.update(payloadString, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Объединяем IV и зашифрованные данные
    const combined = iv.toString('hex') + ':' + encrypted;
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Token creation error:', error);
    throw new Error('Failed to create token');
  }
}

// Расшифровка stateless токена
function decodeStatelessToken(token) {
  try {
    const combined = Buffer.from(token, 'base64').toString('utf8');
    const [ivHex, encrypted] = combined.split(':');
    
    if (!ivHex || !encrypted) {
      return { valid: false, error: 'Invalid token format - missing parts' };
    }
    
    const decipher = crypto.createDecipher('aes256', ENCRYPTION_KEY);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const payload = JSON.parse(decrypted);
    
    // Проверяем срок действия
    if (payload.expires < Date.now()) {
      return { 
        valid: false, 
        error: `Token expired at ${new Date(payload.expires).toISOString()}` 
      };
    }
    
    return { valid: true, data: payload };
  } catch (error) {
    console.error('Token decode error:', error);
    return { 
      valid: false, 
      error: `Invalid token: ${error.message}` 
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