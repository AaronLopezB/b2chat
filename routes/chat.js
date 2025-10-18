const { Router } = require('express');
const { query } = require('express-validator');

const router = Router();

// controllers methods
const { getChats } = require('../controller/chat');

const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');


router.post('/history', [
    validateAccess, authLimiter,
    query('keyAccess', 'The keyAccess is required').notEmpty(),
], getChats);

module.exports = router;