import { sql } from '../lib/db'

declare const process: any

const id = Number(process.argv[2] || 0)
if (!id) {
  console.error('Usage: bun src/scripts/query_upload_by_id.ts <id>')
  process.exit(1)
}

async function main() {
  try {
    const rows = await sql`
      SELECT id, url_path, created_at
      FROM uploads
      WHERE id = ${id}
    `
    console.log('Query id', id, '=>', rows)
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
