/**
 * Utility functions for PricePilot AI Assistant
 */

export { renderMarkdown } from './markdownRenderer.jsx';

/**
 * Defensive response parser to extract natural assistant text from Gemini API response.
 * Handles the backend format:
 * {
 *   "id": "e408ec4c-804a-44e0-b487-ef9d517cc14e",
 *   "model": "gemini-3.5-flash",
 *   "output": "The capital of India is **New Delhi**.",
 *   "metadata": null
 * }
 *
 * Prevents accidental rendering of the complete JSON object or stringified JSON.
 *
 * @param {any} data - Raw response object or string from Gemini API / Axios
 * @returns {string} Clean natural language assistant message
 */
export function extractAssistantText(data) {
  if (!data) {
    return '';
  }

  // If already a plain string
  if (typeof data === 'string') {
    const trimmed = data.trim();
    // In case string contains a stringified JSON envelope
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
          return extractAssistantText(parsed);
        }
      } catch {
        // Not valid JSON, return the raw string
      }
    }
    return data;
  }

  // 1. Primary backend output field
  if (typeof data.output === 'string') {
    return data.output;
  }

  // 2. Nested axios data object: response.data.output
  if (data.data && typeof data.data.output === 'string') {
    return data.data.output;
  }

  // 3. Nested content wrapper
  if (typeof data.content === 'string') {
    return data.content;
  }

  // 4. Other standard response wrappers
  if (typeof data.response === 'string') {
    return data.response;
  }

  if (typeof data.text === 'string') {
    return data.text;
  }

  if (typeof data.answer === 'string') {
    return data.answer;
  }

  if (typeof data.message === 'string') {
    return data.message;
  }

  // 5. Gemini candidates structure
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    const candidateText = data.candidates[0].content.parts[0].text;
    if (typeof candidateText === 'string') {
      return candidateText;
    }
  }

  // 6. If data has nested data object
  if (data.data && typeof data.data === 'object') {
    return extractAssistantText(data.data);
  }

  return '';
}

/**
 * Unique message ID generator
 */
export function generateMessageId() {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Safe timestamp formatter
 */
export function formatMessageTime(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Sanitize page context to prevent sending sensitive tokens, passwords, or credentials
 */
export function sanitizeContext(rawContext = {}) {
  if (!rawContext || typeof rawContext !== 'object') return {};

  const clean = {};
  const blockedKeys = new Set([
    'password',
    'token',
    'access_token',
    'refresh_token',
    'secret',
    'key',
    'authorization',
  ]);

  for (const [key, value] of Object.entries(rawContext)) {
    if (blockedKeys.has(key.toLowerCase())) continue;
    if (typeof value === 'function') continue;
    if (typeof value === 'object' && value !== null) {
      clean[key] = sanitizeContext(value);
    } else {
      clean[key] = value;
    }
  }

  return clean;
}
