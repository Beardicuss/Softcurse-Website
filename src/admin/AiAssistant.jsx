import { useEffect, useState } from 'react'
import { adminApi } from './api'

const ACTIONS = [['improve', 'Improve writing'], ['summarize', 'Summarize'], ['seo', 'Generate SEO'], ['tags', 'Suggest tags'], ['translate_ka', 'Translate to Georgian'], ['translate_ru', 'Translate to Russian']]

export default function AiAssistant() {
  const [status, setStatus] = useState(null)
  const [action, setAction] = useState('improve')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => { let active = true; adminApi('/ai/generate').then(result => { if (active) setStatus(result) }).catch(error => { if (active) setMessage(error.message) }); return () => { active = false } }, [])
  async function generate(event) {
    event.preventDefault(); setBusy(true); setMessage(''); setOutput('')
    try { const result = await adminApi('/ai/generate', { method: 'POST', body: JSON.stringify({ action, input }) }); setOutput(result.output); setStatus(value => ({ ...value, usage: { ...result.usage, remaining: result.usage.limit - result.usage.used } })) } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  async function copy() { await navigator.clipboard.writeText(output); setMessage('Suggestion copied. Review it before applying.') }
  return <div><header className="admin-page-header"><div><p className="eyebrow">WORKERS AI</p><h1>AI assistant</h1><p className="admin-muted">Drafting help that never publishes or changes content automatically.</p></div><span className={`status-chip ${status?.configured ? 'published' : 'archived'}`}>{status?.configured ? 'READY' : 'UNAVAILABLE'}</span></header><div className="ai-safety-note"><strong>REVIEW REQUIRED</strong><span>AI can be inaccurate. Verify facts, translations, and SEO suggestions before using them.</span><small>{status ? `${status.usage.remaining} of ${status.usage.limit} free-safe requests remaining today` : 'Loading usage…'}</small></div><form className="admin-panel ai-workbench" onSubmit={generate}><label>Task<select value={action} onChange={event => setAction(event.target.value)}>{ACTIONS.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Source text<textarea required maxLength="8000" rows="12" placeholder="Paste content here…" value={input} onChange={event => setInput(event.target.value)} /></label><div className="ai-form-footer"><small>{input.length.toLocaleString()} / 8,000 characters</small><button className="admin-button primary" disabled={busy || !status?.configured}>{busy ? 'GENERATING…' : 'GENERATE SUGGESTION'}</button></div></form>{message && <p className="admin-message">{message}</p>}{output && <section className="admin-panel ai-output"><div className="panel-heading"><h2>Suggestion</h2><button className="admin-button compact" onClick={copy}>COPY</button></div><pre>{output}</pre></section>}</div>
}

