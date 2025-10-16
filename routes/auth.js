const { Router } = require('express');
const { check } = require('express-validator');

const { validateAccess } = require('../middlewares/validate-access');

const {
    oauthToken,
    registerUser
} = require('../controller/auth');

const router = Router();

router.post('/oauth', [
    check('keyAccess', 'The la key acces is required').isEmail(),
    validateAccess,
], oauthToken);

router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),

], registerUser);

module.exports = router;