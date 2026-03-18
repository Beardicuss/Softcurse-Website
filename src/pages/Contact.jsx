import { useState } from 'react'
import Button from '../components/common/Button'
import { usePageTitle } from '../hooks/usePageTitle'
import styles from './Contact.module.css'

function Field({ name, label, type = 'text', textarea, value, onChange, error }) {
  return (
    <div className={styles.field}>
      <label className={styles.label} htmlFor={name}>{label}</label>
      {textarea
        ? <textarea
            id={name}
            className={`${styles.input} ${styles.textarea} ${error ? styles.inputError : ''}`}
            value={value}
            onChange={onChange}
            placeholder={`Enter your ${label.toLowerCase()}...`}
            rows={5}
          />
        : <input
            id={name}
            type={type}
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            value={value}
            onChange={onChange}
            placeholder={`Your ${label.toLowerCase()}...`}
          />
      }
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}

export default function Contact() {
  usePageTitle('Contact')
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '', _trap: '' })
  const [sent, setSent]     = useState(false)
  const [errors, setErrors] = useState({})

  const update = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    // Clear that field's error as soon as user starts correcting it
    if (errors[field]) setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  const validate = () => {
    if (form._trap) return null  // Bot filled the honeypot — silently ignore
    const e = {}
    if (!form.name.trim())    e.name    = 'Required'
    if (!form.email.trim())   e.email   = 'Required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email'
    if (!form.message.trim()) e.message = 'Required'
    return e
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = validate()
    if (errs === null) { setSent(true); return }  // Honeypot triggered — fake success
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSent(true)
  }

  return (
    <div>
      <div className="page-header grid-bg">
        <div className="scanline" />
        <div className="page-header__eyebrow">// REACH OUT</div>
        <h1 className="page-header__title">CONTACT</h1>
        <p className="page-header__desc">
          Got a project, a question, or just want to say something dark and cryptic?
          We're listening.
        </p>
      </div>
      <div className="container section">
        <div className={styles.grid}>
          <div>
            <div className={styles.colHead}>Send a Message</div>
            {sent ? (
              <div className={styles.sent}>
                <span className={styles.sentIcon}>✓</span>
                <strong>MESSAGE TRANSMITTED.</strong>
                <p>We'll be in touch from the dark.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <Field name="name"    label="Name"    value={form.name}    onChange={update('name')}    error={errors.name} />
                <Field name="email"   label="Email"   type="email" value={form.email}   onChange={update('email')}   error={errors.email} />
                <Field name="subject" label="Subject" value={form.subject} onChange={update('subject')} error={errors.subject} />
                <Field name="message" label="Message" textarea value={form.message} onChange={update('message')} error={errors.message} />
                {/* Honeypot — hidden from real users, bots fill it */}
                <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}>
                  <label htmlFor="_trap">Leave this empty</label>
                  <input
                    id="_trap"
                    name="_trap"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={form._trap}
                    onChange={update('_trap')}
                  />
                </div>
                <Button variant="cyan" type="submit">TRANSMIT →</Button>
              </form>
            )}
          </div>
          <div>
            <div className={styles.colHead}>Connect</div>
            <div className={styles.connectList}>
              {[
                ['EMAIL',       'contact@softcurse.com'],
                ['GITHUB',      'github.com/softcurse'],
                ['TWITTER / X', '@softcurse'],
                ['DISCORD',     'discord.gg/softcurse'],
              ].map(([label, value]) => (
                <div key={label} className={styles.connectItem}>
                  <div className={styles.connectLabel}>{label}</div>
                  <div className={styles.connectValue}>{value}</div>
                </div>
              ))}
            </div>
            <div className={styles.collab}>
              <div className={styles.collabTitle}>Careers & Collaboration</div>
              <p className={styles.collabBody}>
                We're always open to exceptional people and interesting collaborations.
                No formal postings — just reach out with what you do and what you'd build with us.
              </p>
              <Button variant="outlineMagenta">REACH OUT</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
