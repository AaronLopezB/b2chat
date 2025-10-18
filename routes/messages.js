const { Router } = require('express');
const { query } = require('express-validator');

const router = Router();

// controllers methods
const { sendMessage } = require('../controller/messages');

const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');

router.post('/send', [
    validateAccess, authLimiter,
    query('keyAccess', 'The keyAccess is required').notEmpty(),
    // query('from', 'The from is required').notEmpty().isISO8601().withMessage('El input "from" debe ser una fecha ISO (YYYY-MM-DD)'),
    // query('to', 'The to is required').notEmpty().isISO8601().withMessage('El input "to" debe ser una fecha ISO (YYYY-MM-DD)'),
    // query('template_name', 'The template_name is required').notEmpty(),
    // query('campaign_name', 'The campaign_name is required').optional(),
    // query('header_url', 'The header_url is required').optional(),
    // query('values.*', 'The values is required').optional()
], sendMessage);

module.exports = router;