import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')
const id = Number(process.argv[2] || 0)
if (!id) {
  console.error('Usage: bun src/scripts/query_upload_by_id.ts <id>')
  process.exit(1)
}

async function main() {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)
    const rows: any[] = []
    for (const r of db.query('SELECT id, url_path, created_at FROM uploads WHERE id = ?', id)) rows.push(r)
    console.log('Query id', id, '=>', rows)
    db.close()
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
