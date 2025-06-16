// api/debug-token.js - Эндпоинт для отладки токенов

const { validateToken, log } = require('./utils');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    log('Debug token request', { 
      token_preview: token.substr(0, 16) + '...',
      token_length: token.length 
    });

    const validation = validateToken(token);
    
    if (validation.valid) {
      const { data } = validation;
      
      log('Token validation successful', {
        scope_id: data.scope_id,
        channel_id: data.channel_id,
        account_id: data.account_id,
        created: new Date(data.created).toISOString(),
        expires: new Date(data.expires).toISOString(),
        valid_for_seconds: Math.floor((data.expires - Date.now()) / 1000)
      });

      return res.json({
        success: true,
        valid: true,
        token_info: {
          scope_id: data.scope_id,
          channel_id: data.channel_id,
          account_id: data.account_id,
          title: data.title,
          created: new Date(data.created).toISOString(),
          expires: new Date(data.expires).toISOString(),
          valid_for_seconds: Math.floor((data.expires - Date.now()) / 1000),
          valid_for_hours: Math.floor((data.expires - Date.now()) / (1000 * 60 * 60))
        }
      });
    } else {
      log('Token validation failed', { error: validation.error });
      
      return res.json({
        success: true,
        valid: false,
        error: validation.error
      });
    }

  } catch (error) {
    log('Debug token error', { error: error.message, stack: error.stack });
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}