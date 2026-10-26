import { useState } from 'react'

const STEPS = [
  ['Welcome to Softcurse Control', 'Everything on the website is organized into content modules. Changes remain drafts until you publish them.'],
  ['Find anything quickly', 'Press Ctrl or Cmd + K to search commands and live records across content, media, messages, and comments.'],
  ['Publish safely', 'Use preview states, review destructive confirmations, and check the audit trail in System & analytics.'],
  ['Security first', 'Keep two-factor authentication enabled, use separate administrator accounts, and review active sessions regularly.'],
]

export default function OnboardingTour({ onDone }) {
  const [step, setStep] = useState(0), current = STEPS[step]
  return <div className="onboarding-backdrop"><section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><span>SETUP {step + 1} / {STEPS.length}</span><h2 id="onboarding-title">{current[0]}</h2><p>{current[1]}</p><div className="onboarding-progress">{STEPS.map((_, index) => <i key={index} className={index <= step ? 'active' : ''} />)}</div><footer><button onClick={onDone}>SKIP TOUR</button>{step < STEPS.length - 1 ? <button className="primary" onClick={() => setStep(value => value + 1)}>NEXT</button> : <button className="primary" onClick={onDone}>START MANAGING</button>}</footer></section></div>
}
