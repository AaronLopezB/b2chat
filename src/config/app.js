const data = {
    voice_api: {
        url: process.env.VOICE_SERVICE_API_URL || 'https://api-voice.ucc.systems/api',
        email: process.env.VOICE_SERVICE_API_EMAIL || 'tvg@ucc.systems',
        password: process.env.VOICE_SERVICE_API_PASSWORD || '6AqN3tBjWpZ4yLx'
    },
    database: {
        host: process.env.DATABASE_HOST || 'localhost',
        port: process.env.DATABASE_PORT || 3306,
        user: process.env.DATABASE_USER || 'root',
        password: process.env.DATABASE_PASS || '',
        name: process.env.DATABASE_NAME || 'b2chat_db',
        limit: process.env.DATABASE_CONN_LIMIT || 10
    },
    b2Chat: {
        baseUrl: process.env.B2CHAT_API_BASE_URL || 'https://api.b2chat.io/v1',
        user: process.env.B2CHAT_API_USER || '7c862232-f9ca-4d09-b87c-f0b8cf34002f',
        password: process.env.B2CHAT_API_PASSWORD || '739da6ec-6b84-4364-bfb2-a1273f92376b',
        numberPhone: process.env.B2CHAT_WHATSAPP_NUMBER || 'your_whatsapp_business_number'
    }
}

module.exports = data;
