const { response, request } = require('express');
const b2_server = require('../services/b2chatService');
const authService = require('../services/authService');


const { queryPool } = require('../models/conexion');
const { console } = require('inspector');

const validateAccess = async (req = request, res = response, next) => {
    const keyAccess = req.body?.keyAccess || req.headers['x-api-key'] || req.query?.keyAccess;

    console.log(keyAccess, req.headers);

    if (!keyAccess) {
        return res.status(401).json({ ok: false, msg: 'No x-api-key provided' });
    }

    try {
        // buscar usuario por token
        const result = await queryPool(
            `SELECT * FROM users WHERE b2_token = ? AND activo = ? LIMIT 1`,
            [keyAccess, 'Activo']
        );
        const user = Array.isArray(result) ? (result.length ? result[0] : null) : result;

        if (user) {
            // validar token con servicio B2
            const validate_token = await validateTokenDB(user.b2_token);

            if (!validate_token.ok) {
                if (keyAccess === result?.b2_token) {
                    console.log('token exist compar');

                    req.token = {
                        identity: user.api_key,
                        b2_token: result.b2_token
                    };
                }
                // token en DB inválido/expirado -> obtener uno nuevo y actualizar DB
                const tokenObj = await authService.getOAuthToken();
                const newToken = tokenObj?.token || tokenObj?.access_token || tokenObj?.b2_token;
                if (!newToken) {
                    return res.status(500).json({ ok: false, msg: 'Failed to obtain new token from auth service' });
                }
                await queryPool('UPDATE users SET b2_token = ? WHERE id = ?', [newToken, user.id]);
                console.log();

                req.token = {
                    identity: user.api_key,
                    b2_token: newToken
                };
            } else {
                // token válido, usar valor normalizado devuelto por la validación
                req.token = {
                    identity: user.api_key,
                    b2_token: validate_token.token
                };
            }
        } else {
            // Si no existe en DB, crear nuevo usuario con token del servicio
            const keyUnique = require('crypto').createHmac('sha256', process.env.SECRET_JWT_SEED || 'default_seed')
                .update(Date.now().toString() + Math.random().toString())
                .digest('hex');

            const tokenObj = await authService.getOAuthToken();

            const tokenValue = tokenObj?.token || tokenObj?.access_token || tokenObj?.b2_token;
            if (!tokenValue) {
                return res.status(500).json({ ok: false, msg: 'Failed to obtain token from auth service' });
            }

            const newUser = await queryPool('INSERT INTO users (api_key, b2_token) VALUES (?,?)', [keyUnique, tokenValue]);

            const insertId = keyUnique ?? null;

            req.token = {
                identity: insertId,
                b2_token: tokenValue
            };
        }

        return next();
    } catch (error) {
        console.error('validateAccess error:', error);
        return res.status(500).json({ ok: false, msg: 'Server error validating access' });
    }
}

const validateTokenDB = async (keyAccess) => {
    try {
        const check_token = await b2_server.validateToken(keyAccess);

        if (!check_token || !check_token.ok) {
            const errMsg = check_token?.msg || check_token?.error || 'Invalid or expired token';
            return { ok: false, msg: errMsg, details: check_token };
        }

        // normalizar token si el servicio lo devuelve
        const normalized = check_token.access_token || check_token.token || check_token.b2_token || keyAccess;
        return { ok: true, token: normalized };
    } catch (err) {
        return { ok: false, msg: 'Validation service error', details: err };
    }
}



module.exports = {
    validateAccess
}