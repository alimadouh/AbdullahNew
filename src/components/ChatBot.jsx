import React, { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { Button } from './ui/button.jsx'
import { Send, X, Loader2, Bot, User, ImagePlus } from 'lucide-react'

export default function ChatBot({ theme }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pendingImage, setPendingImage] = useState(null)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      setPendingImage({
        data: base64,
        mediaType: file.type,
        preview: reader.result,
      })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const sendMessage = async () => {
    const text = input.trim()
    if ((!text && !pendingImage) || loading) return

    const userMsg = {
      role: 'user',
      content: text || (pendingImage ? 'What medication is this?' : ''),
      image: pendingImage || null,
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    const imageToSend = pendingImage
    setPendingImage(null)
    setLoading(true)
    setError('')

    try {
      const body = { message: userMsg.content, history: messages }
      if (imageToSend) {
        body.image = { data: imageToSend.data, mediaType: imageToSend.mediaType }
      }

      const res = await fetch('/.netlify/functions/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to get response')
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch (err) {
      setError(String(err?.message || 'Something went wrong'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="no-print fixed bottom-6 left-6 z-50 flex h-12 w-12 items-center justify-center rounded-full shadow-lg hover:scale-105 transition-transform cursor-pointer"
          style={{ backgroundColor: theme?.primary || '#0284c7', color: '#fff' }}
          aria-label="Open AI Assistant"
        >
          <Bot className="h-6 w-6" />
        </button>
      )}

      {open && (
        <div className="no-print fixed bottom-4 left-4 z-50 w-[340px] sm:w-[380px] max-h-[70vh] flex flex-col rounded-2xl border shadow-2xl bg-background overflow-hidden"
          style={{ '--color-primary': theme?.primary, '--color-primary-foreground': theme?.fg }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b shrink-0" style={{ backgroundColor: theme?.primary, color: '#fff' }}>
            <Bot className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-semibold">PCIS Assistant</p>
              <p className="text-[10px] opacity-80">Powered by AI - Based on your database</p>
            </div>
            <button onClick={() => setOpen(false)} className="cursor-pointer hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[50vh]">
            {messages.length === 0 && !loading && (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <Bot className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium text-muted-foreground">How can I help you?</p>
                <p className="text-xs text-muted-foreground">Ask about medications or send a photo of a medicine box.</p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1" style={{ backgroundColor: theme?.bg || '#e0f2fe' }}>
                    <Bot className="h-3.5 w-3.5" style={{ color: theme?.text || '#0284c7' }} />
                  </div>
                )}
                {msg.role === 'user' ? (
                  <div className="max-w-[80%] flex flex-col items-end gap-1">
                    {msg.image && (
                      <img src={msg.image.preview} alt="Attached" className="max-w-full max-h-32 rounded-lg" />
                    )}
                    {msg.content && (
                      <div
                        className="rounded-xl rounded-br-sm px-3 py-2 text-sm text-white break-words"
                        style={{ backgroundColor: theme?.primary || '#0284c7', overflowWrap: 'anywhere' }}
                      >
                        {msg.content}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-[85%] rounded-xl rounded-bl-sm bg-muted px-3 py-2 text-sm chat-markdown" style={{ overflowWrap: 'anywhere' }}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                        ul: ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        h1: ({ children }) => <p className="font-bold text-base mb-1">{children}</p>,
                        h2: ({ children }) => <p className="font-bold text-sm mb-1">{children}</p>,
                        h3: ({ children }) => <p className="font-semibold text-sm mb-1">{children}</p>,
                        code: ({ children }) => <code className="bg-background rounded px-1 py-0.5 text-xs">{children}</code>,
                        hr: () => <hr className="my-2 border-border" />,
                      }}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}
                {msg.role === 'user' && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted mt-1">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full mt-1" style={{ backgroundColor: theme?.bg || '#e0f2fe' }}>
                  <Bot className="h-3.5 w-3.5" style={{ color: theme?.text || '#0284c7' }} />
                </div>
                <div className="bg-muted rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}

            {error && (
              <div className="text-xs text-destructive text-center px-2 py-1">
                {error}
              </div>
            )}
          </div>

          {/* Pending image preview */}
          {pendingImage && (
            <div className="px-3 pt-2 flex items-center gap-2">
              <img src={pendingImage.preview} alt="Preview" className="h-12 w-12 rounded-lg object-cover border" />
              <span className="text-xs text-muted-foreground flex-1">Image attached</span>
              <button onClick={() => setPendingImage(null)} className="text-muted-foreground hover:text-destructive cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Input */}
          <div className="border-t px-3 py-2.5 shrink-0">
            <div className="flex gap-2">
              <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageSelect} />
              <button
                onClick={() => fileRef.current?.click()}
                className="shrink-0 flex items-center justify-center h-9 w-9 rounded-lg border border-input hover:bg-accent transition-colors cursor-pointer"
                disabled={loading}
              >
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              </button>
              <input
                ref={inputRef}
                type="text"
                placeholder="Ask about medications..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
                className="flex-1 rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={loading}
              />
              <Button
                size="icon"
                className="shrink-0 rounded-lg"
                onClick={sendMessage}
                disabled={loading || (!input.trim() && !pendingImage)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
