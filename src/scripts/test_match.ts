import { sql } from '../lib/db'

async function main() {
  try {
    const postId = 31
    const rows = await sql`
      SELECT id, body_markdown
      FROM posts
      WHERE id = ${postId}
    `
    console.log('post rows:', rows)
    if (!rows.length) return
    const md = rows[0].body_markdown || ''
    const urls: string[] = []
    const re = /!\[[^\]]*\]\(([^)]+)\)/g
    let m: RegExpExecArray | null
    while ((m = re.exec(md)) !== null) {
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
    if (!urls.length) return
    const uniq = Array.from(new Set(urls))
    const found = await sql`
      SELECT id, url_path, created_at
      FROM uploads
      WHERE url_path = ANY(${uniq})
      ORDER BY created_at ASC
    `
    console.log('found uploads:', found)
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
