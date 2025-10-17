const { Router } = require('express');
const { query } = require('express-validator');

const router = Router();

// controllers methods
const { getChats } = require('../controller/chat');

const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');


router.get('/history', [
    query('keyAccess', 'The keyAccess is required').notEmpty(),
    // query('contact_id', 'The contact_id is required').notEmpty(),
    // query('limit', 'The limit must be a number').optional().isNumeric(),
    // query('offset', 'The offset must be a number').optional().isNumeric(),
    validateAccess, authLimiter
], getChats);

module.exports = router;