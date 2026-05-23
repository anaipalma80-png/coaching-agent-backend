const logger = require('../utils/logger');

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'BASE44_APP_ID',
  'RETELL_API_KEY',
  'CLAUDE_API_KEY',
  'JWT_SECRET',
  'BASE_URL',
];

/**
 * Validate that all required environment variables are set
 * @throws {Error} If any required environment variable is missing
 */
function validateEnv() {
  const missing = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  // Validate JWT_SECRET length
  if (process.env.JWT_SECRET.length < 32) {
    logger.warn('JWT_SECRET is shorter than recommended 32 characters');
  }

  // Validate PORT is a number
  if (isNaN(parseInt(process.env.PORT))) {
    throw new Error('PORT must be a valid number');
  }

  logger.debug('All environment variables validated');
}

/**
 * Get environment configuration object
 */
function getConfig() {
  return {
    port: parseInt(process.env.PORT),
    nodeEnv: process.env.NODE_ENV,
    baseUrl: process.env.BASE_URL,
    base44: {
      appId: process.env.BASE44_APP_ID,
      apiUrl: process.env.BASE44_API_URL || 'https://api.base44.com',
    },
    retell: {
      apiKey: process.env.RETELL_API_KEY,
      apiUrl: process.env.RETELL_API_URL || 'https://api.retellai.com',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY,
      apiUrl: process.env.CLAUDE_API_URL || 'https://api.anthropic.com',
    },
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: '24h',
    },
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };
}

module.exports = {
  validateEnv,
  getConfig,
};