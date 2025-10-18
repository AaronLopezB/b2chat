const { response, request } = require('express');
const b2_server = require('../services/b2chatService');
const authService = require('../services/authService');

const { queryPool } = require('../models/conexion');

const validateAccess = async (req = request, res = response, next) => {
    const keyAccess = req.body?.keyAccess || req.headers['x-api-key'] || req.query?.keyAccess;

    if (!keyAccess) {
        return res.status(401).json({ ok: false, msg: 'No keyAccess provided' });
    }

    try {
        let token = keyAccess;
        // const users = await queryPool('SELECT * FROM users WHERE api_key = ?', [keyAccess]);

        // if (!Array.isArray(users) || users.length === 0) {
        //     return res.status(401).json({ ok: false, msg: 'Invalid api key' });
        // }

        // let user = users[0];

        const check_token = await b2_server.validateToken(keyAccess);

        console.log(check_token);

        if (!check_token.ok) {
            // try to refresh token
            const loginData = await authService.getOAuthToken();
            console.log(loginData);

            if (!loginData || !loginData.ok) {
                return res.status(401).json({ ok: false, msg: 'Could not refresh B2 token' });
            }

            // normalize possible token fields and persist if present
            const newToken = loginData.access_token || loginData.token || loginData.b2_token;
            if (newToken) {
                try {
                    // await queryPool('UPDATE users SET b2_token = ? WHERE id = ?', [newToken, user.id]);
                    token = newToken;
                } catch (updateErr) {
                    console.error('Failed to persist refreshed token:', updateErr);
                    // not fatal for the request — continue with refreshed token in memory
                    token = newToken;
                }
            }
        }
        console.log(token);


        req.token = token;
        return next();
    } catch (error) {
        console.error('validateAccess error:', error);
        return res.status(500).json({ ok: false, msg: 'Server error validating access' });
    }
}

module.exports = {
    validateAccess
}