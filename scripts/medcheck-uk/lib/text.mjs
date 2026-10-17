// Shared page-text fetching + normalisation for the UK medication checker data.
// The research helper (fetchtext.mjs) and the quote verifier (verify.mjs) both use this,
// so a quote copied from fetchtext output is matched against exactly the same text.
import fs from 'fs'
import path from 'path'
import os from 'os'
import crypto from 'crypto'
import { execFileSync } from 'child_process'

export const CACHE_DIR = process.env.MEDCHECK_CACHE || path.join(os.tmpdir(), 'medcheck_uk_cache')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', lsquo: "'", rsquo: "'", ldquo: '"', rdquo: '"', hellip: '...', ge: '≥', le: '≤', deg: '°', micro: 'µ', times: '×', middot: '·', bull: '•', shy: '', reg: '®', trade: '™', copy: '©', plusmn: '±', frac12: '½', sup2: '²', eacute: 'é', ouml: 'ö', uuml: 'ü' }
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
    if (e[0] === '#') { const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return Number.isFinite(n) ? String.fromCodePoint(n) : m }
    return ENT[e.toLowerCase()] ?? m
  })
}

// Normalise for matching: unify quotes, dashes, spaces, bullets; collapse whitespace. Case is kept.
export function norm(s) {
  return s
    .replace(/[­​‌‍﻿]/g, '')
    .replace(/[‘’‚‛′`´]/g, "'")
    .replace(/[“”„‟″]/g, '"')
    .replace(/[‐‑‒–—―−﹣－]/g, '-')
    .replace(/[  -   　\t\r\n]/g, ' ')
    .replace(/[•●▪◦⁃∙]/g, ' ')
    .replace(/�/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function htmlToText(html) {
  let s = html.replace(/<!--[\s\S]*?-->/g, ' ')
  s = s.replace(/<(script|style|noscript|svg|head)[\s\S]*?<\/\1>/gi, ' ')
  s = s.replace(/<(br|\/p|\/div|\/li|\/tr|\/h[1-6]|\/td|\/th)[^>]*>/gi, ' \n ')
  s = s.replace(/<sup[^>]*>/gi, '').replace(/<\/sup>/gi, '').replace(/<sub[^>]*>/gi, '').replace(/<\/sub>/gi, '')
  s = s.replace(/<[^>]+>/g, ' ')
  return norm(decodeEntities(s))
}

const key = (url) => crypto.createHash('sha1').update(url).digest('hex').slice(0, 16)

// Returns { url, finalUrl, status, fetchedAt, text } ; cached on disk unless fresh=true.
export async function getText(url, { fresh = false } = {}) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const f = path.join(CACHE_DIR, key(url) + '.json')
  if (!fresh && fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'))
  let out
  try {
    const r = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'en-GB,en;q=0.9' }, redirect: 'follow' })
    const ct = r.headers.get('content-type') || ''
    let text
    if (ct.includes('pdf') || /\.pdf($|\?)/i.test(r.url)) {
      const buf = Buffer.from(await r.arrayBuffer())
      const pdf = path.join(CACHE_DIR, key(url) + '.pdf')
      fs.writeFileSync(pdf, buf)
      text = norm(execFileSync('pdftotext', ['-enc', 'UTF-8', '-layout', pdf, '-'], { maxBuffer: 64 << 20 }).toString('utf8'))
    } else {
      text = htmlToText(await r.text())
    }
    // bot-check / challenge pages come back as 200 with no real content: never cache them as source text
    const challenge = /are you (a )?human|verify you are human|checking your browser|enable javascript and cookies/i.test(text.slice(0, 3000)) && text.length < 6000
    out = { url, finalUrl: r.url, status: challenge ? 0 : r.status, fetchedAt: new Date().toISOString(), text: challenge ? '' : text, ...(challenge ? { error: 'bot-check page' } : {}) }
  } catch (e) {
    out = { url, finalUrl: null, status: 0, fetchedAt: new Date().toISOString(), error: String(e), text: '' }
  }
  if (out.status === 200 && out.text) fs.writeFileSync(f, JSON.stringify(out))
  return out
}

export const quoteFound = (text, quote) => norm(text).includes(norm(quote))
