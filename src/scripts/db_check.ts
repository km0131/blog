import path from 'path'

async function main() {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')
    const db = new DB(dbPath)
    const rows = db.query("SELECT name, type FROM sqlite_master WHERE type IN ('table','view')")
    console.log('schema objects:')
    for (const r of rows) console.log(r)
    db.close()
  } catch (err) {
    console.warn('Cannot query DB with bun:sqlite:', String(err))
  }
}

main()
