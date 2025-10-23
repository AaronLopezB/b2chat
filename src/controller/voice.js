const { response } = require('express');
const { queryPool } = require('../models/conexion');
const ApiVoiceService = require('../services/api-voice');

const generateCall = async (req, res = response) => {
    const {
        datetime,
        first_call_type,
        first_call_id,
        second_call_type,
        second_call_id,
        number_default,
        label,
    } = req.body;
    try {
        // Validaciones y sanitización para evitar inyecciones
        const MAX_LABEL_LENGTH = 255;
        const MAX_ID_LENGTH = 64;
        const TYPE_ALLOWLIST = ['ext', 'phone']; // ajustar según negocio

        const sanitizeLabel = (v) => {
            if (typeof v !== 'string') return '';
            // eliminar caracteres de control y acotar longitud
            return v.replace(/[\0\x08\x09\x1a\n\r]/g, '').trim().slice(0, MAX_LABEL_LENGTH);
        };

        const isValidType = (t) => {
            console.log(t, 'validation rule type');
            if (typeof t !== 'string') return false;

            return TYPE_ALLOWLIST.includes(t);
        };

        const isValidId = (id) => {
            if (typeof id === 'number') return true;
            if (typeof id !== 'string') return false;
            // permitir números, letras, guiones y guiones bajos, y acotar longitud
            return /^[0-9A-Za-z\-_]+$/.test(id) && id.length <= MAX_ID_LENGTH;
        };

        const isValidPhone = (p) => {
            if (typeof p === 'number') return true;
            if (typeof p !== 'string') return false;
            // E.164 o extensiones cortas (ajustar según necesidad)
            return /^\+?[1-9]\d{1,14}$/.test(p) || /^[0-9]{1,8}$/.test(p);
        };

        // validar datetime: 'now' o ISO válido
        let parsedDatetime;
        if (datetime === 'now') {
            parsedDatetime = new Date();
        } else if (typeof datetime === 'string' || typeof datetime === 'number') {
            const d = new Date(datetime);
            if (isNaN(d)) {
                return response.status(400).json({ ok: false, msg: 'Invalid datetime format' });
            }
            parsedDatetime = d;
        } else {
            return response.status(400).json({ ok: false, msg: 'Invalid datetime' });
        }

        // validar tipos y ids de llamadas
        if (!isValidType(first_call_type) || !isValidType(second_call_type)) {
            console.log(isValidType(second_call_type), isValidType(first_call_type));

            return response.status(400).json({ ok: false, msg: 'Invalid call type' });
        }
        if (!isValidId(first_call_id) || !isValidId(second_call_id)) {
            return response.status(400).json({ ok: false, msg: 'Invalid call id' });
        }

        // validar trunk / número por defecto
        if (number_default !== undefined && number_default !== null && !isValidPhone(number_default)) {
            return response.status(400).json({ ok: false, msg: 'Invalid default number' });
        }

        // sanitizar label
        const safeLabel = sanitizeLabel(label);

        // construir params de forma explícita (evitar copiar objetos del usuario)
        const params = {
            datetime: "now",
            first_call: {
                destination_type: first_call_type,
                destination_id: String(first_call_id)
            },
            second_call: {
                destination_type: second_call_type,
                destination_id: String(second_call_id)
            },
            preferred_trunk: number_default ? String(number_default) : null,
            label: safeLabel
        };

        const apiResponse = await ApiVoiceService.createCall(params, req.token.voice_token);

        return res.status(apiResponse.code || 500).json({
            ok: apiResponse.ok,
            msg: apiResponse.message ? apiResponse.message : 'Error creating call'
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            msg: 'talk to the admin'
        })
    }
}

module.exports = {
    generateCall
};