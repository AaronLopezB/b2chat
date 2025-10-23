const { response } = require('express');

const B2ChatService = require('../services/b2chatService');

const createTag = async (req, res = response) => {
    const { tags } = req.body || {};
    const { contact_id } = req.params || {};
    const user = req.token.b2_token;

    try {
        if (!user) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario no autenticado'
            });
        }

        if (!contact_id || !contact_id) {
            return res.status(400).json({
                ok: false,
                msg: 'El contact_id es obligatorio'
            });
        }

        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'El tag es obligatorio y debe ser un arreglo no vacío'
            });
        }

        const tagData = { tags: tags, contact_id: contact_id };

        // console.log(tagData);

        const tagResponse = await B2ChatService.createTag(user, tagData);
        res.status(tagResponse.status).json({
            ok: tagResponse.ok,
            response: tagResponse.message
        });


    } catch (error) {
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
}

const deleteTag = async (req, res = response) => {
    const { tags } = req.body || {};
    const { contact_id } = req.params || {};
    const user = req.token.b2_token;
    try {

        if (!user) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario no autenticado'
            });
        }
        if (!contact_id || !contact_id) {
            return res.status(400).json({
                ok: false,
                msg: 'El contact_id es obligatorio'
            });
        }
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
            return res.status(400).json({
                ok: false,
                msg: 'El tag es obligatorio y debe ser un arreglo no vacío'
            });
        }
        const tagData = { tags: tags, contact_id: contact_id };

        const tagResponse = await B2ChatService.deleteTag(user, tagData);

        res.status(tagResponse.status).json({
            ok: tagResponse.ok,
            response: tagResponse.message
        });
    } catch (error) {
        res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        });
    }
};

module.exports = {
    createTag,
    deleteTag
}