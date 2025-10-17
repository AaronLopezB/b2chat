const { response, request } = require('express');
const b2_server = require('../services/b2chatService');

const { queryPool } = require('../models/conexion');

const validateAccess = async (req = request, res = response, next) => {

    const { keyAccess } = req.body;

    if (!keyAccess) {
        return res.status(401).json({
            msg: 'No keyAccess provided in the request'
        });
    }

    try {
        const user = await queryPool('SELECT * FROM users WHERE api_key = ?', [keyAccess]);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msj: 'The user does not exist'
            });
        }


        const check_token = await b2_server.validateToken(user[0].b2_token);
        console.log(check_token, user[0].b2_token);
        if (!check_token.ok) {
            return res.status(401).json({
                ok: false,
                msg: 'Invalid B2 token'
            });
        }
        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            msg: 'Invalid keyAccess'
        });
    }
}

module.exports = {
    validateAccess
}