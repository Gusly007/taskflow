class ApiResponse {  
    static success(message, data = 'success',statusCode = 200) {
        return {
            status: 'success',
            statusCode: statusCode,
            message: message,
            data: data,
            date: new Date().toISOString()
        };
    }
    static error(message, statusCode = 500) {
        return {
            status: 'error',
            statusCode: statusCode,
            message: message,
            date: new Date().toISOString()
        };
    }
}

module.exports = ApiResponse;