const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const getContacts = async (req, res = response) => {
    const { from, to, filter, search } = req.body || {};
    try {
        const allowedFilters = ['name', 'email', 'mobile'];
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        // Validate filter
        if (filter !== undefined && !allowedFilters.includes(filter)) {
            return res.status(400).json({
                ok: false,
                msg: `El filtro debe ser uno de: ${allowedFilters.join(', ')}`
            });
        }

        // Validate dates: either both undefined or both valid and from <= to
        if ((from !== undefined && to === undefined) || (to !== undefined && from === undefined)) {
            return res.status(400).json({
                ok: false,
                msg: 'Debe proporcionar ambas fechas "from" y "to" o ninguna'
            });
        }
        if (from !== undefined && to !== undefined) {
            if (!dateRegex.test(from) || !dateRegex.test(to)) {
                return res.status(400).json({
                    ok: false,
                    msg: 'Las fechas deben tener formato YYYY-MM-DD'
                });
            }
            const fromDate = new Date(from);
            const toDate = new Date(to);
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime()) || fromDate > toDate) {
                return res.status(400).json({
                    ok: false,
                    msg: '"from" debe ser anterior o igual a "to" y ambas deben ser fechas válidas'
                });
            }
        }

        // User from middleware
        const user = req.user && req.user[0];
        if (!user || !user.b2_token) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario no autenticado'
            });
        }

        // Build data object only with provided values
        const payload = {};
        if (from !== undefined) payload.from = from;
        if (to !== undefined) payload.to = to;
        if (filter !== undefined) payload.filter = filter;
        if (search !== undefined && String(search).trim() !== '') payload.search = String(search).trim();

        const contacts = await B2ChatService.getContacts(user.b2_token, payload);

        return res.status(200).json({
            ok: true,
            b2chatService: contacts
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

const createContact = async (req, res = response) => {

    const { fullname, email, mobile, landline, identification, address, country, city, company/* , custom_attributes */ } = req.body;

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
            company
            // custom_attributes
        }
        const b2_server = await B2ChatService.createContact(user.b2_token, { ...data });
        console.log(b2_server);

        if (!b2_server.ok) {

            return res.status(400).json({
                ok: false,
                msg: 'Error creating contact',
                errors: b2_server.error
            });
        }

        res.status(200).json({
            ok: true,
            b2_server: b2_server
        });


    } catch (error) {
        console.log(error);

        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

const updateContact = async (req, res = response) => {
    const { contact_id } = req.params;
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

        // console.log(data);

        const b2_server = await B2ChatService.updateContact(user.b2_token, contact_id, { ...data });

        console.log(b2_server);

    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    getContacts,
    createContact,
    updateContact
}