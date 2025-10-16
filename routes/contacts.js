const { Router } = require('express');
const { check } = require('express-validator');

// controllers methods
const {

    getContacts,
    createContact,
    updateContact

} = require('../controller/contacts');


// middlewares
const { validateAccess } = require('../middlewares/validate-access');

// helpers
const { validateMobile, validateCustomAttributes } = require('../helpers/db-validator')

// Define routes
const router = Router();

// Get contacts
router.get('/',
    [
        check('keyAccess', 'The keyAccess is required').not().isEmpty(),
        validateAccess
    ], getContacts
);

// Create contact
router.post('/created',
    [
        check('keyAccess', 'The keyAccess is required').notEmpty(),
        check('fullname', 'The fullname is required').notEmpty(),
        check('mobile', 'The mobile is required').custom(validateMobile),
        check('landline', 'The landline is required').optional(),
        check('email', 'The email is required').isEmail(),
        check('identification', 'The identification is required').optional().isInt(),
        check('address', 'The address is required').optional(),
        check('country', 'The country is required').optional(),
        check('city', 'The city is required').optional(),
        check('company', 'The state is required').optional(),
        check('custom_attributes', 'The custom_attributes is required').custom(validateCustomAttributes).optional(),
        check('custom_attributes.*.name', 'Each custom attribute must have a valid name').optional().isString().notEmpty(),
        check('custom_attributes.*.value', 'Each custom attribute must have a valid value').optional().isString().notEmpty(),
        validateAccess
    ],
    createContact
);

// Update contact
router.patch('/update/:id',
    [
        check('keyAccess', 'The keyAccess is required').notEmpty(),
        check('id', 'The id is required').isInt(),
        check('fullname', 'The fullname is required').optional().notEmpty(),
        check('mobile', 'The mobile is required').optional().custom(validateMobile),
        check('landline', 'The landline is required').optional(),
        check('email', 'The email is required').optional().isEmail(),
        check('identification', 'The identification is required').optional().isInt(),
        check('address', 'The address is required').optional(),
        check('country', 'The country is required').optional(),
        check('city', 'The city is required').optional(),
        check('company', 'The state is required').optional(),
        check('custom_attributes', 'The custom_attributes is required').custom(validateCustomAttributes).optional(),
        check('custom_attributes.*.name', 'Each custom attribute must have a valid name').optional().isString().notEmpty(),
        check('custom_attributes.*.value', 'Each custom attribute must have a valid value').optional().isString().notEmpty(),
        validateAccess
    ],
    updateContact
);

module.exports = router;