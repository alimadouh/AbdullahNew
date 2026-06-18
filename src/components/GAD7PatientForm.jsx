import { useState, useEffect } from 'react'

const i18n = {
  ar: {
    dir: 'rtl',
    title: 'مقياس اضطراب القلق العام - 7',
    subtitle: '(GAD-7)',
    instruction: 'خلال الأسبوعين الماضيين، كم مرة أقلقتك المشاكل التالية؟',
    questions: [
      'الشعور بالغضب أو القلق أو الانفعال الشديد.',
      'عدم القدرة على إنهاء القلق أو التحكم فيه.',
      'القلق المفرط على أشياء مختلفة.',
      'الصعوبة في الاسترخاء.',
      'شدة الاضطراب لدرجة صعوبة البقاء في هدوء.',
      'السرعة في الانزعاج أو الانفعال.',
      'الشعور بالخوف كما لو أن شيئًا فضيعًا قد يحدث.',
    ],
    scoreOptions: ['أبداً', 'بعض الأيام', 'أكثر من نصف الأيام', 'كل يوم تقريباً'],
    submit: 'إرسال',
    submitting: 'جاري الإرسال...',
    loading: 'جاري التحميل...',
    doneTitle: 'تم الإرسال بنجاح',
    doneMsg: 'شكراً لك. تم إرسال إجاباتك إلى الطبيب.',
    doneClose: 'يمكنك إغلاق هذه الصفحة الآن',
    retry: 'إعادة المحاولة',
    errorConnect: 'تعذر الاتصال. يرجى المحاولة مرة أخرى.',
    errorSubmit: 'فشل الإرسال. يرجى المحاولة مرة أخرى.',
  },
  en: {
    dir: 'ltr',
    title: 'Generalized Anxiety Disorder-7',
    subtitle: '(GAD-7)',
    instruction: 'Over the last 2 weeks, how often have you been bothered by the following problems?',
    questions: [
      'Feeling nervous, anxious, or on edge',
      'Not being able to stop or control worrying',
      'Worrying too much about different things',
      'Trouble relaxing',
      'Being so restless that it is hard to sit still',
      'Becoming easily annoyed or irritable',
      'Feeling afraid, as if something awful might happen',
    ],
    scoreOptions: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    submit: 'Submit',
    submitting: 'Submitting...',
    loading: 'Loading...',
    doneTitle: 'Submitted Successfully',
    doneMsg: 'Thank you. Your responses have been sent to the doctor.',
    doneClose: 'You can close this page now',
    retry: 'Try Again',
    errorConnect: 'Unable to connect. Please try again.',
    errorSubmit: 'Failed to submit. Please try again.',
  },
}

// Inject spin keyframe for the loading spinner
if (typeof document !== 'undefined' && !document.getElementById('gad7-spin')) {
  const style = document.createElement('style')
  style.id = 'gad7-spin'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(style)
}

export default function GAD7PatientForm({ sessionId, lang = 'ar' }) {
  const t = i18n[lang] || i18n.ar
  const [answers, setAnswers] = useState(Array(7).fill(null))
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/.netlify/functions/gad7', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'scan', sessionId }),
    })
      .then(() => setStatus('form'))
      .catch(() => { setError(t.errorConnect); setStatus('error') })
  }, [sessionId])

  const setAnswer = (idx, val) => {
    setAnswers(prev => { const a = [...prev]; a[idx] = val; return a })
  }

  const allAnswered = answers.every(a => a !== null)

  const handleSubmit = async () => {
    if (!allAnswered) return
    setStatus('submitting')
    try {
      await fetch('/.netlify/functions/gad7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', sessionId, response: { answers, lang } }),
      })
      setStatus('done')
    } catch {
      setError(t.errorSubmit)
      setStatus('error')
    }
  }

  if (status === 'loading') {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.spinner} />
          <p style={{ color: '#6b7280', textAlign: 'center' }}>{t.loading}</p>
        </div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center', padding: '3rem 1.5rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#10003;</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0d9488', marginBottom: '0.5rem' }}>{t.doneTitle}</h2>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>{t.doneMsg}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginTop: '1rem' }}>{t.doneClose}</p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <p style={{ color: '#ef4444', marginBottom: '1rem' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.retryBtn}>{t.retry}</button>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card} dir={t.dir}>
        <div style={styles.header}>
          <h1 style={styles.title}>{t.title}</h1>
          <h2 style={styles.subtitle}>{t.subtitle}</h2>
        </div>

        <p style={styles.instruction}>{t.instruction}</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {t.questions.map((q, i) => (
            <div key={i} style={styles.questionCard}>
              <p style={styles.questionText}>
                <span style={styles.questionNum}>{i + 1}.</span> {q}
              </p>
              <div style={styles.optionsGrid}>
                {t.scoreOptions.map((label, v) => {
                  const selected = answers[i] === v
                  return (
                    <button
                      key={v}
                      onClick={() => setAnswer(i, v)}
                      style={{
                        ...styles.optionBtn,
                        backgroundColor: selected ? '#0d9488' : '#f9fafb',
                        color: selected ? '#fff' : '#374151',
                        border: selected ? '2px solid #0d9488' : '2px solid #e5e7eb',
                        fontWeight: selected ? 700 : 400,
                      }}
                    >
                      <span style={{ fontSize: '0.75rem', lineHeight: 1.3, textAlign: 'center' }}>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={!allAnswered || status === 'submitting'}
          style={{
            ...styles.submitBtn,
            opacity: allAnswered ? 1 : 0.5,
            cursor: allAnswered ? 'pointer' : 'not-allowed',
          }}
        >
          {status === 'submitting' ? t.submitting : t.submit}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100dvh',
    backgroundColor: '#f0fdfa',
    padding: '1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#fff',
    borderRadius: '1rem',
    padding: '1.25rem',
    boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '2px solid #ccfbf1',
  },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#0d9488', margin: 0 },
  subtitle: { fontSize: '1rem', fontWeight: 600, color: '#6b7280', margin: '0.25rem 0 0' },
  instruction: {
    fontSize: '0.85rem', color: '#374151', backgroundColor: '#f0fdfa',
    padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', lineHeight: 1.6, fontWeight: 500,
  },
  questionCard: {
    backgroundColor: '#fafafa', borderRadius: '0.75rem', padding: '0.75rem', border: '1px solid #e5e7eb',
  },
  questionText: { fontSize: '0.85rem', lineHeight: 1.7, color: '#1f2937', margin: '0 0 0.5rem', fontWeight: 700 },
  questionNum: { fontWeight: 700, color: '#0d9488' },
  optionsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' },
  optionBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.15rem',
    padding: '0.5rem 0.25rem', borderRadius: '0.5rem', cursor: 'pointer',
    transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
  },
  submitBtn: {
    width: '100%', padding: '0.9rem', marginTop: '1.25rem', backgroundColor: '#0d9488',
    color: '#fff', border: 'none', borderRadius: '0.75rem', fontSize: '1.05rem',
    fontWeight: 700, cursor: 'pointer', WebkitTapHighlightColor: 'transparent',
  },
  spinner: {
    width: '2rem', height: '2rem', border: '3px solid #e5e7eb', borderTop: '3px solid #0d9488',
    borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '2rem auto',
  },
  retryBtn: {
    padding: '0.5rem 1.5rem', backgroundColor: '#0d9488', color: '#fff',
    border: 'none', borderRadius: '0.5rem', fontSize: '0.9rem', cursor: 'pointer',
  },
}
