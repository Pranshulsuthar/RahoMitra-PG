import pino from 'pino';

const isProduction = process.env.NODE_ENV === 'production';

export const logger = pino({
  level: isProduction ? 'info' : 'debug',
  redact: {
    paths: [
      'authorization',
      'cookie',
      'password',
      'token',
      'otp',
      'refreshToken',
      'accessToken',
      'secret',
      'req.headers.authorization',
      'req.headers.cookie',
      'req.headers["set-cookie"]',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.otp',
      '*.refreshToken',
      '*.accessToken',
      '*.secret',
      'body.password',
      'body.token',
      'body.otp',
      'body.refreshToken',
      'body.secret',
      'ADMIN_PASSWORD',
      'JWT_ACCESS_SECRET',
    ],
    censor: '[REDACTED]',
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
