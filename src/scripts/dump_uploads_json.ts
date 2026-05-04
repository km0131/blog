import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')

async function main() {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)
    const rows: any[] = []
    for (const r of db.query('SELECT id, url_path, created_at FROM uploads ORDER BY id ASC')) rows.push(r)
    console.log(JSON.stringify(rows, null, 2))
    db.close()
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
