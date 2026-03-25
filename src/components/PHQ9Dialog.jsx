import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog.jsx'
import { Brain, Loader2, RotateCcw, Copy, Check } from 'lucide-react'
import { Button } from './ui/button.jsx'

const QUESTIONS = {
  ar: [
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
  en: [
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
}

const SCORE_LABELS = {
  ar: ['ولا مرة', 'عدة أيام', 'أكثر من نصف الأيام', 'تقريباً كل يوم'],
  en: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
}

const DIFFICULTY_LABELS = {
  ar: ['ليست هناك أي صعوبة', 'هناك بعض الصعوبات', 'هناك صعوبات شديدة', 'هناك صعوبات بالغة التعقيد'],
  en: ['Not difficult at all', 'Somewhat difficult', 'Very difficult', 'Extremely difficult'],
}

const DIFFICULTY_QUESTION = {
  ar: 'إذا أشرت إلى أية من المشاكل أعلاه، فإلى أية درجة صعّبت عليك هذه المشاكل القيام بعملك، الاعتناء بالأمور المنزلية، أو الانسجام مع أشخاص آخرين؟',
  en: 'If you checked off any problems, how difficult have these problems made it for you to do your work, take care of things at home, or get along with other people?',
}

const PDF_LABELS = {
  ar: { title: 'استبيان عن صحة المرضى - 9 (PHQ-9)', date: 'التاريخ', question: 'السؤال', score: 'الدرجة', answer: 'الإجابة', print: 'طباعة / حفظ كـ PDF' },
  en: { title: 'Patient Health Questionnaire-9 (PHQ-9)', date: 'Date', question: 'Question', score: 'Score', answer: 'Answer', print: 'Print / Save as PDF' },
}

function getSeverity(score) {
  if (score <= 4) return { label: 'Non \u2013 Minimal', labelAr: 'لا يوجد \u2013 بسيط', color: '#22c55e', bg: '#f0fdf4', action: 'None' }
  if (score <= 9) return { label: 'Mild', labelAr: 'خفيف', color: '#eab308', bg: '#fefce8', action: 'Watchful waiting; repeat PHQ 9 at follow-up' }
  if (score <= 14) return { label: 'Moderate', labelAr: 'متوسط', color: '#f97316', bg: '#fff7ed', action: 'Review treatment plan if not improving in past 4 weeks; Consider discussion of additional support such as pharmacotherapy' }
  if (score <= 19) return { label: 'Moderately Severe', labelAr: 'متوسط الشدة', color: '#ef4444', bg: '#fef2f2', action: 'Consider adjusting treatment plan and/or frequency of sessions; Discuss additional supports such as pharmacotherapy; For SonderMind Anytime Messaging clients, consider converting from asynchronous to synchronous therapy channels' }
  return { label: 'Severe', labelAr: 'شديد', color: '#991b1b', bg: '#fef2f2', action: 'Adjust treatment plan; focused assessment of safety plan and pharmacotherapy evaluation/ re-evaluation; If emergent then refer to higher level of care; Likely Not a candidate for asynchronous/text therapy' }
}

export default function PHQ9Dialog({ open, onOpenChange, theme, lang = 'ar' }) {
  const [sessionId, setSessionId] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [status, setStatus] = useState('loading')
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [sessionUrl, setSessionUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const pollRef = useRef(null)

  const cleanup = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }, [])

  const createSession = useCallback(async () => {
    cleanup()
    setStatus('loading')
    setResponse(null)
    setError('')
    setSessionUrl('')
    setCopied(false)
    try {
      const res = await fetch('/.netlify/functions/phq9', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      })
      const data = await res.json()
      if (!data.sessionId) throw new Error('Failed to create session')
      setSessionId(data.sessionId)

      const url = `${window.location.origin}/phq9/${lang}/${data.sessionId}`
      setSessionUrl(url)
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: theme?.text || '#0d9488' } })
      setQrDataUrl(dataUrl)
      setStatus('qr')

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch('/.netlify/functions/phq9', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'poll', sessionId: data.sessionId }),
          })
          const pollData = await pollRes.json()
          if (pollData.status === 'scanned') {
            setStatus('waiting')
          } else if (pollData.status === 'submitted') {
            setResponse(pollData.response)
            setStatus('results')
            clearInterval(pollRef.current)
            pollRef.current = null
          } else if (pollData.status === 'expired') {
            setStatus('error')
            setError('Session expired')
            clearInterval(pollRef.current)
            pollRef.current = null
          }
        } catch { /* ignore poll errors */ }
      }, 2000)
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }, [theme, lang, cleanup])

  useEffect(() => {
    if (open) createSession()
    return cleanup
  }, [open])

  const openResultsPdf = useCallback((res) => {
    const pdfLang = res.lang || lang
    const isAr = pdfLang === 'ar'
    const dir = isAr ? 'rtl' : 'ltr'
    const textAlign = isAr ? 'right' : 'left'
    const borderSide = isAr ? 'border-right' : 'border-left'
    const questions = QUESTIONS[pdfLang] || QUESTIONS.ar
    const scoreLabels = SCORE_LABELS[pdfLang] || SCORE_LABELS.ar
    const diffLabels = DIFFICULTY_LABELS[pdfLang] || DIFFICULTY_LABELS.ar
    const diffQuestion = DIFFICULTY_QUESTION[pdfLang] || DIFFICULTY_QUESTION.ar
    const labels = PDF_LABELS[pdfLang] || PDF_LABELS.ar

    const total = res.answers.reduce((a, b) => a + b, 0)
    const sev = getSeverity(total)
    const date = new Date().toLocaleDateString('en-GB')
    const scoreColors = ['#10b981', '#f59e0b', '#f97316', '#ef4444']

    const questionsHtml = res.answers.map((score, i) => {
      const bg = i % 2 === 0 ? '#f8fafc' : '#ffffff'
      return `
        <tr style="background:${bg}">
          <td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:${textAlign};line-height:1.7;font-size:14px;font-weight:500;color:#1e293b">${i + 1}. ${questions[i]}</td>
          <td style="padding:12px 8px;border-bottom:1px solid #f1f5f9;text-align:center;width:50px;vertical-align:middle">
            <span class="score-num" style="display:inline-block;width:30px;height:30px;line-height:30px;border-radius:50%;background:${scoreColors[score]};color:#fff;font-weight:700;font-size:13px;text-align:center">${score}</span>
          </td>
          <td class="ans-col" style="border-bottom:1px solid #f1f5f9;text-align:${textAlign};color:#64748b;font-size:13px;vertical-align:middle">${scoreLabels[score]}</td>
        </tr>`
    }).join('')

    const difficultyHtml = res.difficulty != null
      ? `<div style="margin-top:20px;padding:18px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;text-align:${textAlign}">
           <div style="font-size:13px;line-height:1.8;color:#475569;margin-bottom:6px">${diffQuestion}</div>
           <div style="font-size:15px;font-weight:700;color:#1e293b">${diffLabels[res.difficulty]}</div>
         </div>`
      : ''

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${pdfLang}">
<head>
  <meta charset="UTF-8">
  <title>PHQ-9 Results</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display:none !important; } @page { margin: 15mm; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #f0fdfa; min-height: 100vh; padding: 16px; color: #1e293b; }
    .page { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; }
    .ans-col { padding: 12px 16px; width: 140px; }
    .print-btn { display: block; margin: 24px auto 0; padding: 12px 36px; background: #0d9488; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
    .print-btn:hover { background: #0f766e; }
    @media (max-width: 550px) {
      body { padding: 8px; }
      .page { padding: 16px; border-radius: 12px; }
      .ans-col { display: none; }
      .ans-head { display: none; }
      td, th { padding: 10px 10px !important; }
      .score-num { width: 26px !important; height: 26px !important; line-height: 26px !important; font-size: 12px !important; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #f1f5f9">
      <h1 style="font-size:20px;font-weight:700;color:#0d9488;margin-bottom:4px">${labels.title}</h1>
      <p style="font-size:13px;color:#94a3b8">${labels.date}: ${date}</p>
    </div>

    <div style="background:${sev.bg};border:2px solid ${sev.color};border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
      <div style="font-size:28px;font-weight:800;color:${sev.color}">${total}<span style="font-size:14px;font-weight:400;color:#94a3b8"> / 27</span></div>
      <div style="font-size:15px;font-weight:700;color:${sev.color}">${isAr ? sev.labelAr : sev.label} <span style="font-size:12px;font-weight:400;color:#64748b">${isAr ? sev.label : sev.labelAr}</span></div>
    </div>

    <div dir="ltr" style="margin-bottom:20px;padding:16px 20px;border-radius:12px;border-left:4px solid ${sev.color};background:#f8fafc;text-align:left">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">Proposed Treatment Action</div>
      <div style="font-size:14px;color:#334155;line-height:1.7">${sev.action}</div>
    </div>

    <table>
      <thead>
        <tr style="border-bottom:2px solid #e2e8f0">
          <th style="padding:10px 16px;text-align:${textAlign};font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px">${labels.question}</th>
          <th style="padding:10px 8px;text-align:center;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:50px">${labels.score}</th>
          <th class="ans-head" style="padding:10px 16px;text-align:${textAlign};font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:140px">${labels.answer}</th>
        </tr>
      </thead>
      <tbody>${questionsHtml}</tbody>
    </table>

    ${difficultyHtml}
    <button class="print-btn no-print" onclick="window.print()">${labels.print}</button>
  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) { win.document.write(html); win.document.close() }
  }, [lang])

  useEffect(() => {
    if (status === 'results' && response) {
      openResultsPdf(response)
      setTimeout(() => createSession(), 500)
    }
  }, [status, response])

  const handleClose = (v) => {
    if (!v) cleanup()
    onOpenChange(v)
  }

  const dialogTitle = lang === 'en' ? 'PHQ-9 — Patient Health Questionnaire' : 'PHQ-9 — استبيان عن صحة المرضى'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: theme?.text }}>
            <Brain className="h-5 w-5" />
            {dialogTitle}
          </DialogTitle>
        </DialogHeader>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-12">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: theme?.text }} />
            <p className="text-sm text-muted-foreground">Creating session...</p>
          </div>
        )}

        {(status === 'qr' || status === 'results') && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">Show this QR code to your patient to fill the PHQ-9 questionnaire</p>
            {qrDataUrl && <img src={qrDataUrl} alt="QR Code" className="rounded-lg shadow-md" />}
            {sessionUrl && (
              <div className="flex items-center gap-1.5 w-full max-w-xs">
                <div className="flex-1 truncate rounded-md bg-muted px-2.5 py-1.5 text-xs text-muted-foreground font-mono select-all">
                  {sessionUrl}
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(sessionUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="shrink-0 rounded-md p-1.5 hover:bg-muted transition-colors"
                  title="Copy link"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Waiting for patient to scan...</p>
            <Button onClick={createSession} variant="outline" size="sm" className="gap-1.5 mt-1">
              <RotateCcw className="h-3.5 w-3.5" />
              Refresh QR Code
            </Button>
          </div>
        )}

        {status === 'waiting' && (
          <div className="flex flex-col items-center gap-4 py-12">
            <Loader2 className="h-12 w-12 animate-spin" style={{ color: theme?.text }} />
            <p className="text-lg font-semibold" style={{ color: theme?.text }}>Waiting for responses...</p>
            <p className="text-sm text-muted-foreground text-center">The patient has opened the form.<br />Results will appear here automatically.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <p className="text-sm text-destructive">{error}</p>
            <Button onClick={createSession} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
