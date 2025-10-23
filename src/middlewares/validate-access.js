const { response, request } = require('express');
const b2_server = require('../services/b2chatService');
const ApiVoiceService = require('../services/api-voice');

const { queryPool } = require('../models/conexion');
// const { console } = require('inspector');

// Middleware to validate access via API key or user CRM ID
const crypto = require('crypto');

const validateAccess = async (req = request, res = response, next) => {
    const keyAccess = req.headers?.['x-api-key'] || req.headers?.['X-API-KEY'];
    const keyUser = req.body?._user || req.query?._user;

    if (!keyAccess && !keyUser) {
        return res.status(401).json({ ok: false, msg: 'No x-api-key or _user provided' });
    }

    try {
        // Buscar usuario por crm id (si viene) o por api_key (si sólo viene x-api-key)
        let rows;
        if (keyUser) {
            rows = await queryPool(`SELECT * FROM users WHERE user_crm_id = ? LIMIT 1`, [keyUser]);
        } else {
            rows = await queryPool(`SELECT * FROM users WHERE api_key = ? LIMIT 1`, [keyAccess]);
        }
        const user = Array.isArray(rows) ? (rows.length ? rows[0] : null) : rows;

        // Si existe pero no está activo
        if (user && user.activo && user.activo !== 'Activo') {
            return res.status(401).json({ ok: false, msg: 'User is not active' });
        }

        // Si no existe, crear usuario nuevo con token del servicio
        if (!user) {
            const apiKey = crypto.randomBytes(32).toString('hex');
            const tokenObj = await authService.getOAuthToken();
            const tokenValue = tokenObj?.token || tokenObj?.access_token || tokenObj?.b2_token;
            if (!tokenValue) {
                return res.status(500).json({ ok: false, msg: 'Failed to obtain token from auth service' });
            }

            await queryPool(
                `INSERT INTO users (api_key, b2_token, user_crm_id, activo) VALUES (?,?,?,?)`,
                [apiKey, tokenValue, keyUser || null, 'Activo']
            );

            req.token = { identity: apiKey, b2_token: tokenValue };
            return next();
        }

        // Usuario existe: validar/normalizar b2_token
        let b2Token = user.b2_token;
        let validation = { ok: false };
        if (b2Token) {
            validation = await validateTokenDB(type = 'b2', b2Token);
        }

        if (!validation.ok) {
            const tokenObj = await authService.getOAuthToken();
            const newToken = tokenObj?.token || tokenObj?.access_token || tokenObj?.b2_token;
            if (!newToken) {
                return res.status(500).json({ ok: false, msg: 'Failed to obtain new token from auth service' });
            }
            await queryPool(`UPDATE users SET b2_token = ? WHERE id = ?`, [newToken, user.id]);
            b2Token = newToken;
        } else {
            b2Token = validation.token;
        }

        // Si el request incluye x-api-key, verificar que corresponda al usuario encontrado
        if (keyAccess && keyAccess !== user.api_key) {
            return res.status(401).json({ ok: false, msg: 'Invalid x-api-key for this user' });
        }

        req.token = { identity: user.api_key, b2_token: b2Token };
        return next();
    } catch (error) {
        console.error('validateAccess error:', error);
        return res.status(500).json({ ok: false, msg: 'Server error validating access' });
    }
};

const validateTokenDB = async (type, keyAccess) => {
    try {
        if (type === 'b2') {
            const check_token = await b2_server.validateToken(keyAccess);

            if (!check_token || !check_token.ok) {
                const errMsg = check_token?.msg || check_token?.error || 'Invalid or expired token';
                return { ok: false, msg: errMsg, details: check_token };
            }

            // normalizar token si el servicio lo devuelve
            const normalized = check_token.access_token || check_token.token || check_token.b2_token || keyAccess;
            return { ok: true, token: normalized };
        }
        if (type === 'voice') {
            // Implementar validación para token de voice si es necesario
            // const check_token = await ApiVoiceService.validateToken(keyAccess);
        }
    } catch (err) {
        return { ok: false, msg: 'Validation service error', details: err };
    }
}


// Middleware to validate access voice API 

const validateAccessVoice = async (req = request, res = response, next) => {
    const keyUser = req.body?._user || req.query?._user;
    if (!keyUser) {
        return res.status(401).json({ ok: false, msg: 'No _user provided' });
    }
    try {
        const query = await queryPool(
            `SELECT * FROM users WHERE user_crm_id= ? LIMIT 1`,
            [keyUser]
        );

        const user = Array.isArray(query) ? (query.length ? query[0] : null) : query;

        if (user && user.activo && user.activo !== 'Activo') {
            return res.status(401).json({ ok: false, msg: 'User is not active' });
        }

        if (!user) {
            const apiKey = crypto.randomBytes(32).toString('hex');
            const tokenObj = await ApiVoiceService.logIn();
            const tokenValue = tokenObj?.result?.data?.token || tokenObj?.token || tokenObj?.access_token;
            if (!tokenValue) {
                return res.status(500).json({ ok: false, msg: 'Failed to obtain token from voice service' });
            }

            await queryPool(
                `INSERT INTO users (api_key, voice_token, user_crm_id, activo) VALUES (?,?,?,?)`,
                [apiKey, tokenValue, keyUser, 'Activo']
            );

            req.token = { identity: apiKey, voice_token: tokenValue };
            return next();
        }

        // If user exists, ensure we have a voice token; if missing, obtain and update it
        let voice_token = user.voice_token;
        if (!voice_token) {
            const tokenObj = await ApiVoiceService.logIn();
            const newToken = tokenObj?.result?.data?.token || tokenObj?.token || tokenObj?.access_token;
            if (!newToken) {
                return res.status(500).json({ ok: false, msg: 'Failed to obtain token from voice service' });
            }
            await queryPool(`UPDATE users SET voice_token = ? WHERE id = ?`, [newToken, user.id]);
            voice_token = newToken;
        }

        req.token = { identity: user.api_key, voice_token };
        return next();
    } catch (error) {
        console.error('validateAccessVoice error:', error);
        return res.status(500).json({ ok: false, msg: 'Server error validating voice access' });
    }
}


module.exports = {
    validateAccess,
    validateAccessVoice
}