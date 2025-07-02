// Validate product data
const validateProduct = (data) => {
    if (!data.name || typeof data.name !== 'string') {
        return 'Product name is required and must be a string.';
    }
    if (!data.price || typeof data.price !== 'number') {
        return 'Product price is required and must be a number.';
    }
    if (!data.category || typeof data.category !== 'string') {
        return 'Product category is required and must be a string.';
    }
    if (data.stock !== undefined && typeof data.stock !== 'number') {
        return 'Product stock must be a number.';
    }
    return null;
};

module.exports = {
    validateProduct
};
