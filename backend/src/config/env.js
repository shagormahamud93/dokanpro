import dotenv from 'dotenv'
dotenv.config()

const required = (name, fallback) => {
  const v = process.env[name] ?? fallback
  if (v === undefined || v === '') {
    console.error(`[env] missing required variable: ${name}`)
    process.exit(1)
  }
  return v
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  mongoUri: required('MONGODB_URI', process.env.MONGODB_URI),
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me-please-32chars'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS || 10),
  corsOrigins: (process.env.CORS_ORIGIN || '*')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
}

export const isProd = env.nodeEnv === 'production'
