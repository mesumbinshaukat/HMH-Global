// Handle errors in a consistent way
const handleError = (res, error, statusCode = 500) => {
    console.error('Error:', error);

    // Appwrite specific errors
    if (error.code === 404) {
        return res.status(404).json({
            success: false,
            message: 'Resource not found'
        });
    }

    if (error.code === 401) {
        return res.status(401).json({
            success: false,
            message: 'Unauthorized'
        });
    }

    if (error.code === 400) {
        return res.status(400).json({
            success: false,
            message: error.message || 'Bad request'
        });
    }

    // Custom error messages
    if (error.message.includes('Error creating')) {
        return res.status(400).json({
            success: false,
            message: 'Failed to create resource',
            details: error.message
        });
    }

    if (error.message.includes('Error fetching')) {
        return res.status(404).json({
            success: false,
            message: 'Resource not found',
            details: error.message
        });
    }

    if (error.message.includes('Error updating')) {
        return res.status(400).json({
            success: false,
            message: 'Failed to update resource',
            details: error.message
        });
    }

    if (error.message.includes('Error deleting')) {
        return res.status(400).json({
            success: false,
            message: 'Failed to delete resource',
            details: error.message
        });
    }

    if (error.message.includes('Insufficient stock')) {
        return res.status(400).json({
            success: false,
            message: 'Insufficient stock available'
        });
    }

    // Generic server error
    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Internal server error' 
            : error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
};

// Not found middleware
const notFound = (req, res, next) => {
    const error = new Error(`Not found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = {
    handleError,
    notFound
};
