import { createPost } from '../lib/db'

async function main() {
  const body = String.fromCharCode(33) + '[x](/uploads/1777872868352-yjf0z5-33974109_m.jpg)'
  const res = await createPost({ title: 'cover test', body_markdown: body })
  console.log('inserted', res)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
