const axios = require('axios');
const qs = require('qs');
const { queryPool } = require('../models/conexion');
const { query } = require('express-validator');
const config = require('../config/app');
// const session = require('express-session');

class authService {
    constructor() {
        this.apiclient = config.b2Chat.baseUrl;
        this.apiclientuser = config.b2Chat.user;
        this.apiclientpassword = config.b2Chat.password;

    }

    async getOAuthToken() {

        try {
            const data = qs.stringify({
                grant_type: 'client_credentials'
            });

            // Codificar las credenciales en Base64 para Basic Auth
            const credentials = Buffer.from(`${this.apiclientuser}:${this.apiclientpassword}`).toString('base64');

            const response = await axios.post(
                `${this.apiclient}/oauth/token`,
                data,
                {
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json',
                    },
                }
            );


            return {
                ok: true,
                token: response.data.access_token
            };

        } catch (error) {
            console.log(error);
            return {
                ok: false,
                error: error.message
            };

        }

    }

    /**
       * Verificar si está autenticado
       */
    isAuthenticated() {
        return this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry;
    }

    veryfyToken(token) {
        console.log(this.accessToken, token);

        return token === this.accesstoken;
    }

    /**
     * Limpiar token
     */
    clearToken() {
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    /**
     * Verificar credenciales
     */
    hasCredentials() {
        return this.clientId && this.clientSecret;
    }
}

module.exports = new authService;