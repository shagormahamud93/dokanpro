/** Rewrite a MongoDB URI to use an isolated database name. Never logs credentials. */

export const TEST_DB_NAME = 'dokanpro_phase1_test'

export function rewriteMongoDbName(uri, dbName) {
  if (!uri) throw new Error('MongoDB URI is required')
  const qIndex = uri.indexOf('?')
  const query = qIndex >= 0 ? uri.slice(qIndex) : ''
  const head = qIndex >= 0 ? uri.slice(0, qIndex) : uri
  const protoIdx = head.indexOf('://')
  if (protoIdx < 0) throw new Error('Invalid MongoDB URI')
  const slashAfterHost = head.indexOf('/', protoIdx + 3)
  if (slashAfterHost === -1) return `${head}/${dbName}${query}`
  return `${head.slice(0, slashAfterHost)}/${dbName}${query}`
}

export function assertTestDatabase(uri) {
  const qIndex = uri.indexOf('?')
  const head = qIndex >= 0 ? uri.slice(0, qIndex) : uri
  const protoIdx = head.indexOf('://')
  const slashAfterHost = head.indexOf('/', protoIdx + 3)
  const dbName = slashAfterHost === -1 ? '' : head.slice(slashAfterHost + 1)
  if (!/test/i.test(dbName)) {
    throw new Error('Refusing to run tests: database name must contain "test"')
  }
  return dbName
}
