import { layout } from './layout'
import { marked } from 'marked'

export function renderPostsList(posts: any[], notice: any = null) {
  function extractFirstImage(body: string) {
  if (!body) return ''
  const m = body.match(/!\[[^\]]*\]\(([^)]+)\)/)
  return m ? m[1] : ''
  }

  function resolveCoverImage(p: any) {
    const coverImageUrl = String(p.cover_image_url || '')
    if (coverImageUrl) return coverImageUrl
    const coverImage = p.cover_image
    if (typeof coverImage === 'string' && coverImage) return coverImage
    return extractFirstImage(p.body_markdown || '') || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&q=80&w=600'
  }

  const items = posts.map((p) => {
  const title = escapeHtml(p.title || '')
  const excerpt = escapeHtml(String(p.excerpt || '').substring(0, 200))
  const img = resolveCoverImage(p)
  return `
      <article class="relative flex flex-col group cursor-pointer">
        <div class="tape"></div>
        <div class="photo-frame mb-4">
          <div class="aspect-[4/3] bg-orange-50 overflow-hidden rounded-sm">
            <img src="${escapeHtml(img)}" class="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition duration-500">
          </div>
        </div>
        <div class="px-2">
          <h3 class="text-lg font-bold mb-2 group-hover:text-orange-600 transition">
            ${title}
          </h3>
          <p class="text-sm text-stone-500 leading-relaxed line-clamp-3 mb-4">
            ${excerpt}
          </p>
          <a href="/posts/${p.id}" class="text-xs font-bold text-orange-400 border-b border-orange-200 pb-0.5 hover:text-orange-600 hover:border-orange-600 transition">
            日記を読む
          </a>
        </div>
      </article>`
  }).join('\n')

  const noticeHtml = notice ? `
    <section class="paper-frame p-5 md:p-6 mb-0 border-l-4 border-orange-300">
      <div class="flex items-center justify-between gap-4 mb-3">
        <div>
          <p class="text-xs tracking-[0.2em] uppercase text-orange-500 font-bold">Notice</p>
          <h2 class="text-xl font-bold mt-1">${escapeHtml(notice.title || 'お知らせ')}</h2>
        </div>
        <a href="/notice/edit" class="btn-soft font-bold text-sm">お知らせを編集</a>
      </div>
      <div class="content-prose text-left">
        ${marked.parse(String(notice.body_markdown || ''))}
      </div>
    </section>
  ` : `
    <section class="paper-frame p-5 md:p-6 mb-0 border-l-4 border-orange-300">
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs tracking-[0.2em] uppercase text-orange-500 font-bold">Notice</p>
          <h2 class="text-xl font-bold mt-1">お知らせはまだありません</h2>
        </div>
        <a href="/notice/edit" class="btn-soft font-bold text-sm">お知らせを作成</a>
      </div>
    </section>
  `

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>投稿一覧 - OneLife</title>
  <!-- 標準ブラウザ用 -->
  <link rel="icon" href="/favicon/favicon-32x32.png" type="image/png" sizes="32x32">
  <!-- icoブラウザ用 -->
  <link rel="icon" href="/favicon/favicon.ico" type="image/x-icon">
  <!-- iPhone用 -->
  <link rel="apple-touch-icon" href="/favicon/android-chrome-192x192.png" sizes="32x32">
    <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;700&family=Yomogi&display=swap" rel="stylesheet">
  <style>
    :root {
      --warm-bg: #FDF9F3;
      --warm-accent: #E88D67;
      --warm-text: #5D4D42;
      --paper-white: #FFFFFF;
    }

    body {
      font-family: 'Zen Maru Gothic', sans-serif;
      background-color: var(--warm-bg);
      color: var(--warm-text);
      line-height: 1.9;
    }

    .font-hand {
      font-family: 'Yomogi', cursive;
    }

    /* アルバム風の写真枠 */
    .photo-frame {
      background: var(--paper-white);
      padding: 12px 12px 32px 12px;
      box-shadow: 0 4px 15px rgba(93, 77, 66, 0.08);
      transform: rotate(-1deg);
      transition: all 0.3s ease;
    }

    .photo-frame:nth-child(even) {
      transform: rotate(1.5deg);
    }

    .photo-frame:hover {
      transform: rotate(0deg) scale(1.02);
      box-shadow: 0 8px 25px rgba(93, 77, 66, 0.12);
    }

    /* 柔らかいボタン */
    .btn-soft {
      background-color: var(--warm-accent);
      color: white;
      padding: 10px 24px;
      border-radius: 30px;
      box-shadow: 0 4px 0px #C67252;
      transition: all 0.2s;
      display: inline-block;
      font-size: 0.875rem;
    }

    .btn-soft:active {
      transform: translateY(2px);
      box-shadow: 0 2px 0px #C67252;
    }

    .section-title {
      position: relative;
      display: inline-block;
      margin-bottom: 2rem;
    }

    .section-title::after {
      content: '';
      position: absolute;
      bottom: 4px;
      left: 0;
      width: 100%;
      height: 8px;
      background: rgba(232, 141, 103, 0.15);
      z-index: -1;
    }

    /* マステ風装飾 */
    .tape {
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 80px;
      height: 24px;
      background: rgba(232, 141, 103, 0.2);
      backdrop-filter: blur(1px);
      z-index: 10;
    }
  </style>
</head>
<body class="pb-20">

  <!-- ヘッダー -->
  <nav class="px-6 py-10">
    <div class="max-w-4xl mx-auto flex flex-col items-center">
      <a href="/" class="font-hand text-4xl text-orange-700 mb-1">OneLife</a>
      <p class="text-[10px] tracking-[0.2em] opacity-50 uppercase">こま & るる</p>
    </div>
  </nav>

  <main class="max-w-4xl mx-auto px-6">

    <!-- お知らせ -->
    ${noticeHtml ? `<div class="mt-5 mb-8">${noticeHtml}</div>` : ''}
    <!-- 投稿一覧のヘッダー -->
    <div class="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-12 border-b border-orange-100 pb-6">
      <div class="flex-1">
        <span class="text-2xl">🐾</span>
        <h2 class="section-title text-2xl font-bold">記事の一覧</h2>
        <p class="text-xs opacity-60">わんことの何気ない日常を綴っています</p>
      </div>
      <a href="/posts/new" class="btn-soft font-bold self-start md:mt-2">
        <span class="mr-1">＋</span> 新しく書く
      </a>
    </div>

    <!-- 投稿リスト (JavaScriptで生成される items 部分を想定) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-10">
      ${items}
    </div>

  </main>

  <!-- フッター -->
  <footer class="mt-24 text-center">
    <p class="text-[10px] opacity-30">&copy; WanLife Diary</p>
  </footer>

</body>
</html>`

  return html
}

function escapeHtml(s: any) {
  if (!s) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
