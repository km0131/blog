export function layout(title: string, content: string) {
  return `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title}</title>
  <!-- 標準ブラウザ用 -->
  <link rel="icon" href="/favicon/favicon-32x32.png" type="image/png" sizes="32x32">
  <!-- icoブラウザ用 -->
  <link rel="icon" href="/favicon/favicon.ico" type="image/x-icon">
  <!-- iPhone用 -->
  <link rel="apple-touch-icon" href="/favicon/android-chrome-192x192.png" sizes="32x32">
  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
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
      background:
        radial-gradient(circle at top left, rgba(232, 141, 103, 0.08), transparent 34%),
        radial-gradient(circle at top right, rgba(93, 77, 66, 0.04), transparent 28%),
        var(--warm-bg);
      color: var(--warm-text);
      line-height: 1.9;
    }

    .font-hand {
      font-family: 'Yomogi', cursive;
    }

    .paper-frame {
      background: var(--paper-white);
      box-shadow: 0 4px 15px rgba(93, 77, 66, 0.08);
      border-radius: 4px;
    }

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

    .content-prose h1,
    .content-prose h2,
    .content-prose h3 {
      font-weight: 700;
      line-height: 1.4;
      margin-top: 1.4em;
      margin-bottom: 0.7em;
      text-align: left;
    }

    .content-prose p {
      margin-bottom: 1em;
      text-align: left;
    }

    .content-prose ul,
    .content-prose ol,
    .content-prose blockquote {
      display: inline-block;
      text-align: left;
      margin-left: auto;
      margin-right: auto;
    }

    .content-prose img,
    .content-prose video,
    .content-prose iframe {
      display: block;
      margin-left: auto;
      margin-right: auto;
      width: 100%;
      max-width: 100%;
      height: 360px;
      object-fit: cover;
      border-radius: 10px;
    }

    .article-container {
      max-width: 680px;
      margin: 0 auto;
    }

    .post-image {
      width: 100%;
      height: 360px;
      object-fit: cover;
      border-radius: 10px;
      box-shadow: 0 10px 30px -10px rgba(93, 77, 66, 0.18);
      margin: 0 auto 2rem;
    }

    .meta-info {
      color: rgba(93, 77, 66, 0.72);
      font-size: 0.875rem;
      margin-bottom: 2rem;
      border-bottom: 1px solid rgba(232, 141, 103, 0.18);
      padding-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="max-w-5xl mx-auto px-6 py-8 md:px-8 md:py-10">
    <header class="mb-10 text-center">
      <a href="/" class="font-hand text-4xl md:text-5xl text-orange-700 mb-1 inline-block">OneLife</a>
      <p class="text-[10px] tracking-[0.2em] opacity-50 uppercase">こま & るる</p>
    </header>
    <main>
      ${content}
    </main>
  </div>
</body>
</html>`
}
