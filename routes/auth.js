const { Router } = require('express');
const { check } = require('express-validator');

const { oauthToken } = require('../controller/auth');
const router = Router();

router.get('/oauth', [], oauthToken);

module.exports = router;