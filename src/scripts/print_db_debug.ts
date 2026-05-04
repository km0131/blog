import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')

async function main() {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)

    console.log('--- uploads (first 50) ---')
    for (const r of db.query('SELECT id, url_path, created_at FROM uploads ORDER BY created_at DESC LIMIT 50')) {
      console.log(r)
    }

    console.log('\n--- posts with NULL upload_id (first 50) ---')
    for (const r of db.query("SELECT id, substr(body_markdown,1,200), created_at FROM posts WHERE upload_id IS NULL ORDER BY created_at DESC LIMIT 50")) {
      console.log(r)
    }

    console.log('\n--- counts ---')
    for (const r of db.query('SELECT (SELECT count(*) FROM uploads) as uploads_count, (SELECT count(*) FROM posts WHERE upload_id IS NULL) as posts_null_upload')) console.log(r)

    db.close()
  } catch (err) {
    console.error('Error reading DB:', String(err))
    process.exitCode = 1
  }
}

main()
