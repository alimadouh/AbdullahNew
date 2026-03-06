import { ensureSchema, sql, VALID_SECTIONS } from './_db.mjs'

function json(statusCode, body) {
  return { statusCode, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
}

async function getMedicationContext(query) {
  const searchTerms = query.toLowerCase().split(/\s+/)
  const sections = []
  for (const section of VALID_SECTIONS) {
    const metaRows = await sql`SELECT columns FROM table_meta WHERE section = ${section} LIMIT 1`
    const columns = metaRows?.[0]?.columns || []
    if (!columns.length) continue

    const dbRows = await sql`SELECT data FROM table_rows WHERE section = ${section} ORDER BY created_at ASC`
    if (!dbRows.length) continue

    const matchingRows = dbRows.filter(r => {
      const rowText = columns.map(c => String(r.data?.[c] || '')).join(' ').toLowerCase()
      return searchTerms.some(term => term.length > 1 && rowText.includes(term))
    })

    if (!matchingRows.length) continue

    const rows = matchingRows.slice(0, 30).map(r => {
      return columns.map(c => `${c}: ${r.data?.[c] || 'N/A'}`).join(' | ')
    })

    sections.push(`## ${section.replace(/-/g, ' ').toUpperCase()}\nColumns: ${columns.join(', ')}\n${rows.join('\n')}`)
  }

  if (!sections.length) {
    for (const section of VALID_SECTIONS) {
      const metaRows = await sql`SELECT columns FROM table_meta WHERE section = ${section} LIMIT 1`
      const columns = metaRows?.[0]?.columns || []
      if (!columns.length) continue
      sections.push(`## ${section.replace(/-/g, ' ').toUpperCase()}\nColumns: ${columns.join(', ')}\n(No matching medications found for this query)`)
    }
  }

  return sections.join('\n\n')
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed' })

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return json(500, { error: 'AI assistant is not configured. Add ANTHROPIC_API_KEY to environment variables.' })

    await ensureSchema()

    const { message, history, image } = JSON.parse(event.body || '{}')
    if (!message?.trim() && !image) return json(400, { error: 'Message is required' })

    const medContext = await getMedicationContext(message || '')

    const systemPrompt = `You are PCIS Assistant, a professional medical reference chatbot for the PCIS Medication app (Ministry of Health, Kuwait).

RULES:
- Answer ONLY based on the medication database below
- Be straight to the point, no filler words or long introductions
- If a medication is not in the database, say "Not found in database" in one line
- For general medical questions, one line: "Please consult a healthcare professional"
- Respond in the same language the user writes in (Arabic or English)
- Maximum 5-6 bullet points per medication
- When writing doses, NEVER put a space between the number and unit (write 500mg, not 500 mg. Write 10ml, not 10 ml)
- NEVER use markdown tables. Always use the bold subtitle + bullet points format instead
- If the user sends an image of a medication box/label, identify it and provide info from the database

FORMAT (follow this exactly):
- Each medication name is **bold** on its own line, no bullet before it
- Details go as bullet points below the bold name in this order: Dose, Route, Indication, Contraindications
- Use bold for labels
- Separate multiple medications with a blank line
- Example:

**Adol Drops**
- **Dose:** 100mg
- **Route:** Oral drops
- **Indication:** Fever in infants
- **Contraindications:** Allergy to paracetamol

--- MEDICATION DATABASE ---
${medContext}
--- END DATABASE ---`

    const messages = []
    if (Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.image) {
          messages.push({ role: h.role, content: [
            { type: 'image', source: { type: 'base64', media_type: h.image.mediaType, data: h.image.data } },
            { type: 'text', text: h.content || 'What medication is this?' },
          ]})
        } else {
          messages.push({ role: h.role, content: h.content })
        }
      }
    }

    // Build current message content
    if (image) {
      messages.push({ role: 'user', content: [
        { type: 'image', source: { type: 'base64', media_type: image.mediaType, data: image.data } },
        { type: 'text', text: message?.trim() || 'What medication is this? Provide details from the database.' },
      ]})
    } else {
      messages.push({ role: 'user', content: message.trim() })
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: systemPrompt,
        messages,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return json(500, { error: `AI request failed: ${err}` })
    }

    const data = await res.json()
    const reply = data.content?.[0]?.text || 'Sorry, I could not generate a response.'

    return json(200, { reply })
  } catch (err) {
    return json(500, { error: String(err?.message || err) })
  }
}
