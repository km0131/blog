import { Editor } from '@tiptap/core'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import History from '@tiptap/extension-history'

let editorInstance: Editor | null = null;

export function initEditor(elementId: string) {
  const element = document.getElementById(elementId);
  if (!element) return null;

  editorInstance = new Editor({
    element: element,
    extensions: [
      Document,
      Paragraph,
      Text,
      History,
    ],
    content: '',
    onUpdate({ editor }) {
      try {
        const md = editor.getText({ blockSeparator: "\n" })
        const field = document.querySelector('textarea[name="body_markdown"]') as HTMLTextAreaElement
        if (field) field.value = md
      } catch (e) {}
    },
    // エディタ内のクラスを調整して等幅フォントにする
    editorProps: {
      attributes: {
        class: 'prose-sm focus:outline-none font-mono',
      },
    },
  });
  // Ensure container is focusable and focus the editor on pointer interaction
  try {
    element.tabIndex = 0
    // Focus editor after pointer interaction without preventing default
    element.addEventListener('pointerdown', () => { setTimeout(() => { editorInstance?.commands?.focus?.() }, 0) })
    element.addEventListener('click', () => { editorInstance?.commands?.focus?.() })
  } catch (e) {}

  // expose for debugging in browser console
  try { (window as any).editorInstance = editorInstance } catch (e) {}

  // create toolbar above the editor and bubble menu for selections
  try {
    createToolbar(element, editorInstance)
    createBubbleMenu(editorInstance)
  } catch (e) {}

  return editorInstance;
}

export function getMarkdown() {
  if (!editorInstance) return '';
  // HTML要素を介さず、テキストとして中身を取得する
  return editorInstance.getText({ blockSeparator: "\n" });
}

export function setMarkdown(md: string) {
  if (!editorInstance) return
  try {
    editorInstance.commands.setContent(md)
  } catch (e) {
    try { editorInstance.commands.insertContent(md) } catch (e) { }
  }
}

function createToolbar(container: HTMLElement, editor: Editor | null) {
  const wrap = document.createElement('div')
  wrap.style.display = 'flex'
  wrap.style.gap = '6px'
  wrap.style.marginBottom = '6px'

  const btn = (label: string, cb: () => void) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.style.padding = '6px 8px'
    b.style.borderRadius = '6px'
    b.style.border = '1px solid #ddd'
    b.style.background = '#fff'
    b.style.cursor = 'pointer'
    b.addEventListener('click', (e) => { e.preventDefault(); cb(); container.focus(); })
    return b
  }

  wrap.appendChild(btn('B', () => applyWrap(editor, '**')))
  wrap.appendChild(btn('I', () => applyWrap(editor, '*')))
  wrap.appendChild(btn('H2', () => applyPrefix(editor, '## ')))
  wrap.appendChild(btn('Code', () => applyWrap(editor, '`')))
  wrap.appendChild(btn('Link', () => applyLink(editor)))

  container.parentElement?.insertBefore(wrap, container)
}

function getSelectionText(editor: Editor | null) {
  if (!editor) return ''
  try {
    const sel = editor.state.selection
    const from = (sel as any).from
    const to = (sel as any).to
    return editor.state.doc.textBetween(from, to, '\n')
  } catch (e) {
    return ''
  }
}

function applyWrap(editor: Editor | null, wrapper: string) {
  if (!editor) return
  const txt = getSelectionText(editor)
  if (txt && txt.length > 0) {
    editor.chain().focus().insertContent(`${wrapper}${txt}${wrapper}`).run()
  } else {
    editor.chain().focus().insertContent(`${wrapper}text${wrapper}`).run()
  }
}

function applyPrefix(editor: Editor | null, prefix: string) {
  if (!editor) return
  const txt = getSelectionText(editor)
  if (txt && txt.length > 0) {
    editor.chain().focus().insertContent(`${prefix}${txt}`).run()
  } else {
    editor.chain().focus().insertContent(`${prefix}heading`).run()
  }
}

function applyLink(editor: Editor | null) {
  if (!editor) return
  const txt = getSelectionText(editor)
  const url = window.prompt('URLを入力してください', 'https://') || ''
  if (!url) return
  const isImage = window.confirm('これは画像ですか？ (OK = はい, Cancel = いいえ)')
  const label = txt && txt.length > 0 ? txt : (isImage ? 'alt' : 'link')
  const out = isImage ? `![${label}](${url})` : `[${label}](${url})`
  editor.chain().focus().insertContent(out).run()
}

function createBubbleMenu(editor: Editor | null) {
  const bubble = document.createElement('div')
  bubble.style.position = 'absolute'
  bubble.style.display = 'none'
  bubble.style.padding = '6px'
  bubble.style.background = 'rgba(17,24,39,0.95)'
  bubble.style.color = 'white'
  bubble.style.borderRadius = '6px'
  bubble.style.zIndex = '9999'
  bubble.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
  bubble.style.fontSize = '14px'
  bubble.id = 'tiptap-bubble'

  const btn = (label: string, cb: () => void) => {
    const b = document.createElement('button')
    b.type = 'button'
    b.textContent = label
    b.style.background = 'transparent'
    b.style.color = 'white'
    b.style.border = 'none'
    b.style.padding = '4px 8px'
    b.style.cursor = 'pointer'
    b.style.marginRight = '6px'
    b.addEventListener('pointerdown', (e) => { e.preventDefault() })
    b.addEventListener('click', (e) => { e.preventDefault(); cb(); updateBubbleMenu() })
    return b
  }

  bubble.appendChild(btn('B', () => applyWrap(editor, '**')))
  bubble.appendChild(btn('I', () => applyWrap(editor, '*')))
  bubble.appendChild(btn('H2', () => applyPrefix(editor, '## ')))

  document.body.appendChild(bubble)

  function getSelectionRect() {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return null
    const range = sel.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    return rect && rect.width !== 0 ? rect : null
  }

  function updateBubbleMenu() {
    const rect = getSelectionRect()
    const selectionText = window.getSelection()?.toString() || ''
    if (!rect || !selectionText.trim()) { bubble.style.display = 'none'; return }
    bubble.style.display = 'block'
    bubble.style.transform = 'translateX(-50%)'
    const centerX = rect.left + window.scrollX + (rect.width / 2)
    const top = rect.top + window.scrollY - bubble.offsetHeight - 8
    bubble.style.left = `${Math.max(centerX, 8)}px`
    bubble.style.top = `${Math.max(top, 8)}px`
  }

  document.addEventListener('selectionchange', updateBubbleMenu)
  return bubble
}
