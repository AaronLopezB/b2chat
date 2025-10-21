const { Router } = require('express');
const { query } = require('express-validator');

// controllers methods
const { getChats } = require('../controller/chat');

// middlewares
const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');
const { historyEvents } = require('../middlewares/history-events');

const router = Router();

router.post('/history', [
    query('keyAccess', 'The keyAccess is required').notEmpty(),
    validateAccess, authLimiter, historyEvents
], getChats);

module.exports = router;