const { response } = require('express');
const authService = require('../services/authService');
const { pool } = require('../database/config');


// const { use } = require('../routes/auth');

const oauthToken = async (req, res = response) => {
    const { keyAccess } = req.body;

    try {

        const user = await pool.query('SELECT * FROM users WHERE keyAccess = $1', [keyAccess]).then(result => result.rows[0]);

        if (!user) {
            return res.status(400).json({
                ok: false,
                msj: 'The user does not exist'
            });
        }

        // Generate JWT Token

        // const token = await generateJWT(user.id);

        const loginData = await authService.getOAuthToken(user._id);
        // console.log(loginData);

        // Formatear la fecha a formato legible
        const tokenExpiresAtHuman = new Date(loginData.tokenExpiresAt).toLocaleString();

        res.json({
            ok: true,
            msg: 'get OAuth token',
            accessToken: loginData.b2chatToken,
            tokenExpiresAt: tokenExpiresAtHuman
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
    const { name } = req.body;

    try {
        const keyUnique = require('crypto').createHmac('sha256', process.env.SECRET_JWT_SEED)
            .update(Date.now().toString() + Math.random().toString())
            .digest('hex');

        // const user = new User({
        //     name,
        //     keyAccess: keyUnique
        // });

        // await user.save();
        // res.status(200).json({
        //     ok: true,
        //     user
        // });

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