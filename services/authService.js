const axios = require('axios');
const qs = require('qs');
const { queryPool } = require('../models/conexion');
const { query } = require('express-validator');
// const session = require('express-session');

class authService {
    constructor() {
        this.apiclient = process.env.B2CHAT_API_BASE_URL;
        this.apiclientuser = process.env.B2CHAT_API_USER;
        this.apiclientpassword = process.env.B2CHAT_API_PASSWORD;
        // this.accesstoken = null;
        // this.tokenExpiry = null;
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
                    // timeout: 10000,
                }
            );

            // // Calcular la fecha de expiración del token (actual + duración en segundos)
            const expiresIn = response.data.expires_in || 3600; // Valor por defecto de 1 hora si no se proporciona
            const tokenExpiry = Date.now() + (expiresIn * 1000) - 60000; // Restar 1 minuto para mayor seguridad

            // const dataClient = {
            //     b2chatToken: response.data.access_token,
            //     tokenExpiresAt: new Date(tokenExpiry)
            // }

            // const userUpdated = await queryPool('UPDATE users SET b2_token = ? WHERE id = ?', [dataClient.b2chatToken, user]);
            // console.log(response, userUpdated.affectedRows);
            console.log(response);

            return {
                ok: true,
                // user: userUpdated.affectedRows,
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