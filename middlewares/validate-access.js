const { response, request } = require('express');


const validateAccess = async (req = request, res = response, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({
            msg: 'No token provided in the request'
        });
    }

    try {
        const user = await User.findOne({ keyAccess: token });

        if (!user) {
            return res.status(401).json({
                msg: 'Invalid token - user does not exist'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        console.log(error);
        return res.status(401).json({
            msg: 'Invalid token'
        });
    }
}

module.exports = {
    validateAccess
}