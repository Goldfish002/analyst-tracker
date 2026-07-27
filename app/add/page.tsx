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

type TickerRow = { symbol: string; stance: string }

export default function AddPost() {
  const [analystId, setAnalystId] = useState('serenity')
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [tickers, setTickers] = useState<TickerRow[]>([{ symbol: '', stance: 'neutral' }])
  const [status, setStatus] = useState('')

  function updateTicker(i: number, field: 'symbol' | 'stance', value: string) {
    const next = [...tickers]
    next[i] = { ...next[i], [field]: value }
    setTickers(next)
  }

  function addTickerRow() {
    setTickers([...tickers, { symbol: '', stance: 'neutral' }])
  }

  function removeTickerRow(i: number) {
    setTickers(tickers.filter((_, idx) => idx !== i))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Saving...')

    const postId = 'post-' + Date.now()
    const postedAt = customDate ? new Date(customDate).toISOString() : new Date().toISOString()

    const { error: postError } = await supabase
      .from('posts')
      .insert({ id: postId, analyst_id: analystId, url, summary, posted_at: postedAt })

    if (postError) {
      setStatus('Error: ' + postError.message)
      return
    }

    for (const t of tickers) {
      if (!t.symbol.trim()) continue
      let priceAtCall = null
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${t.symbol.toUpperCase()}&token=${process.env.NEXT_PUBLIC_FINNHUB_KEY}`)
        const data = await res.json()
        if (data.c && data.c > 0) priceAtCall = data.c
      } catch (e) {}

      const { error: tickerError } = await supabase
        .from('post_tickers')
        .insert({ post_id: postId, symbol: t.symbol.toUpperCase(), stance: t.stance, price_at_call: priceAtCall })

      if (tickerError) {
        setStatus('Error on ' + t.symbol + ': ' + tickerError.message)
        return
      }
    }

    setStatus('Saved!')
    setUrl(''); setSummary(''); setCustomDate(''); setTickers([{ symbol: '', stance: 'neutral' }])
  }

  return (
    <main style={{ maxWidth: 500, margin: '0 auto', padding: 40, fontFamily: 'serif' }}>
      <h1>Add a Post</h1>
      <a href="/" style={{ display: 'inline-block', marginBottom: 20 }}>← Back to Analyst Desk</a>
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
        <label>Date/Time (optional — leave blank to use right now)
          <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)} style={{ width: '100%', padding: 8 }} />
        </label>

        <div>
          <div style={{ marginBottom: 6, fontWeight: 600 }}>Tickers</div>
          {tickers.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input
                value={t.symbol}
                onChange={e => updateTicker(i, 'symbol', e.target.value)}
                placeholder="e.g. GOOGL"
                style={{ flex: 1, padding: 8 }}
              />
              <select value={t.stance} onChange={e => updateTicker(i, 'stance', e.target.value)} style={{ padding: 8 }}>
                <option value="bullish">Bullish</option>
                <option value="bearish">Bearish</option>
                <option value="neutral">Neutral</option>
              </select>
              {tickers.length > 1 && (
                <button type="button" onClick={() => removeTickerRow(i)} style={{ padding: '0 10px' }}>✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={addTickerRow} style={{ padding: '6px 10px', cursor: 'pointer' }}>
            + Add another ticker
          </button>
        </div>

        <button type="submit" style={{ padding: 10, cursor: 'pointer', marginTop: 8 }}>Save Post</button>
        {status && <p>{status}</p>}
      </form>
    </main>
  )
}
