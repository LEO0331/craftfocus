const NETWORK_ERROR_PATTERN = /failed to fetch|network request failed|networkerror|fetcherror|authretryablefetcherror/i;

export function formatAuthError(error: unknown, fallbackMessage: string, backendUnavailableMessage: string): string {
  const message = error instanceof Error ? error.message : '';
  const name = error instanceof Error ? error.name : '';
  if (NETWORK_ERROR_PATTERN.test(`${name} ${message}`)) {
    return backendUnavailableMessage;
  }
  return message || fallbackMessage;
}
