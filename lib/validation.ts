export const MAX_MESSAGE_LENGTH = 10000;
export const MAX_CHAT_TITLE_LENGTH = 100;
export const MAX_PAYLOAD_SIZE = 50000; // 50KB

export interface ValidationResult {
    valid: boolean;
    error?: string;
}

export function validateMessage(message: unknown): ValidationResult {
    if (!message || typeof message !== 'string') {
        return { valid: false, error: 'Message must be a non-empty string' };
    }

    if (message.trim().length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        return {
            valid: false,
            error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`
        };
    }

    return { valid: true };
}

export function validateChatTitle(title: unknown): ValidationResult {
    if (!title) {
        return { valid: true }; // Title is optional
    }

    if (typeof title !== 'string') {
        return { valid: false, error: 'Title must be a string' };
    }

    if (title.length > MAX_CHAT_TITLE_LENGTH) {
        return {
            valid: false,
            error: `Title exceeds maximum length of ${MAX_CHAT_TITLE_LENGTH} characters`
        };
    }

    return { valid: true };
}

export function validateModelIds(modelIds: unknown): ValidationResult {
    if (!Array.isArray(modelIds)) {
        return { valid: false, error: 'Model IDs must be an array' };
    }

    if (modelIds.length === 0) {
        return { valid: false, error: 'At least one model must be selected' };
    }

    if (modelIds.length > 10) {
        return { valid: false, error: 'Too many models selected' };
    }

    if (!modelIds.every(id => typeof id === 'string')) {
        return { valid: false, error: 'All model IDs must be strings' };
    }

    return { valid: true };
}

export function validateRequestBody(body: unknown, maxSize: number = MAX_PAYLOAD_SIZE): ValidationResult {
    try {
        const bodyStr = JSON.stringify(body);
        if (bodyStr.length > maxSize) {
            return { valid: false, error: 'Request payload too large' };
        }
        return { valid: true };
    } catch (error) {
        return { valid: false, error: 'Invalid request body' };
    }
}
