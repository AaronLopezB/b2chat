const { response } = require('express');
const authService = require('../services/authService');
// const { use } = require('../routes/auth');

const oauthToken = async (req, res = response) => {
    try {
        const loginData = await authService.getOAuthToken();
        res.json({
            ok: true,
            msg: 'get OAuth token',
            loginData
        });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

module.exports = {
    oauthToken
}