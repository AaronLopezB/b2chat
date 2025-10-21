const { response } = require('express');
const authService = require('../services/authService');
const { queryPool } = require('../models/conexion');


// const { use } = require('../routes/auth');

const oauthToken = async (req, res = response) => {


    try {
        // User is set in the request by the validateAccess middleware
        const token = req.token.b2_token;

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


module.exports = {
    oauthToken, registerUser
}