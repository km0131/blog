import { listPosts, getPost } from '../lib/db'

async function main() {
  try {
    const posts = await listPosts()
    console.log('Posts count:', posts.length)
    posts.forEach((p, i) => {
      console.log(`\nPost ${i}:`, JSON.stringify(p))
    })

    // Try getting post 1 directly
    if (posts.length > 0) {
      console.log('\n--- Fetching post ID=1 ---')
      const post1 = await getPost(1)
      console.log('getPost(1):', JSON.stringify(post1))
    }

    // Try post 2 if exists
    console.log('\n--- Fetching post ID=2 ---')
    const post2 = await getPost(2)
    console.log('getPost(2):', JSON.stringify(post2))
  } catch (err) {
    console.error('Error:', String(err))
  }
}

main()
