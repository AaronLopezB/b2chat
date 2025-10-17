const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const getChats = async (req, res = response) => {

    const { keyAccess,
        contact_lookup,
        messaging_type,
        date_range,
        agent_lookup,
        email_recipient
    } = req.query;
    // User is set in the request by the validateAccess middleware
    const user = req.user[0];
    try {

        const b2_server = await B2ChatService.getContacts(user.b2_token, { limit, offset, filter: 'id', search: contact_id });
        console.log(b2_server);

    } catch (error) {

    }
}

module.exports = {
    getChats
}