const { response } = require('express');
const authService = require('../services/authService');
const ApiVoiceService = require('../services/api-voice');
const { queryPool } = require('../models/conexion');
const { token } = require('morgan');


// const { use } = require('../routes/auth');

const oauthToken = async (req, res = response) => {
    const keyAccess = req.body?.keyAccess || req.headers['x-api-key'] || req.query?.keyAccess;

    try {
        // User is set in the request by the validateAccess middleware

        // Generate OAuth token using the authService
        const loginData = await authService.getOAuthToken(user.id);

        res.json({
            ok: true,
            msg: 'get OAuth token',
            accessToken: loginData.token,
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

const registerUser = async (req, res = response) => {
    const { name, email } = req.body;

    try {
        const keyUnique = require('crypto').createHmac('sha256', process.env.SECRET_JWT_SEED)
            .update(Date.now().toString() + Math.random().toString())
            .digest('hex');

        const params = [
            name,
            email,
            keyUnique
        ];

        const newUser = await queryPool('INSERT INTO users (nombre_user,email_user,api_key) VALUES (?,?,?)', params);
        console.log(newUser);
        res.status(200).json({
            ok: true,
            user: {
                name,
                email,
                keyAccess: keyUnique
            }
        })

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msj: `error to register user, talk to the admin: ${error}`
        });

    }
}


const loginVoice = async (req, res = response) => {

    try {
        const loginApiVoice = await ApiVoiceService.logIn();

        if (!loginApiVoice.ok) {
            return res.status(loginApiVoice.code || 500).json({ ok: false, error: loginApiVoice.error });
        }

        return res.status(loginApiVoice.code).json({
            ok: true,
            message: loginApiVoice.result.message,
            token: loginApiVoice.result.data.token
        });

    } catch (error) {
        console.log({
            'method': "login auth voice",
            "error": error
        });

        return res.status(500).json({ ok: false, error: 'Internal server error' });

    }
}

module.exports = {
    oauthToken, registerUser, loginVoice
}