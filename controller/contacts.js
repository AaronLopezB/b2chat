const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const getContacts = async (req, res = response) => {

    try {
        // User is set in the request by the validateAccess middleware
        const user = req.user[0];

        // Fetch contacts from B2ChatService using the user's b2_token
        const b2chatService = B2ChatService.getContacts(user.b2_token);

        res.status(200).json({
            ok: true,
            b2chatService: await b2chatService
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

const createContact = async (req, res = response) => {

    const { fullname, email, mobile, landline, identification, address, country, city, company, custom_attributes } = req.body;

    try {
        // User is set in the request by the validateAccess middleware
        const user = req.user[0];
        // Here you would typically call a service to create the contact in B2Chat
        // For example:
        // const result = await B2ChatService.createContact(user.b2_token, { fullname, email, mobile, landline, identification, address, country, city, company, custom_attributes }); 
        const data = {
            fullname,
            email,
            mobile,
            landline,
            identification,
            address,
            country,
            city,
            company,
            custom_attributes
        }
        const b2_server = B2ChatService.createContact(user.b2_token, { ...data });
        res.status(200).json({
            ok: true,
            b2_server: await b2_server
        });


    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

const updateContact = async (req, res = response) => {
    const { id } = req.params;
    const { fullname, email, mobile, landline, identification, address, country, city, company, custom_attributes } = req.body;
    try {

        // User is set in the request by the validateAccess middleware
        const user = req.user[0];
        // Here you would typically call a service to update the contact in B2Chat
        // For example:
        // const result = await B2ChatService.updateContact(user.b2_token, id, { fullname, email, mobile, landline, identification, address, country, city, company, custom_attributes }); 
        const data = {
            fullname,
            email,
            mobile,
            landline,
            identification,
            address,
            country,
            city,
            company,
            custom_attributes
        }


    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    getContacts,
    createContact,
    updateContact
}