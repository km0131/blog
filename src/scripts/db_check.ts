import { sql } from '../lib/db'

async function main() {
  try {
    const rows = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    console.log('schema objects:')
    for (const r of rows) console.log(r)
  } catch (err) {
    console.warn('Cannot query DB:', String(err))
  }
}

main()
