const NETWORK_ERROR_PATTERN = /failed to fetch|network request failed|networkerror|fetcherror|authretryablefetcherror/i;
const EMAIL_RATE_LIMIT_PATTERN = /email rate limit exceeded|over_email_send_rate_limit/i;

export function formatAuthError(
  error: unknown,
  fallbackMessage: string,
  backendUnavailableMessage: string,
  emailRateLimitMessage?: string,
): string {
  const message = error instanceof Error ? error.message : '';
  const name = error instanceof Error ? error.name : '';
  if (NETWORK_ERROR_PATTERN.test(`${name} ${message}`)) {
    return backendUnavailableMessage;
  }
  if (emailRateLimitMessage && EMAIL_RATE_LIMIT_PATTERN.test(`${name} ${message}`)) {
    return emailRateLimitMessage;
  }
  return message || fallbackMessage;
}
