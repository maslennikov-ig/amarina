# 🚀 AmoCRM Chat API Proxy

> Полнофункциональный прокси-сервис для работы с AmoCRM Chat API через простой REST интерфейс

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/maslennikov-ig/amarina)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 📋 Содержание

- [Проблема и решение](#-проблема-и-решение)
- [Возможности](#-возможности)
- [Архитектура](#-архитектура)
- [Быстрый старт](#-быстрый-старт)
- [API Reference](#-api-reference)
- [Примеры использования](#-примеры-использования)
- [Развертывание](#-развертывание)
- [Интеграция с n8n](#-интеграция-с-n8n)
- [Безопасность](#-безопасность)
- [Отладка](#-отладка)
- [FAQ](#-faq)

## 🎯 Проблема и решение

### Проблема
AmoCRM Chat API требует сложную HMAC-SHA1 подпись для каждого запроса:

```javascript
// Сложная схема подписи
const stringToSign = [
  method.toUpperCase(),
  md5(requestBody),
  'application/json',
  new Date().toUTCString(),
  requestPath
].join('\n');

const signature = crypto.createHmac('sha1', secretKey)
  .update(stringToSign)
  .digest('hex')
  .toLowerCase();
```

Это усложняет интеграцию в no-code платформах (n8n, Zapier, Make) и требует знания криптографии.

### Решение
Наш прокси-сервис скрывает всю сложность HMAC подписей и предоставляет простой REST API:

```bash
# Вместо сложных HMAC подписей
curl -X POST https://your-proxy.vercel.app/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123", "conversation_id": "chat1", "message": {...}}'
```

## ✨ Возможности

### 🔐 Аутентификация
- Токенная система (24 часа жизни)
- Автоматическая HMAC-SHA1 подпись
- Валидация и ротация токенов

### 💬 Сообщения
- Текстовые сообщения
- Файлы и медиа (изображения, видео, аудио)
- Стикеры и эмодзи
- Геолокация
- Контакты
- Ответы и пересылки

### 🎛️ Управление чатами
- Создание чатов
- История переписки
- Статусы доставки сообщений
- Индикатор "печатает"
- Реакции на сообщения

### 🔧 Интеграция
- RESTful API
- Подробное логирование
- Обработка ошибок
- CORS поддержка
- TypeScript типы (опционально)

## 🏗️ Архитектура

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    n8n      │    │   Vercel    │    │   AmoCRM    │
│  Workflow   │───▶│    Proxy    │───▶│  Chat API   │
│             │    │             │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
     │                     │                   │
     │                     │                   │
     ▼                     ▼                   ▼
Simple HTTP          HMAC Signing        Complex Auth
Requests             Token Management    Requirements
```

### Компоненты

- **API Gateway** - Vercel Functions
- **Token Store** - In-memory хранилище (production: Redis)
- **HMAC Engine** - Автоматическая подпись запросов
- **Logger** - Детальное логирование операций

## 🚀 Быстрый старт

### 1. Получение данных от AmoCRM

Для работы вам понадобятся:

```json
{
  "channel_id": "946f8594-6da3-4808-88ad-8712104ad807",
  "secret_key": "e26b6fc35758227429bf3fccb3633d11dd2ba693",
  "account_id": "d8c747de-5e21-4d09-b610-302aca86605a"
}
```

**Как получить:**
- `channel_id` и `secret_key` - регистрация канала в техподдержке AmoCRM
- `account_id` - через API: `/api/v4/account?with=amojo_id`

### 2. Получение токена

```bash
curl -X POST https://your-proxy.vercel.app/api/get-token \
  -H "Content-Type: application/json" \
  -d '{
    "channel_id": "946f8594-6da3-4808-88ad-8712104ad807",
    "secret_key": "e26b6fc35758227429bf3fccb3633d11dd2ba693",
    "account_id": "d8c747de-5e21-4d09-b610-302aca86605a",
    "title": "My Bot"
  }'
```

**Ответ:**
```json
{
  "success": true,
  "token": "a1b2c3d4e5f6...",
  "scope_id": "946f8594-6da3-4808-88ad-8712104ad807_d8c747de-5e21-4d09-b610-302aca86605a",
  "expires_in": 86400,
  "created_at": "2025-06-15T10:30:00.000Z"
}
```

### 3. Отправка сообщения

```bash
curl -X POST https://your-proxy.vercel.app/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "token": "a1b2c3d4e5f6...",
    "conversation_id": "chat-12345",
    "message": {
      "type": "text",
      "text": "Привет! Как дела?"
    },
    "sender": {
      "id": "bot-1",
      "name": "Помощник"
    }
  }'
```

## 📡 API Reference

### 🔑 Authentication

Все методы (кроме получения токена) требуют передачи `token` в теле запроса.

### Endpoints

#### `POST /api/get-token`

Получение токена доступа для работы с Chat API.

**Параметры:**
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| channel_id | string | ✅ | ID канала в AmoCRM |
| secret_key | string | ✅ | Секретный ключ канала |
| account_id | string | ✅ | amojo_id аккаунта |
| title | string | ❌ | Название канала (по умолчанию: "ArinaBot") |

**Ответ:**
```json
{
  "success": true,
  "token": "string",
  "scope_id": "string", 
  "expires_in": 86400,
  "created_at": "2025-06-15T10:30:00.000Z"
}
```

---

#### `POST /api/send-message`

Отправка сообщений в чат.

**Параметры:**
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| token | string | ✅ | Токен доступа |
| conversation_id | string | ✅ | ID беседы |
| message | object | ✅ | Объект сообщения |
| sender | object | ✅ | Информация об отправителе |
| receiver | object | ❌ | Информация о получателе |
| silent | boolean | ❌ | Тихая отправка (по умолчанию: false) |

**Типы сообщений:**

```json
// Текстовое сообщение
{
  "message": {
    "type": "text",
    "text": "Привет! Как дела?"
  }
}

// Изображение
{
  "message": {
    "type": "picture",
    "media": "https://example.com/image.jpg",
    "file_name": "image.jpg",
    "file_size": 1024000
  }
}

// Файл
{
  "message": {
    "type": "file",
    "media": "https://example.com/document.pdf",
    "file_name": "document.pdf", 
    "file_size": 2048000
  }
}

// Геолокация
{
  "message": {
    "type": "location",
    "location": {
      "lat": 55.7558,
      "lon": 37.6176
    }
  }
}

// Контакт
{
  "message": {
    "type": "contact",
    "contact": {
      "name": "Иван Иванов",
      "phone": "+79151234567"
    }
  }
}
```

---

#### `POST /api/create-chat`

Создание нового чата перед отправкой сообщений.

**Параметры:**
| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| token | string | ✅ | Токен доступа |
| conversation_id | string | ✅ | ID беседы |
| user | object | ✅ | Информация о пользователе |
| source | object | ❌ | Информация об источнике |

```json
{
  "token": "abc123...",
  "conversation_id": "chat-12345",
  "user": {
    "id": "user-1",
    "name": "Иван Петров",
    "avatar": "https://example.com/avatar.jpg",
    "profile": {
      "phone": "+79151234567",
      "email": "ivan@example.com"
    },
    "profile_link": "https://example.com/profile/ivan"
  }
}
```

---

#### `POST /api/delivery-status`

Обновление статуса доставки сообщения.

**Статусы:**
- `1` - Доставлено
- `2` - Прочитано  
- `-1` - Ошибка доставки

```json
{
  "token": "abc123...",
  "msgid": "message-id-123",
  "delivery_status": 1
}
```

---

#### `GET /api/get-history`

Получение истории чата.

**Query параметры:**
- `token` - Токен доступа
- `conversation_id` - ID беседы
- `limit` - Количество сообщений (по умолчанию: 50)
- `offset` - Смещение (по умолчанию: 0)

```bash
GET /api/get-history?token=abc123&conversation_id=chat-123&limit=20&offset=0
```

---

#### `POST /api/typing`

Отправка индикатора "печатает".

```json
{
  "token": "abc123...",
  "conversation_id": "chat-12345", 
  "sender": {
    "id": "user-1"
  }
}
```

---

#### `POST /api/react`

Добавление или удаление реакции на сообщение.

```json
{
  "token": "abc123...",
  "conversation_id": "chat-12345",
  "msgid": "message-123",
  "user": {
    "id": "user-1"
  },
  "type": "react", // или "unreact"
  "emoji": "👍"
}
```

---

#### `POST /api/disconnect`

Отключение канала от аккаунта.

```json
{
  "token": "abc123..."
}
```

## 💡 Примеры использования

### Чат-бот поддержки

```javascript
// 1. Получаем токен (один раз в 24 часа)
const tokenResponse = await fetch('/api/get-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    channel_id: process.env.AMOCRM_CHANNEL_ID,
    secret_key: process.env.AMOCRM_SECRET_KEY,
    account_id: process.env.AMOCRM_ACCOUNT_ID,
    title: 'Support Bot'
  })
});

const { token } = await tokenResponse.json();

// 2. Отправляем приветственное сообщение
await fetch('/api/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    conversation_id: `support-${userId}`,
    message: {
      type: 'text',
      text: 'Здравствуйте! Чем могу помочь?'
    },
    sender: {
      id: 'support-bot',
      name: 'Бот поддержки'
    }
  })
});
```

### Уведомления о заказах

```javascript
// Отправка информации о заказе
await fetch('/api/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token: savedToken,
    conversation_id: `order-${orderId}`,
    message: {
      type: 'text',
      text: `Заказ #${orderId} успешно оформлен!\nСумма: ${orderAmount} руб.\nДоставка: ${deliveryDate}`
    },
    sender: {
      id: 'order-system',
      name: 'Система заказов'
    }
  })
});
```

### Интеграция с CRM

```javascript
// Создание чата для нового лида
await fetch('/api/create-chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    conversation_id: `lead-${leadId}`,
    user: {
      id: `lead-${leadId}`,
      name: leadData.name,
      profile: {
        phone: leadData.phone,
        email: leadData.email
      }
    }
  })
});

// Отправка персонализированного сообщения
await fetch('/api/send-message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    token,
    conversation_id: `lead-${leadId}`,
    message: {
      type: 'text',
      text: `Здравствуйте, ${leadData.name}! Спасибо за интерес к нашим услугам.`
    },
    sender: {
      id: 'sales-manager',
      name: 'Менеджер по продажам'
    }
  })
});
```

## 🚀 Развертывание

### Vercel (рекомендуется)

1. **Клонируйте репозиторий:**
```bash
git clone https://github.com/your-username/amocrm-proxy
cd amocrm-proxy
```

2. **Установите Vercel CLI:**
```bash
npm i -g vercel
```

3. **Разверните:**
```bash
vercel
```

4. **Настройте переменные окружения (опционально):**
```bash
vercel env add AMOCRM_LOG_LEVEL
vercel env add REDIS_URL  # для production
```

### Netlify

1. **Создайте `netlify.toml`:**
```toml
[build]
  functions = "api"

[functions]
  node_bundler = "esbuild"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

2. **Разверните через GitHub интеграцию**

### Railway

```bash
railway login
railway init
railway up
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔗 Интеграция с n8n

### Workflow пример

```json
{
  "nodes": [
    {
      "name": "Get Token",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-proxy.vercel.app/api/get-token",
        "method": "POST",
        "body": {
          "channel_id": "{{$env.AMOCRM_CHANNEL_ID}}",
          "secret_key": "{{$env.AMOCRM_SECRET_KEY}}",
          "account_id": "{{$env.AMOCRM_ACCOUNT_ID}}"
        }
      }
    },
    {
      "name": "Send Message", 
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://your-proxy.vercel.app/api/send-message",
        "method": "POST",
        "body": {
          "token": "{{$node['Get Token'].json.token}}",
          "conversation_id": "{{$json.chat_id}}",
          "message": {
            "type": "text",
            "text": "{{$json.message_text}}"
          },
          "sender": {
            "id": "n8n-bot",
            "name": "N8N Bot"
          }
        }
      }
    }
  ]
}
```

### Настройка Credentials

В n8n создайте credential для хранения конфиденциальных данных:

1. **Settings → Credentials → Add Credential**
2. **Выберите "API Key"**
3. **Сохраните ваши данные AmoCRM**

## 🛡️ Безопасность

### Токены
- Время жизни: 24 часа
- Автоматическое удаление просроченных
- Уникальные токены для каждого запроса

### Валидация
- Проверка всех входящих параметров
- Санитизация данных
- Rate limiting (планируется)

### Логирование
- Никогда не логируются секретные ключи
- Только превью токенов (первые 8 символов)
- Структурированные логи для анализа

### CORS
- Настроенные заголовки для браузерных запросов
- Поддержка preflight запросов

### Рекомендации
- Используйте HTTPS
- Храните секретные ключи в переменных окружения
- Регулярно ротируйте токены
- Мониторьте логи на предмет подозрительной активности

## 🔧 Отладка

### Логи

Все операции логируются с префиксом `[AmoCRM Proxy]`:

```bash
# Vercel CLI
vercel logs

# Или в Vercel Dashboard
https://vercel.com/your-username/amocrm-proxy/functions
```

### Частые ошибки

#### 403 Forbidden
```json
{
  "error": "Подпись запроса некорректная"
}
```

**Решение:**
- Проверьте `secret_key`
- Убедитесь, что канал зарегистрирован
- Проверьте системное время

#### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

**Решение:**
- Получите новый токен через `/api/get-token`
- Проверьте время жизни токена

#### 400 Bad Request
```json
{
  "error": "Missing required fields: token, conversation_id, message, sender"
}
```

**Решение:**
- Проверьте обязательные поля
- Валидируйте формат данных

### Тестирование

#### Проверка подключения
```bash
curl -X POST https://your-proxy.vercel.app/api/get-token \
  -H "Content-Type: application/json" \
  -d '{"channel_id":"test","secret_key":"test","account_id":"test"}' \
  -v
```

#### Проверка подписи
```javascript
// Локальная проверка подписи
const crypto = require('crypto');

function testSignature(body, secret, path) {
  const bodyString = JSON.stringify(body);
  const date = new Date().toUTCString();
  const contentMd5 = crypto.createHash('md5').update(bodyString).digest('hex');
  
  const stringToSign = [
    'POST',
    contentMd5,
    'application/json',
    date,
    path
  ].join('\n');
  
  const signature = crypto.createHmac('sha1', secret)
    .update(stringToSign)
    .digest('hex')
    .toLowerCase();
    
  console.log('String to sign:', stringToSign);
  console.log('Signature:', signature);
}
```

### Мониторинг

#### Health Check
```bash
curl https://your-proxy.vercel.app/api/health
```

#### Метрики (планируется)
- Количество запросов
- Время ответа
- Успешность операций
- Использование токенов

## ❓ FAQ

### Общие вопросы

**Q: Сколько запросов в секунду поддерживает сервис?**
A: Ограничения Vercel: ~100 одновременных запросов. AmoCRM ограничивает до 20 запросов/сек на канал.

**Q: Можно ли использовать несколько каналов?**
A: Да, каждый канал требует отдельный токен.

**Q: Сколько хранятся токены?**
A: 24 часа. После истечения автоматически удаляются.

**Q: Поддерживаются ли групповые чаты?**
A: AmoCRM Chat API не поддерживает групповые чаты.

### Технические вопросы

**Q: Можно ли использовать в production?**
A: Да, но рекомендуется:
- Настроить Redis для хранения токенов
- Добавить мониторинг
- Настроить алерты

**Q: Как добавить rate limiting?**
A: Используйте Vercel Edge Functions или внешний сервис (Upstash Rate Limiting).

**Q: Поддерживается ли TypeScript?**
A: В планах. Пока можно добавить типы самостоятельно.

**Q: Как обновить до новой версии?**
A: Замените файлы и выполните `vercel deploy`.

### Интеграция

**Q: Работает ли с Zapier/Make?**
A: Да, как обычный REST API.

**Q: Можно ли использовать с React/Vue?**
A: Да, с настроенными CORS заголовками.

**Q: Как интегрировать с существующей системой?**
A: Используйте webhook или прямые HTTP запросы.

## 📝 Лицензия

MIT License - используйте свободно в коммерческих и личных проектах.

## 🤝 Поддержка

- **Issues**: [GitHub Issues](https://github.com/your-username/amocrm-proxy/issues)
- **Документация**: [Wiki](https://github.com/your-username/amocrm-proxy/wiki)
- **Email**: support@yourcompany.com

## 🙏 Благодарности

- AmoCRM за публичное API
- Vercel за бесплатный хостинг
- Сообществу n8n за вдохновение

---

**Сделано с ❤️ для упрощения интеграций с AmoCRM**