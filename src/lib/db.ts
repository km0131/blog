import path from 'path'

const dbPath = path.join(process.cwd(), 'data', 'db.sqlite')

export async function withDB(fn: (db: any) => any) {
  try {
    const mod = await import('bun:sqlite')
    const DB = mod.DB ?? mod.default ?? mod.Sqlite ?? mod.Database
    if (!DB) throw new Error('bun:sqlite export not found')
    const db = new DB(dbPath)
    try {
      return await fn(db)
    } finally {
      try { db.close() } catch (e) {}
    }
  } catch (err) {
    throw new Error('Database not available: ' + String(err))
  }
}

export async function listPosts() {
  return withDB((db) => {
    const rows = []
    for (const r of db.query(`
      SELECT
        posts.id,
        posts.title,
        substr(posts.body_markdown, 1, 200) AS excerpt,
        posts.created_at,
        posts.cover_image,
        uploads.url_path AS cover_image_url
      FROM posts
      LEFT JOIN uploads ON uploads.id = CAST(posts.cover_image AS INTEGER)
      ORDER BY posts.created_at DESC
    `)) {
      rows.push({
        ...r,
        excerpt: stripMarkdown(String((r as any).excerpt || '')),
      })
    }
    return rows
  })
}

function stripMarkdown(text: string) {
  return String(text || '')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<\/?(?:h[1-6]|p|div|span|br|hr|figure|figcaption|section|article|header|footer|a|strong|em|b|i|u|ul|ol|li|blockquote|code|pre|table|thead|tbody|tr|td|th)[^>]*>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\(([^)]+)\)/g, '')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[>*_~#-]/g, ' ')
    .replace(/\r?\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function getPost(id: number) {
  return withDB((db) => {
    const rows = []
    // Use template literal for id since it's a number (safe from injection)
    for (const r of db.query(`
      SELECT
        posts.*,
        uploads.url_path AS cover_image_url
      FROM posts
      LEFT JOIN uploads ON uploads.id = CAST(posts.cover_image AS INTEGER)
      WHERE posts.id = ${id}
    `)) rows.push(r)
    return rows.length ? rows[0] : null
  })
}

export async function createPost({ title, body_markdown, cover_image = null, tags = null }:{title:string,body_markdown:string,cover_image?:number|string|null,tags?:string|null}) {
  return withDB((db) => {
    const coverValue = resolveCoverImageId(db, body_markdown, cover_image)
    const stmt = db.prepare('INSERT INTO posts (title, body_markdown, cover_image, tags, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)')
    const res = stmt.run(title, body_markdown, coverValue, tags)
    return { lastInsertRowid: res.lastInsertRowid }
  })
}

export async function updatePost(id: number, { title, body_markdown, cover_image = null, tags = null }:{title:string,body_markdown:string,cover_image?:number|string|null,tags?:string|null}) {
  return withDB((db) => {
    const coverValue = resolveCoverImageId(db, body_markdown, cover_image)
    const stmt = db.prepare('UPDATE posts SET title = ?, body_markdown = ?, cover_image = ?, tags = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    const res = stmt.run(title, body_markdown, coverValue, tags, id)
    return { changes: res.changes }
  })
}

function resolveCoverImageId(db: any, body_markdown: string, cover_image: number|string|null) {
  // If caller provided a numeric cover_image id, prefer it and skip URL lookup.
  if (typeof cover_image === 'number') {
    return cover_image
  }

  // 1. Markdownから全画像URLを抽出
  const imageUrls = body_markdown.match(/!\[.*?\]\((.*?)\)/g)?.map(m => {
    const mm = m.match(/\((.*?)\)/)
    return mm ? mm[1] : ''
  }).filter(Boolean) || []

  // 2. 一番上のリンク（配列の最初の要素）が存在するかチェック
  const firstUrl = imageUrls.length > 0 ? imageUrls[0] : null

  let thumbnailId: number | null = null

  if (firstUrl) {
    // normalize absolute URLs to pathname if necessary
    let lookup = firstUrl
    try {
      if (/^https?:\/\//i.test(lookup)) {
        const nu = new URL(lookup)
        lookup = nu.pathname
      }
    } catch (e) {}

    // 3. そのURLでDBを検索（created_atが最古のものを1件）
    const query = db.prepare('SELECT id FROM uploads WHERE url_path = ? ORDER BY datetime(created_at) ASC LIMIT 1')
    const rows: any[] = query.all(lookup)

    if (rows[0]) {
      thumbnailId = rows[0].id
    }
  }

  // If thumbnailId found, store it; otherwise use provided (string) cover_image or NULL.
  return thumbnailId !== null ? thumbnailId : (cover_image || null)
}

export async function createUpload({ original_name, stored_name, url_path, mime_type, size_bytes }:{original_name:string,stored_name:string,url_path:string,mime_type:string,size_bytes:number}) {
  return withDB((db) => {
    const stmt = db.prepare('INSERT INTO uploads (original_name, stored_name, url_path, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?)')
    const res = stmt.run(original_name, stored_name, url_path, mime_type, size_bytes)
    return { lastInsertRowid: res.lastInsertRowid }
  })
}
