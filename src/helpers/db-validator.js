const validateMobile = (mobile) => {
    // exige '+' seguido de 2–15 dígitos (primer dígito no 0), p.ej. +573002742061
    const mobileRegex = /^\+[1-9]\d{1,14}$/;
    return mobileRegex.test(mobile);
};

const validateCustomAttributes = (customAttributes) => {
    // Permite null/undefined (nullable) o un arreglo de objetos { name: string, value: string }
    if (customAttributes === null || customAttributes === undefined) {
        return true;
    }

    if (!Array.isArray(customAttributes)) {
        throw new Error('Custom attributes must be an array of objects or null');
    }

    for (let i = 0; i < customAttributes.length; i++) {
        const attr = customAttributes[i];

        if (typeof attr !== 'object' || attr === null) {
            throw new Error(`Custom attribute at index ${i} must be an object`);
        }

        const { name, value } = attr;

        if (typeof name !== 'string' || name.trim() === '') {
            throw new Error(`Custom attribute at index ${i} has an invalid "name"`);
        }

        if (typeof value !== 'string' || value.trim() === '') {
            throw new Error(`Custom attribute "${name}" has an invalid "value"`);
        }
    }

    return true;
};

const validateFilter = (filter) => {
    const allowedFilters = ['name', 'email', 'mobile'];
    if (allowedFilters.includes(filter)) {
        return true;
    }
    else {
        throw new Error(`Filter must be one of: ${allowedFilters.join(', ')}`);
    }
    // return true;
}

module.exports = {
    validateMobile,
    validateCustomAttributes,
    validateFilter
}