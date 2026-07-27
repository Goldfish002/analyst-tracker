'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function Home() {
  const [posts, setPosts] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({})

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

  useEffect(() => {
    const symbols = new Set<string>()
    posts.forEach(p => p.post_tickers?.forEach((tk: any) => symbols.add(tk.symbol)))

    symbols.forEach(async (sym) => {
      if (prices[sym]) return
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${process.env.NEXT_PUBLIC_FINNHUB_KEY}`)
        const data = await res.json()
        setPrices(prev => ({ ...prev, [sym]: { price: data.c || 0, change: data.dp || 0 } }))
      } catch (e) {
        setPrices(prev => ({ ...prev, [sym]: { price: 0, change: 0 } }))
      }
    })
  }, [posts])

  const stanceColor: any = { bullish: '#2F6B4F', bearish: '#A6432B', neutral: '#8A7429' }

  if (error) return <div style={{ padding: 40 }}>Error loading posts: {error}</div>

  return (
    <div style={{ background: '#F7F5F0', minHeight: '100vh' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #A9873F, #C9AE6F, #A9873F)' }} />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '30px 24px 70px', fontFamily: 'Georgia, serif', color: '#1A1A1D' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #DCD6C8', paddingBottom: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, color: '#1F3350', margin: 0 }}>Analyst Desk</h1>
          <div style={{ display: 'flex', gap: 16 }}>
            <a href="/track" style={{ fontSize: 13, color: '#1F3350', fontStyle: 'italic' }}>Track Record</a>
            <a href="/add" style={{ fontSize: 13, color: '#1F3350', fontStyle: 'italic' }}>+ Add a Post</a>
          </div>
        </div>

        <div style={{ fontSize: 12.5, color: '#726C5F', fontStyle: 'italic', lineHeight: 1.5, paddingBottom: 16, borderBottom: '1px solid #DCD6C8', marginBottom: 20 }}>
          Not affiliated with, endorsed by, or connected to any analyst named here. Built solely for personal research use. Nothing here is investment advice. Prices are delayed/free-tier data and may be unavailable for smaller tickers. Stance tags reflect the site owner's own reading of each post — always check the source link before relying on it.
        </div>

        {posts.length === 0 && <p style={{ color: '#726C5F' }}>No posts yet — add your first one.</p>}

        {posts.map((post: any) => (
          <div key={post.id} style={{ padding: '16px 0', borderBottom: '1px solid #DCD6C8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>{post.analysts?.display_name}</span>
              <span style={{ fontSize: 11, color: '#726C5F', fontFamily: 'monospace' }}>
                {new Date(post.posted_at).toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: '0 0 10px' }}>{post.summary}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                {post.post_tickers?.map((tk: any, i: number) => {
                  const q = prices[tk.symbol]
                  return (
                    <span key={i} style={{ whiteSpace: 'nowrap', fontWeight: 700, fontStyle: 'italic', color: stanceColor[tk.stance] || '#1A1A1D', borderBottom: `1px solid ${stanceColor[tk.stance] || '#1A1A1D'}` }}>
                      {tk.symbol} · {tk.stance}
                      {q && q.price > 0 && (
                        <span style={{ fontFamily: 'monospace', fontStyle: 'normal', marginLeft: 6, fontSize: 12 }}>
                          ${q.price.toFixed(2)} ({q.change >= 0 ? '+' : ''}{q.change.toFixed(2)}%)
                        </span>
                      )}
                      {q && q.price === 0 && (
                        <span style={{ fontFamily: 'monospace', fontStyle: 'italic', marginLeft: 6, fontSize: 11, color: '#726C5F' }}>
                          price unavailable
                        </span>
                      )}
                    </span>
                  )
                })}
              </div>
              <a href={post.url} target="_blank" style={{ fontSize: 11, fontFamily: 'monospace', color: '#1F3350', whiteSpace: 'nowrap' }}>source ↗</a>
            </div>
          </div>
        ))}
      </main>
    </div>
  )
}
