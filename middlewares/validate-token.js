const { response, request } = require('express');

const authService = require('../services/authService');

const validateAuthToken = (req = request, res = response, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({
            msjg: 'No token, authorization denied'
        });
    }

    try {
        const { access_token } = authService.veryfyToken(token);
        console.log(token);

        if (!access_token) {
            return res.status(401).json({
                msg: 'Token is not valid'
            });
        }
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            msg: 'Token is not valid'
        });
    }

}

module.exports = {
    validateAuthToken
}