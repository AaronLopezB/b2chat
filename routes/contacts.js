const { Router } = require('express');
const { query } = require('express-validator');

// controllers methods
const {

    getContacts,
    createContact,
    updateContact

} = require('../controller/contacts');


// middlewares
const { validateAccess } = require('../middlewares/validate-access');
const { authLimiter } = require('../middlewares/rate-limiter');

// helpers
const { validateMobile } = require('../helpers/db-validator')

// Define routes
const router = Router();

// Get contacts
router.get('/',
    [
        validateAccess,
        query('keyAccess', 'The keyAccess is required').not().isEmpty(),
        authLimiter
    ], getContacts
);

// Create contact
router.post('/created',
    [
        query('keyAccess', 'The keyAccess is required').notEmpty(),
        query('fullname', 'The fullname is required').notEmpty(),
        query('mobile', 'The mobile is required').custom(validateMobile),
        query('landline', 'The landline is required').optional(),
        query('email', 'The email is required').isEmail(),
        query('identification', 'The identification is required').optional().isInt(),
        query('address', 'The address is required').optional(),
        query('country', 'The country is required').optional(),
        query('city', 'The city is required').optional(),
        query('company', 'The state is required').optional(),
        // query('custom_attributes', 'The custom_attributes is required').custom(validateCustomAttributes).optional(),
        // query('custom_attributes.*.name', 'Each custom attribute must have a valid name').optional().isString().notEmpty(),
        // query('custom_attributes.*.value', 'Each custom attribute must have a valid value').optional().isString().notEmpty(),
        validateAccess, authLimiter
    ],
    createContact
);

// Update contact
router.patch('/update/:contact_id',
    [
        query('keyAccess', 'The keyAccess is required').notEmpty(),
        query('contact_id', 'The contact_id is required').isInt(),
        query('fullname', 'The fullname is required').optional().notEmpty(),
        query('mobile', 'The mobile is required').optional().custom(validateMobile),
        query('landline', 'The landline is required').optional(),
        query('email', 'The email is required').optional().isEmail(),
        query('identification', 'The identification is required').optional().isInt(),
        query('address', 'The address is required').optional(),
        query('country', 'The country is required').optional(),
        query('city', 'The city is required').optional(),
        query('company', 'The state is required').optional(),
        // query('custom_attributes', 'The custom_attributes is required').custom(validateCustomAttributes).optional(),
        // query('custom_attributes.*.name', 'Each custom attribute must have a valid name').optional().isString().notEmpty(),
        // query('custom_attributes.*.value', 'Each custom attribute must have a valid value').optional().isString().notEmpty(),
        validateAccess, authLimiter

    ],
    updateContact
);

module.exports = router;