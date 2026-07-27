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

const inputStyle = {
  width: '100%', padding: '10px 12px', fontFamily: 'Georgia, serif', fontSize: 14,
  border: '1px solid #DCD6C8', borderRadius: 4, background: '#FFFFFF', color: '#1A1A1D'
}
const labelStyle = { display: 'block', marginBottom: 16, fontSize: 13, color: '#726C5F', fontStyle: 'italic' as const }

export default function AddPost() {
  const [unlocked, setUnlocked] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const [analystId, setAnalystId] = useState('serenity')
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [customDate, setCustomDate] = useState('')
  const [tickers, setTickers] = useState<TickerRow[]>([{ symbol: '', stance: 'neutral' }])
  const [status, setStatus] = useState('')

  function checkPassword(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === process.env.NEXT_PUBLIC_ADD_PASSWORD) {
      setUnlocked(true)
      setPasswordError('')
    } else {
      setPasswordError('Incorrect password.')
    }
  }

  function updateTicker(i: number, field: 'symbol' | 'stance', value: string) {
    const next = [...tickers]
    next[i] = { ...next[i], [field]: value }
    setTickers(next)
  }
  function addTickerRow() { setTickers([...tickers, { symbol: '', stance: 'neutral' }]) }
  function removeTickerRow(i: number) { setTickers(tickers.filter((_, idx) => idx !== i)) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('Saving...')
    const postId = 'post-' + Date.now()
    const postedAt = customDate ? new Date(customDate).toISOString() : new Date().toISOString()

    const { error: postError } = await supabase
      .from('posts')
      .insert({ id: postId, analyst_id: analystId, url, summary, posted_at: postedAt })

    if (postError) { setStatus('Error: ' + postError.message); return }

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

      if (tickerError) { setStatus('Error on ' + t.symbol + ': ' + tickerError.message); return }
    }

    setStatus('Saved!')
    setUrl(''); setSummary(''); setCustomDate(''); setTickers([{ symbol: '', stance: 'neutral' }])
  }

  if (!unlocked) {
    return (
      <div style={{ background: '#F7F5F0', minHeight: '100vh' }}>
        <div style={{ height: 3, background: 'linear-gradient(90deg, #A9873F, #C9AE6F, #A9873F)' }} />
        <main style={{ maxWidth: 400, margin: '0 auto', padding: '30px 24px 70px', fontFamily: 'Georgia, serif', color: '#1A1A1D' }}>
          <h1 style={{ fontSize: 24, color: '#1F3350', marginBottom: 20 }}>Add a Post</h1>
          <form onSubmit={checkPassword}>
            <label style={labelStyle}>
              Password
              <input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
            </label>
            <button type="submit" style={{ padding: '10px 20px', background: '#1F3350', color: '#F7F5F0', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: 'Georgia, serif' }}>
              Unlock
            </button>
            {passwordError && <p style={{ color: '#A6432B', fontStyle: 'italic', marginTop: 12 }}>{passwordError}</p>}
          </form>
        </main>
      </div>
    )
  }

  return (
    <div style={{ background: '#F7F5F0', minHeight: '100vh' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #A9873F, #C9AE6F, #A9873F)' }} />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '30px 24px 70px', fontFamily: 'Georgia, serif', color: '#1A1A1D' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #DCD6C8', paddingBottom: 16, marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, color: '#1F3350', margin: 0 }}>Add a Post</h1>
          <a href="/" style={{ fontSize: 13, color: '#1F3350', fontStyle: 'italic' }}>← Analyst Desk</a>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={labelStyle}>
            Analyst
            <select value={analystId} onChange={e => setAnalystId(e.target.value)} style={{ ...inputStyle, marginTop: 6 }}>
              {analysts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </label>

          <label style={labelStyle}>
            Post URL
            <input value={url} onChange={e => setUrl(e.target.value)} required style={{ ...inputStyle, marginTop: 6 }} />
          </label>

          <label style={labelStyle}>
            Your Summary
            <textarea value={summary} onChange={e => setSummary(e.target.value)} required rows={4} style={{ ...inputStyle, marginTop: 6, fontFamily: 'Georgia, serif' }} />
          </label>

          <label style={labelStyle}>
            Date / Time — leave blank to use right now
            <input type="datetime-local" value={customDate} onChange={e => setCustomDate(e.target.value)} style={{ ...inputStyle, marginTop: 6 }} />
          </label>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, color: '#726C5F', fontStyle: 'italic', marginBottom: 10 }}>Tickers</div>
            {tickers.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={t.symbol} onChange={e => updateTicker(i, 'symbol', e.target.value)} placeholder="e.g. GOOGL" style={{ ...inputStyle, flex: 1 }} />
                <select value={t.stance} onChange={e => updateTicker(i, 'stance', e.target.value)} style={{ ...inputStyle, width: 130 }}>
                  <option value="bullish">Bullish</option>
                  <option value="bearish">Bearish</option>
                  <option value="neutral">Neutral</option>
                </select>
                {tickers.length > 1 && (
                  <button type="button" onClick={() => removeTickerRow(i)} style={{ padding: '0 12px', border: '1px solid #DCD6C8', background: '#FFFFFF', borderRadius: 4, cursor: 'pointer', color: '#A6432B' }}>✕</button>
                )}
              </div>
            ))}
            <button type="button" onClick={addTickerRow} style={{ padding: '8px 14px', border: '1px solid #1F3350', background: 'transparent', color: '#1F3350', borderRadius: 4, cursor: 'pointer', fontStyle: 'italic', fontSize: 13 }}>
              + Add another ticker
            </button>
          </div>

          <button type="submit" style={{ padding: '12px 24px', background: '#1F3350', color: '#F7F5F0', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14, fontFamily: 'Georgia, serif' }}>
            Save Post
          </button>
          {status && <p style={{ marginTop: 14, fontStyle: 'italic', color: status.startsWith('Error') ? '#A6432B' : '#2F6B4F' }}>{status}</p>}
        </form>
      </main>
    </div>
  )
}
