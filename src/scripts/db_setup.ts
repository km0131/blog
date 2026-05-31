import { sql } from '../lib/db'

async function main() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        body_markdown TEXT NOT NULL,
        cover_image TEXT,
        upload_id INTEGER,
        tags TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ
      );

      CREATE TABLE IF NOT EXISTS uploads (
        id SERIAL PRIMARY KEY,
        original_name TEXT NOT NULL,
        stored_name TEXT NOT NULL,
        url_path TEXT NOT NULL,
        mime_type TEXT NOT NULL,
        size_bytes INTEGER NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log('Initialized PostgreSQL schema')
CREATE TABLE IF NOT EXISTS uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  url_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body_markdown TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`)
    // If the table existed before and lacked the upload_id column, add it now
    const cols = []
    for (const r of db.query('PRAGMA table_info(posts)')) cols.push(r)
    const hasUploadId = cols.some((c: any) => c[1] === 'upload_id')
    if (!hasUploadId) {
      try {
        db.run('ALTER TABLE posts ADD COLUMN upload_id INTEGER')
        console.log('Added upload_id column to posts')
      } catch (e) {
        console.warn('Failed to add upload_id column:', String(e))
      }
    }

    const noticeCols = []
    for (const r of db.query('PRAGMA table_info(notices)')) noticeCols.push(r)
    if (!noticeCols.length) {
      try {
        db.run(`
          CREATE TABLE IF NOT EXISTS notices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            body_markdown TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `)
      } catch (e) {
        console.warn('Failed to create notices table:', String(e))
      }
    }

    const noticeRows = []
    for (const r of db.query('SELECT id FROM notices ORDER BY id ASC LIMIT 1')) noticeRows.push(r)
    if (!noticeRows.length) {
      try {
        db.run(`INSERT INTO notices (title, body_markdown) VALUES ('お知らせ', 'ここにお知らせを書けます。')`)
        console.log('Inserted default notice row')
      } catch (e) {
        console.warn('Failed to insert default notice row:', String(e))
      }
    }
    console.log('Initialized SQLite at', dbPath)
    db.close()
  } catch (err) {
    console.error('Failed to initialize database schema:', String(err))
    process.exit(1)
  }
}

main()
