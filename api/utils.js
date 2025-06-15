const crypto = require('crypto');

// Глобальное хранилище токенов
global.tokenStore = global.tokenStore || new Map();

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
  
  // Формируем строку для подписи согласно новой схеме AmoCRM
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
  
  const tokenData = global.tokenStore.get(token);
  
  if (!tokenData) {
    return { valid: false, error: 'Invalid token' };
  }
  
  if (tokenData.expires < Date.now()) {
    global.tokenStore.delete(token);
    return { valid: false, error: 'Token expired. Please get a new token.' };
  }
  
  return { valid: true, data: tokenData };
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
  createAmoCrmHeaders,
  validateToken,
  handleAmoCrmResponse,
  log
};