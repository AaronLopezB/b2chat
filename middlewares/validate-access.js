const { response, request } = require('express');

const { queryPool } = require('../models/conexion')

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