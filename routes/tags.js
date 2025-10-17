const { Router } = require('express');
const { query } = require('express-validator');

// controllers methods
const { createTag, deleteTag } = require('../controller/tags');

// middlewares
const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');

// Define routes
const router = Router();

router.post('/create/:contact_id', [
    query('keyAccess', 'The keyAccess is required').notEmpty(),
    query('contact_id', 'The contact_id is required').notEmpty(),
    query('tags', 'The name is required').notEmpty(),
    query('tags.*.name', 'The name must be a string').isString(),
    validateAccess,
    authLimiter
],
    createTag
);

router.delete('/delete/:contact_id', [
    query('keyAccess', 'The keyAccess is required').notEmpty(),
    query('contact_id', 'The contact_id is required').notEmpty(),
    query('tags', 'The name is required').notEmpty(),
    query('tags.*.name', 'The name must be a string').isString(),
    validateAccess,
    authLimiter
],
    deleteTag
);

module.exports = router;