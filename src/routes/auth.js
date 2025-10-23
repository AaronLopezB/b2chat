const { Router } = require('express');
const { check } = require('express-validator');

const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');
const {
    oauthToken,
} = require('../controller/auth');

const router = Router();

router.post('/oauth', [
    check('keyAccess', 'The la key acces is required').isEmail(),
    validateAccess,
    authLimiter
], oauthToken);



module.exports = router;