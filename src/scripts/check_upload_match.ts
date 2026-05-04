import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')
const postId = Number(process.argv[2] || 0)

async function main() {
  if (!postId) {
    console.error('Usage: bun src/scripts/check_upload_match.ts <postId>')
    process.exit(1)
  }
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)

    const rows = []
    for (const r of db.query('SELECT id, body_markdown FROM posts WHERE id = ?', postId)) rows.push(r)
    if (!rows.length) {
      console.error('post not found')
      process.exit(1)
    }
    const body = rows[0][1] || ''
    console.log('post body:', body)
    const urls: string[] = []
    const re = /!\[[^\]]*\]\(([^)]+)\)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(body)) !== null) {
      let u = m[1].trim()
      try {
        if (/^https?:\/\//i.test(u)) {
          const nu = new URL(u)
          u = nu.pathname
        }
      } catch (e) {}
      urls.push(u)
    }
    console.log('extracted urls:', urls)
    if (!urls.length) process.exit(0)
    const uniq = Array.from(new Set(urls))
    const placeholders = uniq.map(() => '?').join(',')
    const q = `SELECT id, url_path, created_at FROM uploads WHERE url_path IN (${placeholders}) ORDER BY datetime(created_at) ASC`
    console.log('Query:', q, 'Params:', uniq)
    const found: any[] = []
    for (const r of db.query(q, ...uniq)) found.push(r)
    console.log('found uploads:', found)
    db.close()
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
