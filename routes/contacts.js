const { Router } = require('express');

const { getContacts } = require('../controller/contacts');
const { validateAuthToken } = require('../middlewares/validate-token');

const router = Router();
router.get('/',
    [
        validateAuthToken
    ], getContacts
);
module.exports = router;