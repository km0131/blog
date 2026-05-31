import { sql } from '../lib/db'

async function main() {
  try {
    const rows = await sql`
      SELECT id, url_path, created_at
      FROM uploads
      ORDER BY id ASC
    `
    console.log(JSON.stringify(rows, null, 2))
  } catch (err) {
    console.error('Error:', String(err))
    process.exit(1)
  }
}

main()
