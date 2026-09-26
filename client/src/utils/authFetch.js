/**
 * Returns standard authentication headers with proxy fallbacks.
 * This guarantees the JWT token reaches the backend even if an edge
 * reverse proxy (like Vercel rewrites) filters or drops the standard
 * Authorization header.
 */
export const getAuthHeaders = (token, extraHeaders = {}) => {
  if (!token) return { ...extraHeaders };
  return {
    'Authorization': `Bearer ${token}`,
    'x-authorization': `Bearer ${token}`,
    'x-access-token': token,
    ...extraHeaders
  };
};
