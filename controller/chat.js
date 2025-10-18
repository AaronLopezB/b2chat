const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const getChats = async (req, res = response) => {

    const {
        contact_lookup,
        from,
        to,
        agent_lookup,
        email_recipient
    } = req.body;
    // User is set in the request by the validateAccess middleware
    const token = req.token;

    try {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

        if (contact_lookup !== '' && !contact_lookup) {
            return res.status(400).json({
                ok: false,
                msg: 'Missing contact_lookup'
            });
        }
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

        if (agent_lookup !== '' && agent_lookup !== null) {
            return res.status(400).json({
                ok: false,
                msg: 'Missing agent_lookup'
            });
        }
        if (email_recipient !== '' && !email_recipient) {
            return res.status(400).json({
                ok: false,
                msg: 'Missing email_recipient'
            });
        }

        const params = {
            contact_lookup: contact_lookup,
            // messaging_type: messaging_type,
            date_range: { from: from, to: to },
            agent_lookup: agent_lookup,
            email_recipient: email_recipient
        };

        const b2_server = await B2ChatService.getChats(token, params);
        console.log(b2_server);
        // res.status(200).json({
        //     ok: true,
        //     chats: b2_server.data.chats,
        //     msj: b2_server.data.message
        // });

    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

module.exports = {
    getChats
}