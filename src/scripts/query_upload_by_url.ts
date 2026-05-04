import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')
const url = process.argv[2]
if (!url) {
  console.error('Usage: bun src/scripts/query_upload_by_url.ts <url_path>')
  process.exit(1)
}

async function main() {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)
    const rows: any[] = []
    for (const r of db.query('SELECT id, url_path, created_at FROM uploads WHERE url_path = ?', url)) rows.push(r)
    console.log('Query for', url, '=>', rows)
    db.close()
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
