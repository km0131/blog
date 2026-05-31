import { Hono } from 'hono'
import { serveStatic } from 'hono/bun' // これを追加
import { marked } from 'marked'
import path from 'path'
import fs from 'fs'
import { renderPostsList } from './views/postsList'
import { renderPostEditor } from './views/postEditor'
import { renderNoticeEditor } from './views/noticeEditor'
import { layout } from './views/layout'
import { listPosts, getPost, getNotice, upsertNotice, createPost, updatePost, createUpload, withDB } from './lib/db'

const app = new Hono()

// Keep the editor module available at the legacy path used by the page.
app.get('/editor.js', async (c) => {
  const explicit = path.resolve('public', 'editor.js')
  if (!fs.existsSync(explicit)) {
    return c.text('editor bundle not found', 404)
  }

  const file = Bun.file(explicit)
  return c.body(file as any, 200, {
    'Content-Type': 'application/javascript',
    'Cache-Control': 'no-cache',
  })
})

// Also keep the newer bundle alias working for any existing links.
app.get('/editor-bundle.js', async (c) => {
  return c.redirect('/editor.js')
})

app.get('/favicon/*', async (c) => {
  const reqPath = decodeURIComponent(c.req.path.replace(/^\/favicon\//, ''))
  if (!reqPath || reqPath.includes('..') || reqPath.includes('\\')) {
    return c.text('Invalid path', 400)
  }

  const abs = path.join(process.cwd(), 'public', 'favicon', reqPath)
  if (!fs.existsSync(abs)) {
    return c.text('Not found', 404)
  }

  const file = Bun.file(abs)
  const contentType = reqPath.endsWith('.png')
    ? 'image/png'
    : reqPath.endsWith('.ico')
      ? 'image/x-icon'
      : 'application/octet-stream'

  return c.body(file as any, 200, {
    'Content-Type': contentType,
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
})

app.use('/', serveStatic({ root: './public' }))

// ルートにアクセスがあった場合は投稿一覧を表示する
app.get('/', async (c) => {
  try {
    const posts = await listPosts()
    const notice = await getNotice()
    return c.html(renderPostsList(posts, notice))
  } catch (err) {
    return c.text('Failed to load posts: ' + String(err), 500)
  }
})

// API: health
app.get('/api/health', (c) => c.text('ok'))

app.post('/api/uploads', async (c) => {
  try {
    const contentType = c.req.header('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return c.json({ ok: false, error: 'multipart/form-data is required' }, 400)
    }

    const form = await c.req.formData()
    const file = form.get('image')
    if (!(file instanceof File)) {
      return c.json({ ok: false, error: 'image file is required' }, 400)
    }

    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
    if (!file.type || !allowedTypes.has(file.type)) {
      return c.json({ ok: false, error: 'unsupported image type (use jpg/png/webp/gif)' }, 400)
    }

    const maxBytes = 20 * 1024 * 1024
    if (file.size > maxBytes) {
      return c.json({ ok: false, error: 'file too large (max 20MB)' }, 400)
    }

    const bytes = new Uint8Array(await file.arrayBuffer())
    if (!looksLikeImage(bytes, file.type)) {
      return c.json({ ok: false, error: 'file content is not a valid image' }, 400)
    }

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

    const safeName = (file.name || 'image')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^_+/, '')
    const ext = path.extname(safeName) || '.bin'
    const base = path.basename(safeName, ext) || 'image'
    const finalName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base}${ext}`
    const outputPath = path.join(uploadsDir, finalName)
    const urlPath = `/uploads/${finalName}`

    await Bun.write(outputPath, bytes)

    const saved = await createUpload({
      original_name: file.name || 'image',
      stored_name: finalName,
      url_path: urlPath,
      mime_type: file.type,
      size_bytes: file.size,
    })

    return c.json({ ok: true, id: saved.lastInsertRowid, url: urlPath })
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

app.get('/uploads/*', async (c) => {
  const reqPath = decodeURIComponent(c.req.path.replace(/^\/uploads\//, ''))
  if (!reqPath || reqPath.includes('..') || reqPath.includes('\\')) {
    return c.text('Invalid path', 400)
  }

  const abs = path.join(process.cwd(), 'public', 'uploads', reqPath)
  if (!fs.existsSync(abs)) {
    return c.text('Not found', 404)
  }

  const file = Bun.file(abs)
  return c.body(file as any, 200, {
    'Content-Type': file.type || 'application/octet-stream',
    'Cache-Control': 'public, max-age=31536000, immutable',
  })
})

app.get('/posts', async (c) => {
  try {
    const posts = await listPosts()
    const notice = await getNotice()
    return c.html(renderPostsList(posts, notice))
  } catch (err) {
    return c.text('Failed to load posts: ' + String(err), 500)
  }
})

app.get('/notice/edit', async (c) => {
  try {
    const notice = await getNotice()
    return c.html(renderNoticeEditor(notice))
  } catch (err) {
    return c.text('Failed to load notice: ' + String(err), 500)
  }
})

app.get('/posts/new', async (c) => {
  return c.html(renderPostEditor(null))
})

app.get('/posts/:id/edit', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const post = await getPost(id)
    if (!post) return c.text('Not found', 404)
    return c.html(renderPostEditor(post))
  } catch (err) {
    return c.text('Failed to load post: ' + String(err), 500)
  }
})

app.get('/posts/:id', async (c) => {
  const id = Number(c.req.param('id'))
  try {
    const post = await getPost(id)
    if (!post) return c.text('Not found', 404)
    const featuredImage = String(post.cover_image_url || '').trim() || extractFirstImage(post.body_markdown || '')
    const html = removeFirstImageFromHtml(
      makeImagesClickable(await marked(post.body_markdown)),
      featuredImage
    )
    const createdAt = post.created_at ? new Date(post.created_at) : null
    const metaDate = createdAt && !isNaN(createdAt.getTime())
      ? createdAt.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' })
      : ''
    const content = `
      <article class="article-container paper-frame py-12 px-5 md:px-8">
        <h1 class="text-3xl md:text-4xl font-bold leading-tight mb-6">${escapeHtml(post.title)}</h1>
        <div class="meta-info flex items-center justify-between gap-4 flex-wrap">
          <span>${metaDate || 'Created post'}</span>
          <div class="flex items-center gap-2">
            <a href="/posts/${post.id}/edit" class="btn-soft font-bold">編集する</a>
            <a href="/posts" class="btn-soft font-bold">一覧に戻る</a>
          </div>
        </div>
        ${featuredImage ? `
          <img src="${escapeHtml(featuredImage)}" alt="${escapeHtml(post.title)}" class="post-image">
        ` : ''}
        <div class="content-prose content-body text-left">
          ${html}
        </div>
      </article>
      <div class="mt-6 text-center">
        <a href="/posts" class="text-sm opacity-60 hover:opacity-100 transition">一覧に戻る</a>
      </div>
    `
    return c.html(layout(escapeHtml(post.title) + ' - ワンちゃんブログ', content))
  } catch (err) {
    return c.text('Failed to load post: ' + String(err), 500)
  }
})

app.post('/api/posts', async (c) => {
  try {
    const body = await c.req.json()
    const id = Number(body.id || 0)
    const title = String(body.title || 'untitled')
    const md = String(body.body_markdown || '')
    const coverImageUrl = String(body.cover_image_url || '')

    let coverImageId: number | null = null
    if (coverImageUrl) {
      let lookup = coverImageUrl
      try {
        if (/^https?:\/\//i.test(lookup)) {
          const nu = new URL(lookup)
          lookup = nu.pathname
        }
      } catch (e) {}

      const rows: any[] = await withDB(async (db: any) => {
        return await db`
          SELECT id
          FROM uploads
          WHERE url_path = ${lookup}
          ORDER BY created_at ASC
          LIMIT 1
        `
      })
      if (rows[0]) coverImageId = rows[0].id
    }

    if (id > 0) {
      const res = await updatePost(id, { title, body_markdown: md, cover_image: coverImageId })
      return c.json({ ok: true, id, changes: res.changes })
    }

    const res = await createPost({ title, body_markdown: md, cover_image: coverImageId })
    return c.json({ ok: true, id: res.lastInsertRowid })
  } catch (err) {
    return c.json({ ok: false, error: String(err) })
  }
})

app.post('/api/notice', async (c) => {
  try {
    const body = await c.req.json()
    const title = String(body.title || 'お知らせ')
    const body_markdown = String(body.body_markdown || '')
    const res = await upsertNotice({ title, body_markdown })
    return c.json({ ok: true, id: res.id })
  } catch (err) {
    return c.json({ ok: false, error: String(err) }, 500)
  }
})

function escapeHtml(s: any) {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function makeImagesClickable(html: string) {
  // add width attribute to images when rendering server-side previews
  return html.replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*)>/g, '<a href="$2" target="_blank" rel="noopener noreferrer"><img $1src="$2"$3 width="300"></a>')
}

function extractFirstImage(body: string) {
  if (!body) return ''
  const match = body.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return match ? match[1] : ''
}

function removeFirstImageFromHtml(html: string, imageUrl: string) {
  const target = String(imageUrl || '').trim()
  if (!target) return html

  const escaped = escapeRegExp(target)
  const patterns = [
    new RegExp(`<a\\b[^>]*href="${escaped}"[^>]*>\\s*<img\\b[^>]*src="${escaped}"[^>]*>\\s*</a>`, 'i'),
    new RegExp(`<a\\b[^>]*href="${escaped}"[^>]*>\\s*<img\\b[^>]*src="${escaped}"[^>]*>`, 'i'),
    new RegExp(`<img\\b[^>]*src="${escaped}"[^>]*>`, 'i'),
  ]

  let result = html
  for (const pattern of patterns) {
    if (pattern.test(result)) {
      result = result.replace(pattern, '')
      break
    }
  }

  return result.trim()
}

function escapeRegExp(text: string) {
  return String(text || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function looksLikeImage(bytes: Uint8Array, mimeType: string) {
  const isPng = bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a

  const isJpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff

  const isGif = bytes.length >= 6 &&
    bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38 &&
    (bytes[4] === 0x39 || bytes[4] === 0x37) && bytes[5] === 0x61

  const isWebp =
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50

  if (mimeType === 'image/png') return isPng
  if (mimeType === 'image/jpeg') return isJpeg
  if (mimeType === 'image/gif') return isGif
  if (mimeType === 'image/webp') return isWebp
  return false
}

const port = Number(process.env.PORT || 3000)
console.log(`Listening on http://0.0.0.0:${port}`)

if (typeof Bun !== 'undefined' && typeof Bun.serve === 'function') {
  Bun.serve({ port, fetch: app.fetch })
} else {
  // Node fallback (minimal)
  import('http').then(({ createServer }) => {
    const server = createServer((req, res) => {
      app.fetch(req).then((r: any) => {
        res.writeHead(r.status, Object.fromEntries(r.headers))
        r.arrayBuffer().then((buf: ArrayBuffer) => {
          res.end(Buffer.from(buf))
        })
      }).catch((err: any) => {
        res.statusCode = 500
        res.end(String(err))
      })
    })
    server.listen(port)
  })
}
