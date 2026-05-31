import { sql } from '../lib/db'

async function main() {
  try {
    const posts: Array<{ id: number; body: string }> = await sql`
      SELECT id, body_markdown
      FROM posts
      WHERE cover_image IS NULL OR cover_image = ''
    `

    let updated = 0
    for (const p of posts) {
      console.log('Processing post', p.id)
      const md = p.body_markdown || ''

      const imageUrls = md.match(/!\[.*?\]\((.*?)\)/g)?.map(m => {
        const mm = m.match(/\((.*?)\)/)
        return mm ? mm[1] : ''
      }).filter(Boolean) || []

      const firstUrl = imageUrls.length > 0 ? imageUrls[0] : null
      console.log(' extracted urls:', imageUrls)

      if (!firstUrl) continue

      let lookup = firstUrl
      try {
        if (/^https?:\/\//i.test(lookup)) {
          const nu = new URL(lookup)
          lookup = nu.pathname
        }
      } catch (e) {}

      console.log(' query upload by url:', lookup)
      const rows = await sql`
        SELECT id
        FROM uploads
        WHERE url_path = ${lookup}
        ORDER BY created_at ASC
        LIMIT 1
      `

      if (rows.length) {
        console.log(' matched uploads rows:', rows)
        const uploadId = rows[0].id
        try {
          await sql`
            UPDATE posts
            SET cover_image = ${uploadId}
            WHERE id = ${p.id}
          `
          updated++
        } catch (e) {
          console.warn('Failed to update post', p.id, String(e))
        }
      }
    }

    console.log(`Backfill completed. Updated ${updated} posts.`)
  } catch (err) {
    console.error('Backfill failed:', String(err))
    process.exitCode = 1
  }
}

main()
