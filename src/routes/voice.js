const { Router } = require('express');
const { check } = require('express-validator');

// midlewares
const { authLimiter } = require('../middlewares/rate-limiter');
const { validateAccessVoice } = require('../middlewares/validate-access');

// controller
const {
    loginVoice
} = require('../controller/auth');
const { generateCall } = require('../controller/voice');


const router = Router();

router.post('/oauth/token/voice', [
    authLimiter
], loginVoice);

router.post('/call/generate', [
    validateAccessVoice,
], generateCall);

module.exports = router;