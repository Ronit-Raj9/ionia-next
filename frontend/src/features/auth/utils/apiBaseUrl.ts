/**
 * Resolve API base URL safely for browser HTTPS contexts.
 * - Defaults to same-origin proxy path to avoid mixed content on Vercel.
 * - Falls back to /api/v1 when an insecure http:// URL is configured on an HTTPS page.
 */
export const getAuthApiBaseUrl = (): string => {
  const configuredBaseUrl = (process.env.NEXT_PUBLIC_API_URL || '/api/v1').trim();
  const cleanBaseUrl = configuredBaseUrl.replace(/\/$/, '');
  
  if (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    cleanBaseUrl.startsWith('http://')
  ) {
    return '/api/v1';
  }
  
  return cleanBaseUrl.endsWith('/v1') ? cleanBaseUrl : `${cleanBaseUrl}/v1`;
};
