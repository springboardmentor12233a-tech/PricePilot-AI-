/**
 * PricePilot AI — AI Assistant Service
 * Connects directly to existing FastAPI backend endpoint: POST /api/v2/ai/gemini
 * Adheres strictly to enterprise security rules:
 * - NEVER exposes GEMINI_API_KEY in client code
 * - Communicates only through backend proxy
 * - Clean response extraction: returns only natural output, never raw JSON envelopes
 * - Zero mock responses
 */

import apiClient from '../../../utils/apiClient';
import { API_ENDPOINTS } from '../../../utils/constants';
import { extractAssistantText } from '../utils/chatUtils';

export const aiAssistantApi = {
  /**
   * Send a pricing intelligence query to the Gemini endpoint
   * POST /api/v2/ai/gemini
   *
   * @param {Object} params
   * @param {string} params.prompt - User query / question
   * @param {Object} [params.context] - Page-aware sanitized context
   * @param {Array} [params.history] - Prior messages in conversation
   * @returns {Promise<{ id?: string, model?: string, output: string, content: string, metadata?: any, status: string }>}
   */
  sendQuery: async ({ prompt, context = {}, history = [] }) => {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error('A valid prompt is required for AI analysis.');
    }

    // Prepare payload for FastAPI endpoint POST /api/v2/ai/gemini
    const payload = {
      prompt: prompt.trim(),
      message: prompt.trim(),
      query: prompt.trim(),
      context: context || {},
      history: (history || []).slice(-8).map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content,
      })),
    };

    try {
      const response = await apiClient.post(API_ENDPOINTS.AI.GEMINI, payload);
      const data = response?.data;

      // Extract natural language assistant text using defensive parser
      const extractedText = extractAssistantText(data);

      if (!extractedText || !extractedText.trim()) {
        const fallbackMessage = "Sorry, I didn't receive a response. Please try again.";
        return {
          id: data?.id,
          model: data?.model,
          output: fallbackMessage,
          content: fallbackMessage,
          metadata: data?.metadata ?? null,
          status: 'success',
        };
      }

      const cleanText = extractedText.trim();

      return {
        id: data?.id,
        model: data?.model,
        output: cleanText,
        content: cleanText,
        metadata: data?.metadata ?? null,
        status: 'success',
      };
    } catch (error) {
      // Handle known status codes gracefully
      const status = error?.status || error?.response?.status;
      const originalMessage = error?.message || '';

      let userFriendlyMessage = 'Sorry, I couldn\'t generate a response. Please try again.';

      if (status === 401 || status === 403) {
        userFriendlyMessage =
          'Authentication required to query PricePilot AI Assistant. Please verify you are signed in with an authorized organization role.';
      } else if (status === 429) {
        userFriendlyMessage =
          'Rate limit reached for the AI assistant. Please wait a moment before asking another question.';
      } else if (status === 500 || status === 502 || status === 503) {
        userFriendlyMessage =
          'The AI service is temporarily unavailable. Please try again shortly.';
      } else if (error?.code === 'ECONNABORTED' || originalMessage.toLowerCase().includes('timeout')) {
        userFriendlyMessage =
          'The request timed out. Please try asking a more focused question.';
      } else if (!status || originalMessage.toLowerCase().includes('network')) {
        userFriendlyMessage =
          'Unable to reach the AI assistant service. Please verify the backend is running and retry.';
      }

      const formattedError = new Error(userFriendlyMessage);
      formattedError.status = status;
      throw formattedError;
    }
  },
};

export default aiAssistantApi;
