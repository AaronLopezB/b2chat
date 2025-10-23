// imports
const axios = require('axios');
const config = require('../config/app');
// const { fetch } = require('node-fetch');
const https = require('https');

class ApiVoiceService {
    constructor() {
        this.baseUrl = config.voice_api.url;
        this.username = config.voice_api.email;
        this.password = config.voice_api.password;
        // Desactivar la verificación del certificado SSL (no recomendado para producción)
        this.agent = new https.Agent({
            rejectUnauthorized: false
        });
    }

    async logIn() {
        try {

            const response = await axios.post(`${this.baseUrl}/oauth/token`, {
                email: this.username,
                password: this.password
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                httpsAgent: this.agent // Usar el agente personalizado
            });

            return {
                code: response.status,
                ok: true,
                result: response.data
            };

        } catch (error) {
            throw error;
        }
    }

    async createCall(data, token) {
        try {
            const params = JSON.stringify(data);
            const response = await axios.post(`${this.baseUrl}/calls/dial`, params, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                httpsAgent: this.agent // Usar el agente personalizado
            });
            return {
                ok: true,
                code: response.status,
                result: response.data.message
            };
        } catch (error) {
            return {
                ok: false,
                message: "Error sending Message",
                response: error,
                code: 500
            }
        }
    }
}

module.exports = new ApiVoiceService;