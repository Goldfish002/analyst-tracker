'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('posts')
      .select('id, url, summary, posted_at, analysts(display_name), post_tickers(symbol, stance)')
      .order('posted_at', { ascending: false })

    if (error) setError(error.message)
    else setPosts(data || [])
  }

  useEffect(() => {
    fetchPosts()

    const channel = supabase
      .channel('live-posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_tickers' }, () => fetchPosts())
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  if (error) return <div style={{ padding: 40 }}>Error loading posts: {error}</div>

  return (
    <main style={{ maxWidth: 700, margin: '0 auto', padding: 40, fontFamily: 'serif' }}>
      <h1>Analyst Desk</h1>
      <a href="/add" style={{ display: 'inline-block', marginBottom: 20 }}>+ Add a Post</a>
      {posts.map((post: any) => (
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
