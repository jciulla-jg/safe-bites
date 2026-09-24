/**
 * Turns a failed submission into a message a diner can act on. The database
 * rejects some writes on purpose (0012): too many from one network, or text
 * with links, contact details or blocked words. Everything else gets the
 * caller's generic fallback.
 */
export function friendlySubmitError(err: unknown, fallback: string): string {
  const message = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : '';
  if (message.includes('rate_limited')) {
    return 'Lots of submissions have come from this network in the last hour. Please try again a bit later.';
  }
  if (message.includes('content_rejected')) {
    return 'Please remove any links, email addresses, phone numbers or blocked words, then try again.';
  }
  return fallback;
}
