/** Helpers for an isolated MongoDB test URI. Never logs credentials. */

export const TEST_DB_NAME = 'dokanpro_phase1_test'

const MONGO_PROTO = /^(mongodb(\+srv)?:\/\/)/i

export function normalizeMongoUri(uri) {
  if (uri == null) return ''
  let value = String(uri).trim()
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim()
  }
  return value
}

export function rewriteMongoDbName(uri, dbName) {
  const headAndQuery = normalizeMongoUri(uri)
  if (!headAndQuery) throw new Error('MongoDB URI is required')
  const qIndex = headAndQuery.indexOf('?')
  const query = qIndex >= 0 ? headAndQuery.slice(qIndex) : ''
  const head = qIndex >= 0 ? headAndQuery.slice(0, qIndex) : headAndQuery
  const protoIdx = head.search(/:\/\//)
  if (protoIdx < 0) {
    throw new Error(
      'Invalid MongoDB URI: must start with mongodb:// or mongodb+srv:// (value not logged)',
    )
  }
  const slashAfterHost = head.indexOf('/', protoIdx + 3)
  if (slashAfterHost === -1) return `${head}/${dbName}${query}`
  return `${head.slice(0, slashAfterHost)}/${dbName}${query}`
}

export function assertTestDatabase(uri) {
  const normalized = normalizeMongoUri(uri)
  const qIndex = normalized.indexOf('?')
  const head = qIndex >= 0 ? normalized.slice(0, qIndex) : normalized
  const protoIdx = head.search(/:\/\//)
  if (protoIdx < 0) {
    throw new Error(
      'Invalid MongoDB URI: must start with mongodb:// or mongodb+srv:// (value not logged)',
    )
  }
  const slashAfterHost = head.indexOf('/', protoIdx + 3)
  const dbName = slashAfterHost === -1 ? '' : head.slice(slashAfterHost + 1)
  if (!/test/i.test(dbName)) {
    throw new Error(
      'Refusing to run tests: TEST_MONGODB_URI database name must contain "test"',
    )
  }
  return dbName
}

/**
 * Isolation tests use TEST_MONGODB_URI only. Never fall back to MONGODB_URI.
 */
export function requireIsolatedTestUri(env = process.env) {
  const raw = env.TEST_MONGODB_URI
  if (!raw || !String(raw).trim()) {
    throw new Error(
      'Isolation tests require TEST_MONGODB_URI (a dedicated MongoDB database whose name contains "test", e.g. mongodb://127.0.0.1:27017/dokanpro_phase1_test). MONGODB_URI is not used and must not point tests at production. Set TEST_MONGODB_URI in the environment or backend/.env, then re-run: yarn test',
    )
  }
  const uri = normalizeMongoUri(raw)
  if (!MONGO_PROTO.test(uri)) {
    throw new Error(
      'TEST_MONGODB_URI is set but is not a MongoDB connection string. It must start with mongodb:// or mongodb+srv://. Check quotes and whitespace. The value was not logged.',
    )
  }
  const qIndex = uri.indexOf('?')
  const head = qIndex >= 0 ? uri.slice(0, qIndex) : uri
  const protoIdx = head.search(/:\/\//)
  const slashAfterHost = head.indexOf('/', protoIdx + 3)
  const dbName = slashAfterHost === -1 ? '' : head.slice(slashAfterHost + 1)
  const isolated = dbName ? uri : rewriteMongoDbName(uri, TEST_DB_NAME)
  assertTestDatabase(isolated)
  return isolated
}
