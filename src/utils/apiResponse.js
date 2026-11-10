class ApiResponse {
    // meta is optional (e.g. pagination for lists): { page, limit, total, totalPages }
    static success(message, data = null, statusCode = 200, meta) {
        const body = {
            status: 'success',
            statusCode: statusCode,
            message: message,
            data: data,
            date: new Date().toISOString()
        };
        if (meta) body.meta = meta;
        return body;
    }

    // details is only set in development (see errorMiddleware), never in production.
    static error(message, statusCode = 500, details) {
        const body = {
            status: 'error',
            statusCode: statusCode,
            message: message,
            date: new Date().toISOString()
        };
        if (details) body.details = details;
        return body;
    }
}

module.exports = ApiResponse;
