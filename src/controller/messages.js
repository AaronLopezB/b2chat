const { response } = require('express');
const B2ChatService = require('../services/b2chatService');

const sendMessage = async (req, res = response) => {
    const { from, to, template_name, campaign_name, header_url, values, broadcast_target } = req.body;
    const token = req.token.b2_token;
    try {
        const phoneRegex = /^\+[1-9]\d{1,14}$/;

        if (!from || from === '') {
            return res.status(400).json({
                ok: false,
                msg: 'El input "from" es requerido'
            });
        }
        if (!to || to === '') {
            return res.status(400).json({
                ok: false,
                msg: 'El input "to" es requerido'
            });
        }

        // Validar formato E.164: +<código de país><número>, p. ej. +57300274206

        if (!phoneRegex.test(from)) {
            return res.status(400).json({
                ok: false,
                msg: 'El formato de "from   " es inválido. Debe ser +<codigo de pais><numero>, por ejemplo +57300274206'
            });
        }

        if (!phoneRegex.test(to)) {
            return res.status(400).json({
                ok: false,
                msg: 'El formato de "to" es inválido. Debe ser +<codigo de pais><numero>, por ejemplo +57300274206'
            });
        }

        if (template_name === '' && !template_name) {
            return res.status(400).json({
                ok: false,
                msg: 'Missing template_name'
            });
        }

        const params = {
            "from": from,
            "to": to,
            "template_name": template_name,
            "campaign_name": campaign_name,
            "header_url": header_url,
            "values": values,
            "broadcast_target": broadcast_target
        }

        const response = await B2ChatService.sendMessage(token, params);

        if (!response.ok) {
            return res.status(500).json({
                ok: false,
                msg: response.error
            });
        }

        res.status(200).json(response);
        // const result = await B2ChatService.sendMessage(req.user.token, params);
        // return res.json(result);
    } catch (error) {
        console.log(error);

    }
}

const sendMessageV2 = async (req, res = response) => {
    // console.log('sendMessageV2 called');
    const { from, to, template_name, campaign_name, header_url, values, broadcast_target } = req.body;
    const token = req.token.b2_token;
    try {

        const messageData = {
            from,
            to,
            template_name,
            campaign_name,
            header_url,
            values,
            broadcast_target
        };

        const response = await B2ChatService.sendMessageV2(token, messageData);

        console.log({
            "method": "controller send message v2",
            "data": messageData,
            "response": response
        });

        // if (!response.ok) {
        //     return res.status(500).json({
        //         ok: false,
        //         msg: response.error


        // if (!response.ok) {
        //     return res.status(500).json({
        //         ok: false,
        //         msg: response.error
        //     });
        // }

        res.status(200).json(response);
    } catch (error) {
        console.log(error);

    }
}

module.exports = {
    sendMessage,
    sendMessageV2
};