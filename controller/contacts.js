const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const getContacts = async (req, res = response) => {
    const { b2token } = req.body;
    try {
        // console.log(b2token);

        const b2chatService = B2ChatService.getContacts(b2token);

        res.status(200).json({
            ok: true,
            b2chatService: await b2chatService
        })


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

module.exports = {
    getContacts
}