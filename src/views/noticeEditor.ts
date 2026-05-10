import { layout } from './layout'

export function renderNoticeEditor(notice: any = null) {
  const title = escapeHtml(notice?.title || '')
  const body = escapeHtml(notice?.body_markdown || '')
  const pageTitle = 'お知らせ編集 - ワンちゃんブログ'

  const content = `
    <div class="flex justify-between items-end mb-8 border-b border-orange-100 pb-5">
      <div>
        <h2 class="text-2xl font-bold">お知らせ編集</h2>
        <p class="text-xs opacity-60">ホームに出すお知らせを簡単に更新できます</p>
      </div>
      <a href="/" class="btn-soft font-bold">ホームに戻る</a>
    </div>

    <div class="paper-frame p-5 md:p-6 max-w-3xl mx-auto">
      <form id="noticeForm" class="space-y-5">
        <div>
          <label class="block text-sm font-medium mb-1">見出し</label>
          <input name="title" class="block w-full border border-orange-100 rounded px-3 py-2 bg-orange-50/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-200" value="${title}" placeholder="例: 今日は臨時休業です" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">本文（Markdown）</label>
          <textarea name="body_markdown" rows="12" class="block w-full border border-orange-100 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-200 font-mono text-sm">${body}</textarea>
          <p class="text-xs opacity-50 mt-2">見出しや改行、リンク、箇条書きをそのまま入力できます。</p>
        </div>
        <div class="flex items-center gap-2">
          <button type="button" id="saveBtn" class="btn-soft px-4 py-2">保存</button>
          <a href="/" class="text-sm opacity-60 hover:opacity-100 transition">キャンセル</a>
        </div>
      </form>
    </div>

    <script type="module">
      const saveBtn = document.getElementById('saveBtn')
      saveBtn?.addEventListener('click', async () => {
        const form = document.getElementById('noticeForm')
        const title = form.querySelector('input[name="title"]').value
        const body_markdown = form.querySelector('textarea[name="body_markdown"]').value
        const res = await fetch('/api/notice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, body_markdown })
        })

        if (res.ok) {
          location.href = '/'
        } else {
          alert('保存に失敗しました')
        }
      })
    </script>
  `

  return layout(pageTitle, content)
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