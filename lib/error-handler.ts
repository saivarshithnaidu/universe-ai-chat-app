export interface ErrorResponse {
    error: string;
    details?: string;
    stack?: string;
}

export function handleApiError(error: any, context: string): ErrorResponse {
    const isProduction = process.env.NODE_ENV === 'production';

    // Log detailed error server-side
    console.error(`[${context}] Error:`, {
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        context
    });

    // Return generic error in production, detailed in development
    if (isProduction) {
        // Generic error message - no sensitive information
        return {
            error: 'An error occurred while processing your request. Please try again.'
        };
    } else {
        // Development mode - include details for debugging
        return {
            error: error.message || 'An error occurred',
            details: error.details,
            stack: error.stack
        };
    }
}

export function createErrorResponse(message: string, statusCode: number = 500): Response {
    const isProduction = process.env.NODE_ENV === 'production';

    return Response.json(
        {
            error: isProduction ? 'An error occurred. Please try again.' : message
        },
        { status: statusCode }
    );
}

export class ApiError extends Error {
    constructor(
        message: string,
        public statusCode: number = 500,
        public details?: any
    ) {
        super(message);
        this.name = 'ApiError';
    }
}
