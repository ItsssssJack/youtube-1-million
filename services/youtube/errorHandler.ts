/**
 * YouTube API Error Handler
 *
 * Comprehensive error handling for YouTube Data API v3.
 * Includes quota management, rate limiting, and user-friendly messages.
 */

export enum YouTubeErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  RATE_LIMIT = 'RATE_LIMIT',
  INVALID_API_KEY = 'INVALID_API_KEY',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  CHANNEL_NOT_FOUND = 'CHANNEL_NOT_FOUND',
  FORBIDDEN = 'FORBIDDEN',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export class YouTubeAPIError extends Error {
  type: YouTubeErrorType;
  code?: number;
  originalError?: any;
  userMessage: string;
  retryable: boolean;

  constructor(
    type: YouTubeErrorType,
    message: string,
    userMessage: string,
    code?: number,
    originalError?: any,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'YouTubeAPIError';
    this.type = type;
    this.code = code;
    this.originalError = originalError;
    this.userMessage = userMessage;
    this.retryable = retryable;
  }
}

/**
 * Parse YouTube API error response
 */
export const parseYouTubeError = (error: any): YouTubeAPIError => {
  // Extract error details from various response formats
  const errorData = error?.response?.data?.error || error?.error || error;
  const status = error?.response?.status || error?.status;
  const message = errorData?.message || error?.message || 'Unknown error';
  const code = errorData?.code || status;
  const errors = errorData?.errors || [];

  // Check for specific error types
  if (code === 403) {
    // Forbidden - could be quota or API key issue
    const reason = errors[0]?.reason;

    if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
      return new YouTubeAPIError(
        YouTubeErrorType.QUOTA_EXCEEDED,
        'YouTube API quota exceeded',
        'Daily API quota limit reached. Quota resets at midnight Pacific Time. Try again tomorrow or reduce scraping frequency.',
        403,
        error,
        false // Not retryable until quota resets
      );
    }

    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded') {
      return new YouTubeAPIError(
        YouTubeErrorType.RATE_LIMIT,
        'Rate limit exceeded',
        'Too many requests in a short time. Please wait a few minutes before trying again.',
        403,
        error,
        true // Retryable after waiting
      );
    }

    if (reason === 'forbidden' || reason === 'accessNotConfigured') {
      return new YouTubeAPIError(
        YouTubeErrorType.FORBIDDEN,
        'API access forbidden',
        'YouTube Data API is not enabled for this API key. Enable it in Google Cloud Console.',
        403,
        error,
        false
      );
    }

    return new YouTubeAPIError(
      YouTubeErrorType.INVALID_API_KEY,
      'Invalid API key',
      'API key is invalid or lacks required permissions. Check your YouTube Data API key in Settings.',
      403,
      error,
      false
    );
  }

  if (code === 400) {
    // Bad request - likely invalid parameters
    return new YouTubeAPIError(
      YouTubeErrorType.UNKNOWN,
      message,
      'Invalid request. Check that the channel or video ID is correct.',
      400,
      error,
      false
    );
  }

  if (code === 404) {
    // Not found
    if (message.toLowerCase().includes('video')) {
      return new YouTubeAPIError(
        YouTubeErrorType.VIDEO_NOT_FOUND,
        'Video not found',
        'The requested video could not be found. It may have been deleted or made private.',
        404,
        error,
        false
      );
    }

    if (message.toLowerCase().includes('channel')) {
      return new YouTubeAPIError(
        YouTubeErrorType.CHANNEL_NOT_FOUND,
        'Channel not found',
        'The requested channel could not be found. Check that the channel ID or handle is correct.',
        404,
        error,
        false
      );
    }

    return new YouTubeAPIError(
      YouTubeErrorType.UNKNOWN,
      'Resource not found',
      'The requested resource could not be found.',
      404,
      error,
      false
    );
  }

  if (code === 401) {
    return new YouTubeAPIError(
      YouTubeErrorType.INVALID_API_KEY,
      'Authentication failed',
      'API key is missing or invalid. Add a valid YouTube Data API key in Settings.',
      401,
      error,
      false
    );
  }

  if (code >= 500) {
    // Server error - retryable
    return new YouTubeAPIError(
      YouTubeErrorType.NETWORK_ERROR,
      'YouTube server error',
      'YouTube servers are experiencing issues. This is temporary - please try again in a few minutes.',
      code,
      error,
      true
    );
  }

  if (!code && (error.message?.includes('network') || error.message?.includes('fetch'))) {
    return new YouTubeAPIError(
      YouTubeErrorType.NETWORK_ERROR,
      'Network error',
      'Network connection failed. Check your internet connection and try again.',
      0,
      error,
      true
    );
  }

  // Unknown error
  return new YouTubeAPIError(
    YouTubeErrorType.UNKNOWN,
    message,
    `An unexpected error occurred: ${message}`,
    code,
    error,
    false
  );
};

/**
 * Handle YouTube API error with logging and user notification
 */
export const handleYouTubeError = (error: any, context?: string): YouTubeAPIError => {
  const parsedError = parseYouTubeError(error);

  // Log for debugging
  console.error(`[YouTube API Error${context ? ` - ${context}` : ''}]`);
  console.error(`Type: ${parsedError.type}`);
  console.error(`Code: ${parsedError.code}`);
  console.error(`Message: ${parsedError.message}`);
  console.error(`User Message: ${parsedError.userMessage}`);
  console.error(`Retryable: ${parsedError.retryable}`);

  if (parsedError.originalError) {
    console.error('Original Error:', parsedError.originalError);
  }

  return parsedError;
};

/**
 * Retry logic with exponential backoff
 */
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const parsedError = parseYouTubeError(error);

      // Don't retry if not retryable
      if (!parsedError.retryable) {
        throw parsedError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw parsedError;
      }

      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Get user-friendly quota status message
 */
export const getQuotaStatusMessage = (used: number, limit: number): {
  message: string;
  severity: 'info' | 'warning' | 'error';
  percentage: number;
} => {
  const percentage = (used / limit) * 100;

  if (percentage >= 100) {
    return {
      message: 'Quota exhausted. Resets at midnight PT.',
      severity: 'error',
      percentage,
    };
  }

  if (percentage >= 90) {
    return {
      message: `Quota critical: ${(100 - percentage).toFixed(1)}% remaining`,
      severity: 'error',
      percentage,
    };
  }

  if (percentage >= 75) {
    return {
      message: `Quota low: ${(100 - percentage).toFixed(1)}% remaining`,
      severity: 'warning',
      percentage,
    };
  }

  if (percentage >= 50) {
    return {
      message: `Quota moderate: ${(100 - percentage).toFixed(1)}% remaining`,
      severity: 'warning',
      percentage,
    };
  }

  return {
    message: `Quota healthy: ${(100 - percentage).toFixed(0)}% remaining`,
    severity: 'info',
    percentage,
  };
};
