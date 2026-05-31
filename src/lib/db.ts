import postgres from 'postgres'

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://blog_user:secure_password@localhost:5432/blog_db'
export const sql = postgres(DATABASE_URL, { max: 10 })

export async function withDB<T>(fn: (db: typeof sql) => Promise<T> | T) {
  return fn(sql)
}

export async function listPosts() {
  const rows = await sql`
    SELECT
      posts.id,
      posts.title,
      substr(posts.body_markdown, 1, 200) AS excerpt,
      posts.created_at,
      posts.cover_image,
      uploads.url_path AS cover_image_url
    FROM posts
    LEFT JOIN uploads ON uploads.id = CASE WHEN posts.cover_image ~ '^[0-9]+$' THEN posts.cover_image::integer ELSE NULL END
    ORDER BY posts.created_at DESC
  `
  return rows.map((r: any) => ({
    ...r,
    excerpt: stripMarkdown(String(r.excerpt || '')),
  }))
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
  const rows = await sql`
    SELECT
      posts.*,
      uploads.url_path AS cover_image_url
    FROM posts
    LEFT JOIN uploads ON uploads.id = CASE WHEN posts.cover_image ~ '^[0-9]+$' THEN posts.cover_image::integer ELSE NULL END
    WHERE posts.id = ${id}
  `
  return rows.length ? rows[0] : null
}

export async function createPost({ title, body_markdown, cover_image = null, tags = null }:{title:string,body_markdown:string,cover_image?:number|string|null,tags?:string|null}) {
  if (typeof cover_image === 'number') {
    const [res] = await sql`
      INSERT INTO posts (title, body_markdown, cover_image, tags, updated_at)
      VALUES (${title}, ${body_markdown}, ${cover_image}, ${tags}, CURRENT_TIMESTAMP)
      RETURNING id
    `
    return { lastInsertRowid: res?.id ?? null }
  }

  const imageUrls = body_markdown.match(/!\[.*?\]\((.*?)\)/g)?.map(m => {
    const mm = m.match(/\((.*?)\)/)
    return mm ? mm[1] : ''
  }).filter(Boolean) || []

  const firstUrl = imageUrls.length > 0 ? imageUrls[0] : null
  let thumbnailId: number | null = null

  if (firstUrl) {
    let lookup = firstUrl
    try {
      if (/^https?:\/\//i.test(lookup)) {
        const nu = new URL(lookup)
        lookup = nu.pathname
      }
    } catch (e) {}

    const rows = await sql`
      SELECT id
      FROM uploads
      WHERE url_path = ${lookup}
      ORDER BY created_at ASC
      LIMIT 1
    `
    if (rows[0]) thumbnailId = rows[0].id
  }

  const coverValue: any = thumbnailId !== null ? thumbnailId : (cover_image || null)
  const [res] = await sql`
    INSERT INTO posts (title, body_markdown, cover_image, tags, updated_at)
    VALUES (${title}, ${body_markdown}, ${coverValue}, ${tags}, CURRENT_TIMESTAMP)
    RETURNING id
  `
  return { lastInsertRowid: res?.id ?? null }
}

export async function createUpload({ original_name, stored_name, url_path, mime_type, size_bytes }:{original_name:string,stored_name:string,url_path:string,mime_type:string,size_bytes:number}) {
  const [res] = await sql`
    INSERT INTO uploads (original_name, stored_name, url_path, mime_type, size_bytes)
    VALUES (${original_name}, ${stored_name}, ${url_path}, ${mime_type}, ${size_bytes})
    RETURNING id
  `
  return { lastInsertRowid: res?.id ?? null }
}
