export const normalizeDbInspectorError = (error: unknown): Error => {
  if (!(error instanceof Error)) return new Error(String(error));
  const code = 'code' in error ? String(error.code) : '';
  const message = error.message.toLowerCase();

  if (
    code === '28P01' ||
    code === 'ER_ACCESS_DENIED_ERROR' ||
    message.includes('password authentication failed') ||
    message.includes('access denied')
  ) {
    return new Error(`Authentication failed. ${error.message}`);
  }

  if (
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'ENOTFOUND' ||
    message.includes('connect')
  ) {
    return new Error(`Connection failed. ${error.message}`);
  }

  return error;
};
