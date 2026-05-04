import { layout } from './layout';
import { marked } from 'marked';

export function renderPostEditor(post: any = null) {
  // 1. サーバー側で必要な変数の準備
  const title = post ? escapeHtml(post.title) : '';
  const idInput = (post && post.id) ? `<input type="hidden" name="id" value="${post.id}" />` : '';
  
  // サーバー側で初期プレビューHTMLを生成（初回表示用）
  const initialPreviewHtml = post ? marked(post.body_markdown) : '';

  // 2. HTMLコンテンツの組み立て
  const content = `
    <div class="flex justify-between items-end mb-8 border-b border-orange-100 pb-5">
      <div>
        <h2 class="text-2xl font-bold">投稿作成</h2>
        <p class="text-xs opacity-60">わんことの日常をやわらかく残す</p>
      </div>
      <a href="/posts" class="btn-soft font-bold">一覧に戻る</a>
    </div>
    <div class="flex flex-col md:flex-row gap-8">
      <div class="md:w-1/2 paper-frame p-5 md:p-6">
        <form id="postForm" class="space-y-5">
          ${idInput}
          <div>
            <label class="block text-sm font-medium mb-1">タイトル</label>
            <input name="title" class="block w-full border border-orange-100 rounded px-3 py-2 bg-orange-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200" value="${title}" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">本文（TipTap エディタ）</label>
            <div class="mt-2 flex items-center gap-2">
              <input type="file" id="imageInput" accept="image/png,image/jpeg,image/webp,image/gif" class="hidden" />
              <button type="button" id="insertImageBtn" class="btn-soft my-2 px-3 py-1.5 text-sm">画像を挿入</button>
            </div>
            <div id="editor-root" class="mt-3 border border-orange-100 rounded p-3 min-h-80 bg-white prose prose-sm max-w-none"></div>
            <textarea name="body_markdown" class="hidden"></textarea>
          </div>
          <div class="flex items-center space-x-2">
            <button type="button" id="saveBtn" class="btn-soft px-4 py-2">保存</button>
          </div>
        </form>
      </div>
      <div class="md:w-1/2 paper-frame p-5 md:p-6">
        <label class="block text-sm font-medium mb-2">プレビュー（Markdown変換結果）</label>
        <div id="preview-pane" class="border border-orange-100 rounded p-3 min-h-80 bg-white prose prose-sm max-w-none">${initialPreviewHtml}</div>
      </div>
    </div>

    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/atom-one-dark.min.css" />
    <style>
      #editor-root h1, #preview-pane h1 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin: 0.8em 0 0.4em; }
      #editor-root h2, #preview-pane h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 700; margin: 0.7em 0 0.35em; }
    </style>

    <script type="module">
      import { initEditor, getMarkdown, setMarkdown } from "/editor.js";
      import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

      const editor = initEditor("editor-root");
      const previewPane = document.getElementById("preview-pane");

      // 編集時の初期値セット（生のMarkdownをエディタにセット）
      ${post ? `
        const initialMarkdown = ${JSON.stringify(post.body_markdown)};
        if (typeof setMarkdown === 'function') {
          setMarkdown(initialMarkdown);
        } else if (editor && initialMarkdown) {
          // フォールバック: そのままテキストとして挿入
          editor.chain().focus().setContent(initialMarkdown).run();
        }
        // 初期プレビューを更新
        updatePreview();
      ` : ''}

      function updatePreview() {
        if (typeof getMarkdown === "function") {
          const md = getMarkdown();
          previewPane.innerHTML = makeImagesClickable(marked.parse(md));
        }
      }

      // Wrap images with anchors and set display width (client-side DOM safer)
      function makeImagesClickable(html) {
        try {
          const container = document.createElement('div')
          container.innerHTML = String(html)
          const imgs = container.querySelectorAll('img')
          imgs.forEach((img) => {
            // set fixed width and maintain aspect ratio
            img.setAttribute('width', '300')
            img.style.height = 'auto'
            // wrap with anchor
            const src = img.getAttribute('src')
            if (src && img.parentElement?.tagName !== 'A') {
              const a = document.createElement('a')
              a.href = src
              a.target = '_blank'
              a.rel = 'noopener noreferrer'
              img.parentNode?.replaceChild(a, img)
              a.appendChild(img)
            }
          })
          return container.innerHTML
        } catch (e) {
          // fallback to simple regex replace
          return String(html).replace(/<img\s+([^>]*?)src="([^"]+)"([^>]*)>/g, '<a href="$2" target="_blank" rel="noopener noreferrer"><img $1src="$2"$3 width="300"></a>')
        }
      }

      // If server provided initial preview HTML, post-process image links
      if (previewPane && previewPane.innerHTML) {
        previewPane.innerHTML = makeImagesClickable(previewPane.innerHTML);
      }

      if (editor) {
        editor.on("update", updatePreview);
      }

      // 画像アップロード処理: 共通関数 + input change で自動実行
      async function uploadAndInsert(file, button) {
        if (!editor) return;
        if (!file) { alert("画像を選択してください"); return; }

        const fd = new FormData();
        fd.append("image", file);
        const oldLabel = button?.textContent || '';
        if (button) { button.textContent = "アップロード中..."; button.disabled = true; }

        try {
          const res = await fetch("/api/uploads", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok || !data.ok || !data.url) {
            throw new Error(data.error || "unknown error");
          }
          try {
            const existingMd = (typeof getMarkdown === 'function') ? getMarkdown() : (document.querySelector('textarea[name="body_markdown"]')?.value || '')
            const base = file.name || 'image'
            const token = '![' + base + ']'
            const count = existingMd.split(token).length - 1
            const label = count > 0 ? base + ' (' + (count + 1) + ')' : base
            editor.chain().focus().insertContent('![' + label + '](' + data.url + ')').run();
          } catch (e) {
            editor.chain().focus().insertContent('![' + file.name + '](' + data.url + ')').run();
          }
          const input = document.getElementById("imageInput");
          if (input) input.value = "";
          // update preview immediately
          updatePreview();
        } catch (e) {
          alert("画像アップロードに失敗しました: " + e.message);
        } finally {
          if (button) { button.textContent = oldLabel; button.disabled = false; }
        }
      }

      const insertBtn = document.getElementById("insertImageBtn");
      const inputEl = document.getElementById("imageInput");

      if (insertBtn) {
        insertBtn.addEventListener("click", async () => {
          inputEl?.click();
        });
      }

      if (inputEl) {
        inputEl.addEventListener('change', async (ev) => {
          const file = ev.target.files?.[0];
          // call uploadAndInsert without a button (null) so UI isn't blocked
          await uploadAndInsert(file, null);
        });
      }

      // 保存処理
      document.getElementById("saveBtn").addEventListener("click", async () => {
        const form = document.getElementById("postForm");
        const title = form.querySelector('input[name="title"]').value;
        const md = (typeof getMarkdown === "function") ? getMarkdown() : "";
        const id = form.querySelector('input[name="id"]')?.value;
        const imageMatch = md.match(/!\[.*?\]\((.*?)\)/);
        const coverImageUrl = imageMatch ? imageMatch[1] : null;

        const obj = { id, title, body_markdown: md, cover_image_url: coverImageUrl };
        const res = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(obj)
        });

        if (res.ok) {
          location.href = "/posts";
        } else {
          alert("保存に失敗しました");
        }
      });
    </script>
  `;

  return layout('投稿作成 - ワンちゃんブログ', content);
}

function escapeHtml(s: any) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
