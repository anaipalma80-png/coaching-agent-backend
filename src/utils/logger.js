const pino = require('pino');

const isDevelopment = process.env.NODE_ENV === 'development';

const logger = pino(
  {
    level: process.env.LOG_LEVEL || 'info',
    enabled: true,
  },
  isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          singleLine: false,
          ignore: 'pid,hostname',
          translateTime: 'SYS:standard',
        },
      })
    : undefined
);

module.exports = logger;