export const checkUserNameQuery = 'SELECT * FROM users WHERE name = ?';
export const checkUserEmailQuery = 'SELECT * FROM users WHERE email = ?';
export const getUserQuery = 'SELECT * FROM user WHERE email = ?';
export const createUserQuery = 'INSERT INTO user (name, email, password) VALUES (?, ?, ?)';
export const checkTokenQuery =
  'SELECT * FROM token WHERE token = ? AND revoked = 0 AND expires_at > NOW()';
export const insertTokenQuery =
  'INSERT INTO token (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)';
export const revokeTokenQuery = 'UPDATE token SET revoked = 1 WHERE token = ?';
