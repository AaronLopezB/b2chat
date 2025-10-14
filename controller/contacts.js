const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const getContacts = async (req, res = response) => {
    try {
        const token = req.header('x-auth-token');
        console.log(token);

    } catch (error) {

    }
}

module.exports = {
    getContacts
}