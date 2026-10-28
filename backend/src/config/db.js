import mongoose from 'mongoose'
import { env } from './env.js'
import dns from 'node:dns';

mongoose.set('strictQuery', true)


dns.setServers(['8.8.8.8', '1.1.1.1']);
export async function connectDB() {
  try {
    const conn = await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
    console.log(`[db] connected → ${conn.connection.host}/${conn.connection.name}`)
  } catch (err) {
    console.error('[db] connection error:', err.message)
    process.exit(1)
  }

  mongoose.connection.on('disconnected', () => console.warn('[db] disconnected'))
  mongoose.connection.on('reconnected', () => console.log('[db] reconnected'))
}

export async function disconnectDB() {
  await mongoose.connection.close()
}
