const fs = require('fs');
const path = require('path');


let swaggerJsdoc;

try {
    swaggerJsdoc = require('swagger-jsdoc');
} catch (error) {
    // logger.warn('Paquete swagger-jsdoc no encontrado. La documentación Swagger se deshabilitará si no se puede generar desde Postman.', {
    //     error: error.message,
    // });
    console.log('Paquete swagger-jsdoc no encontrado. La documentación Swagger se deshabilitará si no se puede generar desde Postman.', {
        error: error.message,
    });

}

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Facturacion API',
            version: '1.0.0',
        },
    },
    apis: [path.join(__dirname, '../routes/*.js')],
};

const fallbackSpec = {
    ...options.definition,
    paths: {},
};

const postmanCollectionPath = path.join(__dirname, '../../docs/B2-chat.postman_collection.json');

function toArray(value) {
    if (!value) {
        return [];
    }

    return Array.isArray(value) ? value : [value];
}

function extractDescription(description) {
    if (!description) {
        return undefined;
    }

    if (typeof description === 'string') {
        return description;
    }

    if (typeof description === 'object') {
        if (typeof description.content === 'string') {
            return description.content;
        }

        if (typeof description.description === 'string') {
            return description.description;
        }
    }

    return undefined;
}

function sanitizeOperationId(value) {
    return value
        .replace(/[^A-Za-z0-9_]/g, '_')
        .replace('/+/g', '')
        .replace('/^+|+$/g', '')
        .toLowerCase();
}

function buildPathFromUrl(url) {
    if (!url) {
        return undefined;
    }

    let rawValue;

    if (typeof url === 'string') {
        rawValue = url;
    } else if (url.raw) {
        rawValue = url.raw;
    } else if (Array.isArray(url.path)) {
        rawValue = `/${url.path.join('/')}/`;
    }

    if (!rawValue) {
        return undefined;
    }

    let pathValue = rawValue;

    const httpIndex = rawValue.indexOf('://');
    if (httpIndex !== -1) {
        const firstSlash = rawValue.indexOf('/', httpIndex + 3);
        pathValue = firstSlash !== -1 ? rawValue.slice(firstSlash) : '/';
    }

    if (!pathValue.startsWith('/')) {
        const slashIndex = pathValue.indexOf('/');
        if (slashIndex !== -1) {
            pathValue = pathValue.slice(slashIndex);
        } else {
            pathValue = `/${pathValue}`;
        }
    }

    pathValue = pathValue
        .replace(/\{\{([^}]+)\}\}/g, '{$1}')
        .replace(/:([A-Za-z0-9_]+)/g, '{$1}')
        .replace(/\?(.*)$/, '')
        .replace(/\/+/g, '/');

    if (pathValue.length > 1 && pathValue.endsWith('/')) {
        pathValue = pathValue.slice(0, -1);
    }

    return pathValue || '/';
}

function buildPathParameters(pathValue) {
    const matches = pathValue.match(/\{([^}]+)\}/g);

    if (!matches) {
        return [];
    }

    return matches.map((match) => {
        const name = match.slice(1, -1);
        return {
            name,
            in: 'path',
            required: true,
            schema: { type: 'string' },
        };
    });
}

function inferSchemaFromValue(value) {
    if (value === null) {
        return { type: 'string', nullable: true };
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return { type: 'array', items: {} };
        }

        return {
            type: 'array',
            items: inferSchemaFromValue(value[0]),
        };
    }

    switch (typeof value) {
        case 'number':
            return Number.isInteger(value) ? { type: 'integer' } : { type: 'number' };
        case 'boolean':
            return { type: 'boolean' };
        case 'object': {
            const properties = {};
            const required = [];

            Object.entries(value).forEach(([key, val]) => {
                properties[key] = inferSchemaFromValue(val);
                required.push(key);
            });

            return {
                type: 'object',
                properties,
                required: required.length ? required : undefined,
            };
        }
        default:
            return { type: 'string' };
    }
}

function buildRequestBody(body) {
    if (!body) {
        return undefined;
    }

    if (body.mode === 'raw' && typeof body.raw === 'string' && body.raw.trim()) {
        const rawValue = body.raw.trim();
        let mediaType = 'text/plain';
        let example = rawValue;
        let schema = { type: 'string' };

        try {
            const parsed = JSON.parse(rawValue);
            schema = inferSchemaFromValue(parsed);
            example = parsed;
            mediaType = 'application/json';
        } catch (error) {
            mediaType = 'text/plain';
        }

        return {
            required: true,
            description: extractDescription(body.description),
            content: {
                [mediaType]: {
                    schema,
                    example,
                },
            },
        };
    }

    if (body.mode === 'formdata' && Array.isArray(body.formdata) && body.formdata.length > 0) {
        const properties = {};
        const required = [];

        body.formdata.forEach((field) => {
            if (!field || !field.key) {
                return;
            }

            properties[field.key] = { type: 'string' };
            if (!field.disabled) {
                required.push(field.key);
            }
        });

        return {
            required: required.length > 0,
            description: extractDescription(body.description),
            content: {
                'multipart/form-data': {
                    schema: {
                        type: 'object',
                        properties,
                        required: required.length ? required : undefined,
                    },
                },
            },
        };
    }

    return undefined;
}

function buildHeaderParameters(headers) {
    return toArray(headers)
        .filter((header) => header && header.key)
        .map((header) => {
            const parameter = {
                name: header.key,
                in: 'header',
                required: header.disabled !== true,
                description: extractDescription(header.description),
                schema: { type: 'string' },
            };

            if (header.value !== undefined) {
                parameter.example = header.value;
            }

            return parameter;
        });
}

function buildQueryParameters(query) {
    return toArray(query)
        .filter((param) => param && param.key)
        .map((param) => {
            const required = param.disabled !== true && param.value === undefined;
            const parameter = {
                name: param.key,
                in: 'query',
                required,
                description: extractDescription(param.description),
                schema: { type: 'string' },
            };

            if (param.value !== undefined) {
                parameter.example = param.value;
            }

            return parameter;
        });
}

function dedupeParameters(parameters) {
    const map = new Map();

    parameters.forEach((parameter) => {
        if (!parameter) {
            return;
        }

        const key = `${parameter.in}: ${parameter.name}`;
        if (!map.has(key)) {
            map.set(key, parameter);
        }
    });

    return Array.from(map.values());
}

function buildResponseContent(body) {
    if (typeof body !== 'string' || !body.trim()) {
        return undefined;
    }

    const trimmed = body.trim();

    try {
        const parsed = JSON.parse(trimmed);
        return {
            'application/json': {
                schema: inferSchemaFromValue(parsed),
                example: parsed,
            },
        };
    } catch (error) {
        return {
            'text/plain': {
                schema: { type: 'string' },
                example: trimmed,
            },
        };
    }
}

function buildResponses(responses, fallbackDescription) {
    const result = {};

    toArray(responses).forEach((response) => {
        if (!response) {
            return;
        }

        const statusCode = String(response.code || 200);
        const description = response.name || extractDescription(response.description) || fallbackDescription || 'Respuesta exitosa';
        const content = buildResponseContent(response.body);

        const entry = { description };

        if (content) {
            entry.content = content;
        }

        result[statusCode] = entry;
    });

    if (Object.keys(result).length === 0) {
        result['200'] = {
            description: fallbackDescription || 'Respuesta exitosa',
        };
    }

    return result;
}

function extractServers(collection) {
    const variables = toArray(collection.variable);
    const servers = variables
        .filter((variable) => typeof variable?.value === 'string' && /^https?:\/\//.test(variable.value))
        .map((variable) => ({
            url: variable.value,
            description: extractDescription(variable.description) || `Variable ${variable.key}`,
        }));

    if (servers.length === 0) {
        servers.push({
            url: 'http://localhost:4000',
            description: 'Servidor local por defecto',
        });
    }

    return servers;
}

function convertCollectionToOpenApi(collection) {
    if (!collection || !Array.isArray(collection.item)) {
        return undefined;
    }

    const paths = {};
    const tagsSet = new Set();

    const processItems = (items, parentTags = []) => {
        if (!Array.isArray(items)) {
            return;
        }

        items.forEach((element) => {
            if (!element) {
                return;
            }

            if (Array.isArray(element.item)) {
                processItems(element.item, [...parentTags, element.name].filter(Boolean));
                return;
            }

            if (!element.request) {
                return;
            }

            const request = element.request;
            const method = (request.method || 'get').toLowerCase();
            const pathValue = buildPathFromUrl(request.url);

            if (!pathValue) {
                return;
            }

            const description = extractDescription(request.description);
            const operationId = sanitizeOperationId(`${method}_${pathValue}`);
            const requestBody = buildRequestBody(request.body);
            const headerParameters = buildHeaderParameters(request.header);
            const queryParameters = buildQueryParameters(request.url && request.url.query);
            const pathParameters = buildPathParameters(pathValue);
            const parameters = dedupeParameters([...headerParameters, ...queryParameters, ...pathParameters]);

            if (!paths[pathValue]) {
                paths[pathValue] = {};
            }

            const tags = parentTags.length ? [parentTags[parentTags.length - 1]] : undefined;
            if (tags) {
                tags.forEach((tag) => tagsSet.add(tag));
            }

            paths[pathValue][method] = {
                tags,
                summary: element.name,
                description,
                operationId: operationId || undefined,
                parameters: parameters.length ? parameters : undefined,
                requestBody,
                responses: buildResponses(element.response, description),
            };
        });
    };

    processItems(collection.item);

    const info = {
        title: collection.info?.name || options.definition.info.title,
        version: collection.info?.version || options.definition.info.version,
        description: extractDescription(collection.info?.description),
    };

    const openapi = {
        openapi: '3.0.0',
        info,
        servers: extractServers(collection),
        paths,
    };

    if (tagsSet.size > 0) {
        openapi.tags = Array.from(tagsSet).map((tag) => ({ name: tag }));
    }

    return openapi;
}

function generateSpec() {
    if (!fs.existsSync(postmanCollectionPath)) {
        // logger.warn('Colección de Postman no encontrada. Se utilizará la documentación generada con swagger-jsdoc.', {
        //     path: postmanCollectionPath,
        // });
        console.log('Colección de Postman no encontrada. Se utilizará la documentación generada con swagger-jsdoc.', {
            path: postmanCollectionPath,
        });

        return undefined;
    }

    try {
        const rawCollection = fs.readFileSync(postmanCollectionPath, 'utf8');
        const collection = JSON.parse(rawCollection);
        const spec = convertCollectionToOpenApi(collection);

        if (spec) {
            // logger.info('Documentación generada a partir de la colección de Postman.', {
            //     source: postmanCollectionPath,
            // });

            console.log(`Documentación generada a partir de la colección de Postman.`, {
                source: postmanCollectionPath,
            });

            return spec;
        }

        // logger.warn('No fue posible convertir la colección de Postman a OpenAPI. Se utilizará la documentación generada con swagger-jsdoc.');
        console.log(`No fue posible convertir la colección de Postman a OpenAPI. Se utilizará la documentación generada con swagger-jsdoc.`, {
            source: postmanCollectionPath,
        });

    } catch (error) {
        console.log(`Error al procesar la colección de Postman.`, {
            error: error.message,
        });
    }

    return undefined;
}

const postmanSpec = generateSpec();

module.exports = postmanSpec || (swaggerJsdoc ? swaggerJsdoc(options) : fallbackSpec);