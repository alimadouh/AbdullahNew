import { useState, useEffect } from 'react'

const i18n = {
  ar: {
    dir: 'rtl',
    title: 'استبيان عن صحة المرضى - 9',
    subtitle: '(PHQ-9)',
    instruction: 'خلال الأسبوعين الماضيين، كم مرة عانيت من أي من المشاكل التالية؟',
    questions: [
      'قلة الاهتمام أو قلة الاستمتاع بممارسة بالقيام بأي عمل',
      'الشعور بالحزن أو ضيق الصدر أو اليأس',
      'صعوبة في النوم أو نوم متقطع أو النوم أكثر من المعتاد',
      'الشعور بالتعب أو بامتلاك القليل جداً من الطاقة',
      'قلة الشهية أو الزيادة في تناول الطعام عن المعتاد',
      'الشعور بعدم الرضا عن النفس أو الشعور بأنك قد أخذلت نفسك أو عائلتك',
      'صعوبة في التركيز مثلاً أثناء قراءة الصحيفة أو مشاهدة التلفزيون',
      'بطء في الحركة أو بطء في التحدث عما هو معتاد لدرجة ملحوظة من الآخرين / أو على العكس من ذلك التحدث بسرعة وكثرة الحركة أكثر من المعتاد',
      'راودتك أفكار بأنه من الأفضل لو كنت ميتاً أو أفكار بأن تقوم بإيذاء النفس',
    ],
    scoreOptions: ['ولا مرة', 'عدة أيام', 'أكثر من نصف الأيام', 'تقريباً كل يوم'],
    difficultyQuestion: 'إذا أشرت إلى أية من المشاكل أعلاه، فإلى أية درجة صعّبت عليك هذه المشاكل القيام بعملك، الاعتناء بالأمور المنزلية، أو الانسجام مع أشخاص آخرين؟',
    difficultyOptions: ['ليست هناك أي صعوبة', 'هناك بعض الصعوبات', 'هناك صعوبات شديدة', 'هناك صعوبات بالغة التعقيد'],
    total: 'المجموع',
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
    title: 'Patient Health Questionnaire-9',
    subtitle: '(PHQ-9)',
    instruction: 'Over the last 2 weeks, how often have you been bothered by any of the following problems?',
    questions: [
      'Little interest or pleasure in doing things',
      'Feeling down, depressed, or hopeless',
      'Trouble falling or staying asleep, or sleeping too much',
      'Feeling tired or having little energy',
      'Poor appetite or overeating',
      'Feeling bad about yourself — or that you are a failure or have let yourself or your family down',
      'Trouble concentrating on things, such as reading the newspaper or watching television',
      'Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual',
      'Thoughts that you would be better off dead or of hurting yourself in some way',
    ],
    scoreOptions: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
    difficultyQuestion: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
    difficultyOptions: ['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'],
    total: 'Total',
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
if (typeof document !== 'undefined' && !document.getElementById('phq9-spin')) {
  const style = document.createElement('style')
  style.id = 'phq9-spin'
  style.textContent = '@keyframes spin { to { transform: rotate(360deg) } }'
  document.head.appendChild(style)
}

export default function PHQ9PatientForm({ sessionId, lang = 'ar' }) {
  const t = i18n[lang] || i18n.ar
  const [answers, setAnswers] = useState(Array(9).fill(null))
  const [difficulty, setDifficulty] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/.netlify/functions/phq9', {
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
      await fetch('/.netlify/functions/phq9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit', sessionId, response: { answers, difficulty, lang } }),
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

  const totalScore = allAnswered ? answers.reduce((a, b) => a + b, 0) : null
  const borderSide = t.dir === 'rtl' ? 'borderRight' : 'borderLeft'

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

        {/* Score hidden from patient */}

        <div style={{ ...styles.questionCard, marginTop: '1rem', [borderSide]: '4px solid #0d9488' }}>
          <p style={{ ...styles.questionText, fontWeight: 700 }}>{t.difficultyQuestion}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
            {t.difficultyOptions.map((opt, i) => {
              const selected = difficulty === i
              return (
                <button
                  key={i}
                  onClick={() => setDifficulty(i)}
                  style={{
                    ...styles.difficultyBtn,
                    backgroundColor: selected ? '#0d9488' : '#fff',
                    color: selected ? '#fff' : '#374151',
                    border: selected ? '2px solid #0d9488' : '2px solid #e5e7eb',
                    textAlign: t.dir === 'rtl' ? 'right' : 'left',
                  }}
                >
                  {opt}
                </button>
              )
            })}
          </div>
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
  scoreBar: {
    textAlign: 'center', padding: '0.75rem', backgroundColor: '#f0fdfa',
    borderRadius: '0.5rem', color: '#0d9488', fontSize: '1rem', marginTop: '1rem',
  },
  difficultyBtn: {
    padding: '0.65rem 1rem', borderRadius: '0.5rem', fontSize: '0.85rem',
    cursor: 'pointer', transition: 'all 0.15s', WebkitTapHighlightColor: 'transparent',
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
