import { sql } from '../lib/db'

const postId = Number(process.argv[2] || 0)

async function main() {
  if (!postId) {
    console.error('Usage: bun src/scripts/check_upload_match.ts <postId>')
    process.exit(1)
  }
  try {
    const rows = await sql`
      SELECT id, body_markdown
      FROM posts
      WHERE id = ${postId}
    `
    if (!rows.length) {
      console.error('post not found')
      process.exit(1)
    }
    const body = rows[0].body_markdown || ''
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
