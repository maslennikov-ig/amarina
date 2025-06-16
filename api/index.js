// api/index.js - Главная страница

export default async function handler(req, res) {
    const html = `
  <!DOCTYPE html>
  <html lang="ru">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>AmoCRM Chat API Proxy</title>
      <style>
          body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: #f5f5f5;
          }
          .container {
              background: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #333; text-align: center; }
          .status { 
              background: #e8f5e8; 
              padding: 10px; 
              border-radius: 5px; 
              border-left: 4px solid #4caf50;
              margin: 20px 0;
          }
          .endpoint {
              background: #f8f9fa;
              padding: 15px;
              margin: 10px 0;
              border-radius: 5px;
              border-left: 3px solid #007bff;
          }
          .method {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 3px;
              font-size: 12px;
              font-weight: bold;
              margin-right: 10px;
          }
          .post { background: #28a745; color: white; }
          .get { background: #17a2b8; color: white; }
          code {
              background: #f8f9fa;
              padding: 2px 4px;
              border-radius: 3px;
              font-family: 'Courier New', monospace;
          }
          .test-button {
              background: #007bff;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              margin: 5px;
          }
          .test-button:hover {
              background: #0056b3;
          }
          #results {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 5px;
              margin-top: 20px;
              white-space: pre-wrap;
              font-family: 'Courier New', monospace;
              font-size: 12px;
              max-height: 300px;
              overflow-y: auto;
          }
      </style>
  </head>
  <body>
      <div class="container">
          <h1>🚀 AmoCRM Chat API Proxy</h1>
          
          <div class="status">
              ✅ Сервис работает! Время: ${new Date().toLocaleString('ru-RU')}
          </div>
  
          <h2>📋 Доступные эндпоинты:</h2>
  
          <div class="endpoint">
              <span class="method get">GET</span>
              <code>/api/health</code>
              <p>Проверка здоровья сервиса</p>
              <button class="test-button" onclick="testHealth()">Тест</button>
          </div>
  
          <div class="endpoint">
              <span class="method post">POST</span>
              <code>/api/get-token</code>
              <p>Получение токена для работы с AmoCRM Chat API</p>
          </div>
  
          <div class="endpoint">
              <span class="method post">POST</span>
              <code>/api/send-message</code>
              <p>Отправка сообщений в AmoCRM</p>
          </div>
  
          <div class="endpoint">
              <span class="method post">POST</span>
              <code>/api/debug-token</code>
              <p>Отладка и проверка токенов</p>
          </div>
  
          <div class="endpoint">
              <span class="method post">POST</span>
              <code>/api/create-chat</code>
              <p>Создание нового чата</p>
          </div>
  
          <div class="endpoint">
              <span class="method post">POST</span>
              <code>/api/delivery-status</code>
              <p>Обновление статуса доставки</p>
          </div>
  
          <div class="endpoint">
              <span class="method get">GET</span>
              <code>/api/get-history</code>
              <p>Получение истории чата</p>
          </div>
  
          <h2>🧪 Быстрый тест:</h2>
          <button class="test-button" onclick="testGetToken()">Получить токен</button>
          <button class="test-button" onclick="testDebugToken()">Отладить токен</button>
  
          <div id="results"></div>
  
          <h2>📖 Документация:</h2>
          <p>Полная документация доступна в README.md проекта.</p>
          <p>Используйте этот сервис для упрощения работы с AmoCRM Chat API из n8n и других платформ.</p>
      </div>
  
      <script>
          let currentToken = null;
  
          function log(message) {
              const results = document.getElementById('results');
              results.textContent += new Date().toLocaleTimeString() + ': ' + message + '\\n';
              results.scrollTop = results.scrollHeight;
          }
  
          async function testHealth() {
              try {
                  log('Проверка здоровья сервиса...');
                  const response = await fetch('/api/health');
                  const data = await response.json();
                  log('✅ Результат: ' + JSON.stringify(data, null, 2));
              } catch (error) {
                  log('❌ Ошибка: ' + error.message);
              }
          }
  
          async function testGetToken() {
              try {
                  log('Получение токена...');
                  const response = await fetch('/api/get-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                          channel_id: 'test-channel',
                          secret_key: 'test-secret',
                          account_id: 'test-account'
                      })
                  });
                  const data = await response.json();
                  if (data.token) {
                      currentToken = data.token;
                      log('✅ Токен получен: ' + data.token.substr(0, 16) + '...');
                  } else {
                      log('❌ Ошибка получения токена: ' + JSON.stringify(data, null, 2));
                  }
              } catch (error) {
                  log('❌ Ошибка: ' + error.message);
              }
          }
  
          async function testDebugToken() {
              if (!currentToken) {
                  log('❌ Сначала получите токен');
                  return;
              }
              
              try {
                  log('Отладка токена...');
                  const response = await fetch('/api/debug-token', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ token: currentToken })
                  });
                  const data = await response.json();
                  log('✅ Результат отладки: ' + JSON.stringify(data, null, 2));
              } catch (error) {
                  log('❌ Ошибка: ' + error.message);
              }
          }
      </script>
  </body>
  </html>
    `;
  
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  }