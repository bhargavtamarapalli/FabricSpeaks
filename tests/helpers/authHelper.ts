import request from 'supertest';

/**
 * Register a new user
 */
export async function registerUser(app: any, userData: {
  email: string;
  password: string;
  name?: string;
}) {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);

  return response;
}

/**
 * Login a user
 */
export async function loginUser(app: any, credentials: {
  email: string;
  password: string;
}) {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);

  return response;
}

/**
 * Get auth token for a user
 */
export async function getAuthToken(app: any, email: string, password: string): Promise<string> {
  const response = await loginUser(app, { email, password });
  return response.body.accessToken;
}

/**
 * Create authorization header
 */
export function createAuthHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/**
 * Request password reset
 */
export async function requestPasswordReset(app: any, email: string) {
  const response = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email });

  return response;
}

/**
 * Reset password with token
 */
export async function resetPassword(app: any, token: string, newPassword: string) {
  const response = await request(app)
    .post('/api/auth/reset-password')
    .send({ token, newPassword });

  return response;
}

/**
 * Verify email with token
 */
export async function verifyEmail(app: any, token: string) {
  const response = await request(app)
    .post('/api/auth/verify-email')
    .send({ token });

  return response;
}

/**
 * Logout user
 */
export async function logoutUser(app: any, token: string) {
  const response = await request(app)
    .post('/api/auth/logout')
    .set(createAuthHeader(token));

  return response;
}

/**
 * Refresh access token
 */
export async function refreshToken(app: any, refreshToken: string) {
  const response = await request(app)
    .post('/api/auth/refresh')
    .send({ refreshToken });

  return response;
}
