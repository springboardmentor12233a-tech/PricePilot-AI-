/**
 * PricePilot AI — API Error Extraction Utility
 * Safely parses FastAPI detail arrays, strings, and network error messages
 * without exposing stack traces or sensitive credentials.
 */

export function extractErrorMessage(error, defaultMessage = 'An unexpected error occurred.') {
  if (!error) return defaultMessage;

  // Already formatted error object from interceptor
  if (typeof error === 'string') return error;
  if (error.message && typeof error.message === 'string') {
    // If it's a generic axios network error
    if (error.message === 'Network Error' || error.code === 'ERR_NETWORK') {
      return 'Unable to connect to the server.';
    }
  }

  // Check response data
  const response = error.response;
  if (response) {
    const status = response.status;
    const data = response.data;

    // FastAPI HTTPException detail string
    if (typeof data?.detail === 'string') {
      return data.detail;
    }

    // FastAPI Pydantic validation error array
    if (Array.isArray(data?.detail)) {
      return data.detail
        .map((err) => {
          const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
          return `${field}: ${err.msg}`;
        })
        .join(', ');
    }

    // Standard message field
    if (typeof data?.message === 'string') {
      return data.message;
    }

    // Standard HTTP status fallbacks
    switch (status) {
      case 400:
        return 'Invalid request. Please check the provided information.';
      case 401:
        return 'Your session has expired. Please sign in again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 422:
        return 'Some submitted information is invalid.';
      case 429:
        return 'Too many requests. Please try again shortly.';
      case 500:
        return 'The server encountered an error. Please try again.';
      case 502:
      case 503:
      case 504:
        return 'Unable to connect to the server.';
      default:
        break;
    }
  }

  if (error.message) {
    return error.message;
  }

  return defaultMessage;
}

export default extractErrorMessage;
