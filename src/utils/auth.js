const TokenKey = 'access_token'
const OidcCode = 'oidc_code'
const OidcCodeExpiry = 'oidc_code_expiry';

// The token is issued by the backend via HttpOnly Cookie, which frontend JS cannot read or write,
// fundamentally preventing XSS token theft.
// Therefore localStorage is no longer used for tokens; these functions keep their signatures for compatibility but do not persist anything.
export function getToken () {
  return ''
}

export function setToken (token) {
  // no-op: the token is stored in an HttpOnly Cookie and is not handled by the frontend
  return
}

export function removeToken () {
  // no-op: logout clears the Cookie on the backend (see store/user.js logout)
  return
}

// Set code and store the current timestamp in milliseconds
export function setCode(code) {
  const now = Date.now(); // Current timestamp in milliseconds
  const expiry = now + 60 * 1000; // Expires after 60 seconds

  localStorage.setItem(OidcCode, code); // Store code
  localStorage.setItem(OidcCodeExpiry, expiry); // Store expiry timestamp
}

// Get code; if it has expired, delete it and return null
export function getCode() {
  const expiry = localStorage.getItem(OidcCodeExpiry); // Get expiry timestamp
  const now = Date.now(); // Current timestamp

  if (expiry && now > parseInt(expiry)) {
    // If expired, delete code and expiry time
    removeCode();
    return null;
  }
  return localStorage.getItem(OidcCode); // Return code if not expired
}

// Delete code and expiry time
export function removeCode() {
  localStorage.removeItem(OidcCode);
  localStorage.removeItem(OidcCodeExpiry);
}
