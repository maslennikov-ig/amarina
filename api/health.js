// api/health.js - Проверка здоровья API

export default async function handler(req, res) {
    const startTime = Date.now();
    
    try {
      // Проверяем доступность AmoCRM API
      const amoResponse = await fetch('https://amojo.amocrm.ru', {
        method: 'HEAD',
        timeout: 5000
      });
      
      const responseTime = Date.now() - startTime;
      
      return res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        response_time_ms: responseTime,
        services: {
          amocrm_api: {
            status: amoResponse.ok ? 'healthy' : 'degraded',
            response_code: amoResponse.status
          }
        },
        version: '1.0.0',
        endpoints: [
          'GET /api/health',
          'POST /api/get-token',
          'POST /api/send-message',
          'POST /api/create-chat',
          'POST /api/delivery-status',
          'GET /api/get-history',
          'POST /api/typing',
          'POST /api/react',
          'POST /api/disconnect',
          'POST /api/debug-token'
        ]
      });
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return res.status(500).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        response_time_ms: responseTime,
        error: error.message,
        services: {
          amocrm_api: {
            status: 'unreachable',
            error: error.message
          }
        }
      });
    }
  }