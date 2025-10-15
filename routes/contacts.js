const { Router } = require('express');

const { getContacts } = require('../controller/contacts');
const { validateAccess } = require('../middlewares/validate-access');
const { check } = require('express-validator');

const router = Router();
router.get('/',
    [
        check('b2token', 'The b2token is required').not().isEmpty(),
        validateAccess
    ], getContacts
);
module.exports = router;