'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function TrackRecord() {
  const [rows, setRows] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [prices, setPrices] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('post_tickers')
        .select('symbol, stance, price_at_call, posts(id, url, posted_at, analysts(display_name))')
        .not('price_at_call', 'is', null)
        .order('post_id', { ascending: false })

      if (error) { setError(error.message); return }
      setRows(data || [])

      const symbols = new Set<string>((data || []).map((r: any) => r.symbol))
      symbols.forEach(async (sym) => {
        try {
          const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${sym}&token=${process.env.NEXT_PUBLIC_FINNHUB_KEY}`)
          const d = await res.json()
          setPrices(prev => ({ ...prev, [sym]: d.c || 0 }))
        } catch (e) {}
      })
    }
    load()
  }, [])

  if (error) return <div style={{ padding: 40 }}>Error: {error}</div>

  return (
    <div style={{ background: '#F7F5F0', minHeight: '100vh' }}>
      <div style={{ height: 3, background: 'linear-gradient(90deg, #A9873F, #C9AE6F, #A9873F)' }} />
      <main style={{ maxWidth: 820, margin: '0 auto', padding: '30px 24px 70px', fontFamily: 'Georgia, serif', color: '#1A1A1D' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid #DCD6C8', paddingBottom: 16, marginBottom: 20 }}>
          <h1 style={{ fontSize: 24, color: '#1F3350', margin: 0 }}>Track Record</h1>
          <a href="/" style={{ fontSize: 13, color: '#1F3350', fontStyle: 'italic' }}>← Analyst Desk</a>
        </div>

        <div style={{ fontSize: 12.5, color: '#726C5F', fontStyle: 'italic', lineHeight: 1.5, marginBottom: 22 }}>
          Only posts added after price-tracking was turned on are shown here. Verdict rule: correct if price moved
          2%+ in the called direction, incorrect if 2%+ against it, otherwise pending. Always check the source
          before trusting a tag.
        </div>

        {rows.length === 0 && <p style={{ color: '#726C5F' }}>No tracked calls yet — add a new post to start building this.</p>}

        {rows.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5, minWidth: 650 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #DCD6C8', textAlign: 'left' }}>
                  <th style={{ padding: '6px 10px 8px 0', fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Analyst</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Ticker</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Call</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Price at Call</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Price Now</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Change</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Verdict</th>
                  <th style={{ fontStyle: 'italic', color: '#726C5F', fontWeight: 400 }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r: any, i: number) => {
                  const now = prices[r.symbol]
                  const chg = now ? ((now - r.price_at_call) / r.price_at_call) * 100 : null
                  let verdict = 'Pending', color = '#8A7429'
                  if (chg !== null) {
                    if ((r.stance === 'bullish' && chg >= 2) || (r.stance === 'bearish' && chg <= -2)) { verdict = 'Correct'; color = '#2F6B4F' }
                    else if ((r.stance === 'bullish' && chg <= -2) || (r.stance === 'bearish' && chg >= 2)) { verdict = 'Incorrect'; color = '#A6432B' }
                    else if (r.stance === 'neutral' && Math.abs(chg) < 2) { verdict = 'Correct'; color = '#2F6B4F' }
                  }
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #DCD6C8' }}>
                      <td style={{ padding: '10px 10px 10px 0' }}>{r.posts?.analysts?.display_name}</td>
                      <td style={{ fontFamily: 'monospace' }}>{r.symbol}</td>
                      <td style={{ fontStyle: 'italic', color: r.stance === 'bullish' ? '#2F6B4F' : r.stance === 'bearish' ? '#A6432B' : '#8A7429' }}>{r.stance}</td>
                      <td style={{ fontFamily: 'monospace' }}>${r.price_at_call?.toFixed(2)}</td>
                      <td style={{ fontFamily: 'monospace' }}>{now ? '$' + now.toFixed(2) : '—'}</td>
                      <td style={{ fontFamily: 'monospace', color: chg !== null ? (chg >= 0 ? '#2F6B4F' : '#A6432B') : '#726C5F' }}>
                        {chg !== null ? `${chg >= 0 ? '+' : ''}${chg.toFixed(2)}%` : '—'}
                      </td>
                      <td style={{ color, fontStyle: 'italic' }}>{verdict}</td>
                      <td><a href={r.posts?.url} target="_blank" style={{ fontSize: 11, fontFamily: 'monospace', color: '#1F3350' }}>source ↗</a></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}
