import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'qrcode'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog.jsx'
import { Brain, Loader2, RotateCcw, Copy, Check, ClipboardCheck } from 'lucide-react'
import { Button } from './ui/button.jsx'

const QUESTIONS = {
  ar: [
    'الشعور بالغضب أو القلق أو الانفعال الشديد.',
    'عدم القدرة على إنهاء القلق أو التحكم فيه.',
    'القلق المفرط على أشياء مختلفة.',
    'الصعوبة في الاسترخاء.',
    'شدة الاضطراب لدرجة صعوبة البقاء في هدوء.',
    'السرعة في الانزعاج أو الانفعال.',
    'الشعور بالخوف كما لو أن شيئًا فضيعًا قد يحدث.',
  ],
  en: [
    'Feeling nervous, anxious, or on edge',
    'Not being able to stop or control worrying',
    'Worrying too much about different things',
    'Trouble relaxing',
    'Being so restless that it is hard to sit still',
    'Becoming easily annoyed or irritable',
    'Feeling afraid, as if something awful might happen',
  ],
}

const SCORE_LABELS = {
  ar: ['أبداً', 'بعض الأيام', 'أكثر من نصف الأيام', 'كل يوم تقريباً'],
  en: ['Not at all', 'Several days', 'More than half the days', 'Nearly every day'],
}

const PDF_LABELS = {
  ar: { title: 'مقياس اضطراب القلق العام (GAD-7)', date: 'التاريخ', question: 'السؤال', score: 'الدرجة', answer: 'الإجابة', intervention: 'التدخل العلاجي', print: 'حفظ كـ PDF', back: 'رجوع', share: 'مشاركة' },
  en: { title: 'Generalized Anxiety Disorder-7 (GAD-7)', date: 'Date', question: 'Question', score: 'Score', answer: 'Answer', intervention: 'Intervention', print: 'Save as PDF', back: 'Back', share: 'Share' },
}

function getSeverity(score) {
  if (score <= 4) return {
    label: 'No to Low Risk', labelAr: 'لا يوجد إلى منخفض الخطورة', color: '#22c55e', bg: '#f0fdf4',
    action: 'None',
    actionAr: 'لا يوجد.',
  }
  if (score <= 9) return {
    label: 'Mild', labelAr: 'خفيف', color: '#eab308', bg: '#fefce8',
    action: 'Provide general feedback, repeat GAD-7 at follow up, consider adjusting treatment plan if not improving in last 4 weeks',
    actionAr: 'تقديم ملاحظات عامة، وإعادة تطبيق مقياس GAD-7 في زيارة المتابعة، والنظر في تعديل خطة العلاج إذا لم يطرأ تحسّن خلال الأسابيع الأربعة الماضية.',
  }
  if (score <= 14) return {
    label: 'Moderate', labelAr: 'متوسط', color: '#f97316', bg: '#fff7ed',
    action: 'Further evaluation recommended; For active treatment plans consider adjustment; For text therapy clients monitor for synchronous therapy',
    actionAr: 'يُنصح بإجراء تقييم إضافي؛ والنظر في تعديل خطة العلاج للحالات قيد العلاج النشط؛ ومتابعة الحالة عن كثب.',
  }
  return {
    label: 'Severe', labelAr: 'شديد', color: '#dc2626', bg: '#fef2f2',
    action: 'Adjust treatment plan; focused assessment of safety plan and pharmacotherapy evaluation / re-evaluation; If emergent need then consider referral to higher level of care; Client is not a good candidate for text therapy / asynchronous',
    actionAr: 'تعديل خطة العلاج؛ وإجراء تقييم مركّز لخطة السلامة وتقييم/إعادة تقييم العلاج الدوائي؛ وفي الحالات الطارئة يُنظر في التحويل إلى مستوى رعاية أعلى.',
  }
}

export default function GAD7Dialog({ open, onOpenChange, theme, lang = 'ar' }) {
  const [sessionId, setSessionId] = useState(null)
  const [qrDataUrl, setQrDataUrl] = useState(null)
  const [status, setStatus] = useState('loading')
  const [response, setResponse] = useState(null)
  const [error, setError] = useState('')
  const [sessionUrl, setSessionUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [resultsBlobUrl, setResultsBlobUrl] = useState(null)
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
    setResultsBlobUrl(null)
    try {
      const res = await fetch('/.netlify/functions/gad7', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create' }),
      })
      const data = await res.json()
      if (!data.sessionId) throw new Error('Failed to create session')
      setSessionId(data.sessionId)

      const url = `${window.location.origin}/gad7/${lang}/${data.sessionId}`
      setSessionUrl(url)
      const dataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2, color: { dark: theme?.text || '#0d9488' } })
      setQrDataUrl(dataUrl)
      setStatus('qr')

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch('/.netlify/functions/gad7', {
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
    const questions = QUESTIONS[pdfLang] || QUESTIONS.ar
    const scoreLabels = SCORE_LABELS[pdfLang] || SCORE_LABELS.ar
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

    const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${pdfLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GAD-7 Results</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    @media print { body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } .no-print { display:none !important; } @page { margin: 15mm; } }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; background: #f0fdfa; min-height: 100vh; padding: 16px; color: #1e293b; }
    .page { max-width: 700px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    table { width: 100%; border-collapse: collapse; }
    .ans-col { padding: 12px 16px; width: 140px; }
    .report-actions { position: sticky; top: 0; z-index: 50; display: flex; align-items: center; gap: 8px; padding: 10px 16px; margin: -16px -16px 16px; background: rgba(255,255,255,0.96); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); border-bottom: 1px solid #e5e7eb; }
    .report-actions button { font: 600 13px 'Inter',sans-serif; padding: 8px 14px; border-radius: 8px; border: none; cursor: pointer; }
    .btn-back { background: #f1f5f9; color: #334155; }
    .btn-pdf { background: #0d9488; color: #fff; }
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
  <div class="report-actions no-print" dir="ltr">
    <button class="btn-back" onclick="goBack()">&larr; ${labels.back}</button>
    <div style="flex:1"></div>
    <button class="btn-pdf" onclick="window.print()">${labels.print}</button>
  </div>
  <div class="page">
    <div style="text-align:center;margin-bottom:24px;padding-bottom:16px;border-bottom:2px solid #f1f5f9">
      <h1 style="font-size:20px;font-weight:700;color:#0d9488;margin-bottom:4px">${labels.title}</h1>
      <p style="font-size:13px;color:#94a3b8">${labels.date}: ${date}</p>
    </div>

    <div style="background:${sev.bg};border:2px solid ${sev.color};border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap">
      <div style="font-size:28px;font-weight:800;color:${sev.color}">${total}<span style="font-size:14px;font-weight:400;color:#94a3b8"> / 21</span></div>
      <div style="font-size:15px;font-weight:700;color:${sev.color}">${isAr ? sev.labelAr : sev.label}</div>
    </div>

    <div dir="${dir}" style="margin-bottom:20px;padding:16px 20px;border-radius:12px;${isAr ? 'border-right' : 'border-left'}:4px solid ${sev.color};background:#f8fafc;text-align:${textAlign}">
      <div style="font-size:13px;font-weight:700;color:#000;margin-bottom:4px">${labels.intervention}</div>
      <div style="font-size:14px;color:#334155;line-height:1.7">${isAr ? sev.actionAr : sev.action}</div>
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
  </div>
  <script>
  function goBack(){try{window.close()}catch(e){}setTimeout(function(){if(!window.closed){if(history.length>1){history.back()}else{window.close()}}},120)}
  </script>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html' })
    const blobUrl = URL.createObjectURL(blob)
    setResultsBlobUrl(blobUrl)
  }, [lang])

  useEffect(() => {
    if (status === 'results' && response) {
      openResultsPdf(response)
    }
  }, [status, response])

  const handleClose = (v) => {
    if (!v) cleanup()
    onOpenChange(v)
  }

  const dialogTitle = lang === 'en' ? 'GAD-7 — Anxiety Screening' : 'GAD-7 — مقياس اضطراب القلق'

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

        {status === 'qr' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <p className="text-sm text-muted-foreground text-center">Show this QR code to your patient to fill the GAD-7 questionnaire</p>
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

        {status === 'results' && resultsBlobUrl && (
          <div className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="h-12 w-12 rounded-full flex items-center justify-center" style={{ backgroundColor: theme?.text + '15' }}>
              <Check className="h-6 w-6" style={{ color: theme?.text }} />
            </div>
            <p className="text-sm font-semibold" style={{ color: theme?.text }}>Patient has submitted their responses!</p>
            <a
              href={resultsBlobUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => { e.preventDefault(); window.open(resultsBlobUrl, '_blank') }}
            >
              <Button className="gap-2 text-white" style={{ backgroundColor: theme?.text }}>
                <ClipboardCheck className="h-4 w-4" />
                View Results
              </Button>
            </a>
            <Button onClick={createSession} variant="outline" size="sm" className="gap-1.5">
              <RotateCcw className="h-3.5 w-3.5" />
              New QR Code
            </Button>
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
