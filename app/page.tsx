import { supabase } from '@/lib/supabaseClient'

export default async function Home() {
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, url, summary, posted_at, analysts(display_name), post_tickers(symbol, stance)')
    .order('posted_at', { ascending: false })

  if (error) {
    return <div style={{ padding: 40 }}>Error loading posts: {error.message}</div>
  }

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 40, fontFamily: 'serif' }}>
      <h1>Analyst Desk</h1>
      {posts?.map((post: any) => (
        <div key={post.id} style={{ borderBottom: '1px solid #ddd', padding: '16px 0' }}>
          <div style={{ fontSize: 13, color: '#666' }}>
            {post.analysts?.display_name} · {new Date(post.posted_at).toLocaleString()}
          </div>
          <p>{post.summary}</p>
          <div>
            {post.post_tickers?.map((tk: any, i: number) => (
              <span key={i} style={{ marginRight: 10, fontWeight: 600 }}>
                {tk.symbol} · {tk.stance}
              </span>
            ))}
          </div>
          <a href={post.url} target="_blank">source ↗</a>
        </div>
      ))}
    </main>
  )
}
