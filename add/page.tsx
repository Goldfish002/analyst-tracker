'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

const analysts = [
  { id: 'serenity', name: 'Serenity' },
  { id: 'ritholtz', name: 'Barry Ritholtz' },
  { id: 'sonders', name: 'Liz Ann Sonders' },
  { id: 'bilello', name: 'Charlie Bilello' },
  { id: 'elliott', name: 'Bob Elliott' },
]

export default function AddPost() {
  const [analystId, setAnalystId] = useState('serenity')
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [symbol, setSymbol] = useState('')
  const [stance, setStance] = useState('neutral')
  const [status, setStatus] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Saving...')

    const postId = 'post-' + Date.now()

    const { error: postError } = await supabase
      .from('posts')
      .insert({ id: postId, analyst_id: analystId, url, summary })

    if (postError) {
      setStatus('Error: ' + postError.message)
      return
    }

    const { error: tickerError } = await supabase
      .from('post_tickers')
      .insert({ post_id: postId, symbol: symbol.toUpperCase(), stance })

    if (tickerError) {
      setStatus('Error: ' + tickerError.message)
      return
    }

    setStatus('Saved!')
    setUrl(''); setSummary(''); setSymbol('')
  }

  return (
    <main style={{ maxWidth: 500, margin: '0 auto', padding: 40, fontFamily: 'serif' }}>
      <h1>Add a Post</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>Analyst
          <select value={analystId} onChange={e => setAnalystId(e.target.value)} style={{ width: '100%', padding: 8 }}>
            {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <label>Post URL
          <input value={url} onChange={e => setUrl(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </label>
        <label>Your Summary
          <textarea value={summary} onChange={e => setSummary(e.target.value)} required style={{ width: '100%', padding: 8 }} />
        </label>
        <label>Ticker Symbol
          <input value={symbol} onChange={e => setSymbol(e.target.value)} required placeholder="e.g. NVDA" style={{ width: '100%', padding: 8 }} />
        </label>
        <label>Stance
          <select value={stance} onChange={e => setStance(e.target.value)} style={{ width: '100%', padding: 8 }}>
            <option value="bullish">Bullish</option>
            <option value="bearish">Bearish</option>
            <option value="neutral">Neutral</option>
          </select>
        </label>
        <button type="submit" style={{ padding: 10, cursor: 'pointer' }}>Save Post</button>
        {status && <p>{status}</p>}
      </form>
    </main>
  )
}
