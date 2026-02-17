/**
 * Utility to strip all markdown formatting from text
 * Converts markdown to plain text while preserving line breaks
 */

export function stripMarkdown(text: string): string {
    if (!text) return '';

    return text
        // Remove bold **text**
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        // Remove italic *text*
        .replace(/\*([^*]+)\*/g, '$1')
        // Remove italic _text_
        .replace(/_([^_]+)_/g, '$1')
        // Remove headers ### text
        .replace(/^#+\s+/gm, '')
        // Remove links [text](url) -> text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        // Remove inline code `code`
        .replace(/`([^`]+)`/g, '$1')
        // Remove strikethrough ~~text~~
        .replace(/~~([^~]+)~~/g, '$1')
        // Remove blockquotes
        .replace(/^>\s+/gm, '')
        // Remove horizontal rules
        .replace(/^---+$/gm, '')
        .replace(/^\*\*\*+$/gm, '')
        // Remove list markers
        .replace(/^[\*\-\+]\s+/gm, '')
        .replace(/^\d+\.\s+/gm, '')
        .trim();
}
