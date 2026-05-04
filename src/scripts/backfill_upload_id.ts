import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')

async function main() {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)

    const posts: Array<{ id: number; body: string }> = []
    for (const r of db.query("SELECT id, body_markdown FROM posts WHERE (cover_image IS NULL OR cover_image = '')")) posts.push({ id: r.id, body: r.body_markdown })

    let updated = 0
      for (const p of posts) {
        console.log('Processing post', p.id)
        const md = p.body || ''

        // 1. Markdownから全画像URLを抽出
        const imageUrls = md.match(/!\[.*?\]\((.*?)\)/g)?.map(m => {
          const mm = m.match(/\((.*?)\)/)
          return mm ? mm[1] : ''
        }).filter(Boolean) || []

        // 2. 一番上のリンク（配列の最初の要素）が存在するかチェック
        const firstUrl = imageUrls.length > 0 ? imageUrls[0] : null
        console.log(' extracted urls:', imageUrls)

        if (!firstUrl) continue

        const rows: any[] = []

        // normalize absolute URLs to pathname if necessary
        let lookup = firstUrl
        try {
          if (/^https?:\/\//i.test(lookup)) {
            const nu = new URL(lookup)
            lookup = nu.pathname
          }
        } catch (e) {}

        // 3. そのURLでDBを検索（created_atが最古のものを1件）
        console.log(' query: SELECT id FROM uploads WHERE url_path = ? ORDER BY datetime(created_at) ASC LIMIT 1 params:', lookup)
        for (const r of db.query('SELECT id FROM uploads WHERE url_path = ? ORDER BY datetime(created_at) ASC LIMIT 1', lookup)) rows.push(r)
        if (rows.length) {
          console.log(' matched uploads rows:', rows)
          const uploadId = rows[0].id
          try {
            db.run('UPDATE posts SET cover_image = ? WHERE id = ?', uploadId, p.id)
            updated++
          } catch (e) {
            console.warn('Failed to update post', p.id, String(e))
          }
        }
    }

    console.log(`Backfill completed. Updated ${updated} posts.`)
    db.close()
  } catch (err) {
    console.error('Backfill failed:', String(err))
    process.exitCode = 1
  }
}

main()
