const { Schema, model } = require('mongoose');

const CompanySchema = Schema({

    name: {
        type: String,
        required: [true, 'Name is required']
    },
    state: {
        type: Boolean,
        default: true
    },
});

module.exports = model('Company', CompanySchema);