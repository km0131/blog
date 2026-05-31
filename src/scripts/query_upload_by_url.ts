import { sql } from '../lib/db'

declare const process: any

const url = process.argv[2]
if (!url) {
  console.error('Usage: bun src/scripts/query_upload_by_url.ts <url_path>')
  process.exit(1)
}

async function main() {
  try {
    const rows = await sql`
      SELECT id, url_path, created_at
      FROM uploads
      WHERE url_path = ${url}
    `
    console.log('Query for', url, '=>', rows)
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
