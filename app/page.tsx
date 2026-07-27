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
          <a href="/add" style={{ fontSize: 13, color: '#1F3350', fontStyle: 'italic' }}>+ Add a Post</a>
        </div>

        <div style={{ fontSize: 12.5, color: '#726C5F', fontStyle: 'italic', lineHeight: 1.5, paddingBottom: 16, borderBottom: '1px solid #DCD6C8', marginBottom: 20 }}>
          Not affiliated with, endorsed by, or connected to any analyst named here. Built solely for personal
          research use. Nothing here is investment advice. Prices are delayed/free-tier data and may be
          unavailable for smaller tickers.
          