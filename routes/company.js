const { Router } = require('express');
const { check } = require('express-validator');

const {
    getAllCompanies,
    createCompany
} = require('../controller/company');

const router = Router();

router.get('/all', [], getAllCompanies);

router.post('/created',
    [
        check('name', 'Name is required').not().isEmpty(),
    ], createCompany);

module.exports = router;