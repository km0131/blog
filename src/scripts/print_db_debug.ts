import { sql } from '../lib/db'

async function main() {
  try {
    console.log('--- uploads (first 50) ---')
    const uploads = await sql`
      SELECT id, url_path, created_at
      FROM uploads
      ORDER BY created_at DESC
      LIMIT 50
    `
    for (const r of uploads) console.log(r)

    console.log('\n--- posts with NULL cover_image (first 50) ---')
    const posts = await sql`
      SELECT id, substr(body_markdown, 1, 200) AS excerpt, created_at
      FROM posts
      WHERE cover_image IS NULL
      ORDER BY created_at DESC
      LIMIT 50
    `
    for (const r of posts) console.log(r)

    console.log('\n--- counts ---')
    const counts = await sql`
      SELECT
        (SELECT count(*) FROM uploads) AS uploads_count,
        (SELECT count(*) FROM posts WHERE cover_image IS NULL) AS posts_null_cover_image
    `
    for (const r of counts) console.log(r)
  } catch (err) {
    console.error('Error reading DB:', String(err))
    process.exitCode = 1
  }
}

main()
