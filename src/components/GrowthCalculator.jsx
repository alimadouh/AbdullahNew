import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { whoData } from '../data/whoGrowthData.js'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog.jsx'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import { Calculator } from 'lucide-react'

function calcBMI(weight, height) {
  if (!weight || !height || height === 0) return null
  const hm = height / 100
  return +(weight / (hm * hm)).toFixed(1)
}

function calcZScore(value, dataSet, ageOrLength, keyField = 'month') {
  if (value == null || !dataSet || dataSet.length === 0) return null
  let closest = dataSet[0]
  let minDiff = Math.abs(dataSet[0][keyField] - ageOrLength)
  for (const d of dataSet) {
    const diff = Math.abs(d[keyField] - ageOrLength)
    if (diff < minDiff) { minDiff = diff; closest = d }
  }
  const { neg3, neg2, neg1, median, pos1, pos2, pos3 } = closest
  if (value >= median) {
    if (value >= pos3) return 3
    if (value >= pos2) return 2 + (value - pos2) / (pos3 - pos2)
    if (value >= pos1) return 1 + (value - pos1) / (pos2 - pos1)
    return (value - median) / (pos1 - median)
  } else {
    if (value <= neg3) return -3
    if (value <= neg2) return -2 - (neg2 - value) / (neg2 - neg3)
    if (value <= neg1) return -1 - (neg1 - value) / (neg1 - neg2)
    return -(median - value) / (median - neg1)
  }
}

// WHO interpretation per indicator type
// indicator: 'lengthForAge' | 'weightForAge' | 'weightForLength' | 'bmiForAge' | 'headCircForAge'
function getZInterpretation(z, indicator) {
  if (z == null) return '—'
  if (indicator === 'lengthForAge' || indicator === 'heightForAge') {
    if (z >= 3) return 'Very tall for age'
    if (z >= 2) return 'Tall for age'
    if (z >= -2) return 'Normal'
    if (z > -3) return 'Stunted'
    return 'Severely stunted'
  }
  if (indicator === 'weightForAge') {
    if (z >= 3) return 'Very high weight for age'
    if (z >= 2) return 'High weight for age'
    if (z >= -2) return 'Normal'
    if (z > -3) return 'Underweight'
    return 'Severely underweight'
  }
  if (indicator === 'weightForLength' || indicator === 'weightForHeight') {
    if (z >= 3) return 'Obese'
    if (z >= 2) return 'Overweight'
    if (z >= 1) return 'Possible risk of overweight'
    if (z >= -2) return 'Normal'
    if (z > -3) return 'Wasted'
    return 'Severely wasted'
  }
  if (indicator === 'bmiForAge') {
    if (z >= 3) return 'Obese'
    if (z >= 2) return 'Overweight'
    if (z >= 1) return 'Possible risk of overweight'
    if (z >= -2) return 'Normal'
    if (z > -3) return 'Wasted'
    return 'Severely wasted'
  }
  if (z >= 2) return 'Above normal'
  if (z >= -2) return 'Normal'
  return 'Below normal'
}

function getZLabel(z, indicator) {
  if (z == null) return '—'
  const val = z.toFixed(1)
  const status = getZInterpretation(z, indicator)
  return `${val > 0 ? '+' : ''}${val} (${status})`
}

function getZColor(z, indicator) {
  if (z == null) return '#6b7280'
  const interp = getZInterpretation(z, indicator)
  if (interp === 'Normal') return '#16a34a'
  if (interp === 'Possible risk of overweight' || interp === 'High weight for age' || interp === 'Tall for age') return '#ca8a04'
  if (interp === 'Stunted' || interp === 'Underweight' || interp === 'Wasted' || interp === 'Overweight' || interp === 'Above normal' || interp === 'Below normal') return '#dc2626'
  if (interp === 'Severely stunted' || interp === 'Severely underweight' || interp === 'Severely wasted' || interp === 'Obese' || interp === 'Very high weight for age' || interp === 'Very tall for age') return '#111111'
  return '#6b7280'
}

function getZBg(color) {
  if (color === '#16a34a') return '#f0fdf4'
  if (color === '#ca8a04') return '#fefce8'
  if (color === '#dc2626') return '#fef2f2'
  return '#f3f4f6'
}

/* ── Z-score curve definitions ── */
const Z_CURVES_7 = [
  { key: 'neg3', label: '-3', color: '#000000', width: 1.5 },
  { key: 'neg2', label: '-2', color: '#dc2626', width: 1.5 },
  { key: 'neg1', label: '-1', color: '#f97316', width: 1.2 },
  { key: 'median', label: '0', color: '#16a34a', width: 2 },
  { key: 'pos1', label: '1', color: '#f97316', width: 1.2 },
  { key: 'pos2', label: '2', color: '#dc2626', width: 1.5 },
  { key: 'pos3', label: '3', color: '#000000', width: 1.5 },
]
const Z_CURVES_5 = [
  { key: 'neg3', label: '-3', color: '#000000', width: 1.5 },
  { key: 'neg2', label: '-2', color: '#dc2626', width: 1.5 },
  { key: 'median', label: '0', color: '#16a34a', width: 2 },
  { key: 'pos2', label: '2', color: '#dc2626', width: 1.5 },
  { key: 'pos3', label: '3', color: '#000000', width: 1.5 },
]

/* ── Chart configuration ── */
const CHART_CONFIGS = [
  {
    id: 'birth2_lengthForAge',
    title: (g) => `Length-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: 'Birth to 2 years (z-scores)',
    dataKey: 'lengthForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Length (cm)',
    xTicks: () => buildAgeTicks(0, 24),
    yStep: 5, curves: Z_CURVES_5,
    filter: (d) => d.month <= 24,
    patientXY: (age, w, h) => [age, h],
    show: (age) => age <= 24,
  },
  {
    id: 'birth2_weightForAge',
    title: (g) => `Weight-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: 'Birth to 2 years (z-scores)',
    dataKey: 'weightForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Weight (kg)',
    xTicks: () => buildAgeTicks(0, 24),
    yStep: 2, curves: Z_CURVES_5,
    filter: (d) => d.month <= 24,
    patientXY: (age, w, h) => [age, w],
    show: (age) => age <= 24,
  },
  {
    id: 'birth2_weightForLength',
    title: (g) => `Weight-for-length ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: 'Birth to 2 years (z-scores)',
    dataKey: 'weightForLength',
    xField: 'length', xLabel: 'Length (cm)',
    yLabel: 'Weight (kg)',
    xTicks: () => buildLinearTicks(45, 110, 5),
    yStep: 2, curves: Z_CURVES_7,
    filter: null,
    patientXY: (age, w, h) => [h, w],
    show: (age) => age <= 24,
  },
  {
    id: 'birth2_bmiForAge',
    title: (g) => `BMI-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: 'Birth to 2 years (z-scores)',
    dataKey: 'bmiForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'BMI (kg/m²)',
    xTicks: () => buildAgeTicks(0, 24),
    yStep: 2, curves: Z_CURVES_7,
    filter: (d) => d.month <= 24,
    patientXY: (age, w, h, hc, bmi) => [age, bmi],
    show: (age, w, h, hc, bmi) => age <= 24 && bmi,
  },
  {
    id: 'birth2_headCirc',
    title: (g) => `Head circumference-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: 'Birth to 2 years (z-scores)',
    dataKey: 'headCircForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Head circumference (cm)',
    xTicks: () => buildAgeTicks(0, 24),
    yStep: 2, curves: Z_CURVES_7,
    filter: (d) => d.month <= 24,
    patientXY: (age, w, h, hc) => [age, hc],
    show: (age, w, h, hc) => age <= 24 && hc > 0,
  },
  {
    id: '2to5_heightForAge',
    title: (g) => `Height-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '2 to 5 years (z-scores)',
    dataKey: 'heightForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Height (cm)',
    xTicks: () => buildAgeTicks(24, 60),
    yStep: 5, curves: Z_CURVES_5,
    filter: (d) => d.month >= 24 && d.month <= 60,
    patientXY: (age, w, h) => [age, h],
    show: (age) => age > 24 && age <= 60,
  },
  {
    id: '2to5_weightForAge',
    title: (g) => `Weight-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '2 to 5 years (z-scores)',
    dataKey: 'weightForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Weight (kg)',
    xTicks: () => buildAgeTicks(24, 60),
    yStep: 2, curves: Z_CURVES_5,
    filter: (d) => d.month >= 24 && d.month <= 60,
    patientXY: (age, w, h) => [age, w],
    show: (age) => age > 24 && age <= 60,
  },
  {
    id: '2to5_weightForHeight',
    title: (g) => `Weight-for-height ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '2 to 5 years (z-scores)',
    dataKey: 'weightForHeight',
    xField: 'height', xLabel: 'Height (cm)',
    yLabel: 'Weight (kg)',
    xTicks: () => buildLinearTicks(65, 120, 5),
    yStep: 2, curves: Z_CURVES_7,
    filter: null,
    patientXY: (age, w, h) => [h, w],
    show: (age) => age > 24 && age <= 60,
  },
  {
    id: '2to5_bmiForAge',
    title: (g) => `BMI-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '2 to 5 years (z-scores)',
    dataKey: 'bmiForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'BMI (kg/m²)',
    xTicks: () => buildAgeTicks(24, 60),
    yStep: 1, curves: Z_CURVES_7,
    filter: (d) => d.month >= 24 && d.month <= 60,
    patientXY: (age, w, h, hc, bmi) => [age, bmi],
    show: (age, w, h, hc, bmi) => age > 24 && age <= 60 && bmi,
  },
  {
    id: '2to5_headCirc',
    title: (g) => `Head circumference-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '2 to 5 years (z-scores)',
    dataKey: 'headCircForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Head circumference (cm)',
    xTicks: () => buildAgeTicks(24, 60),
    yStep: 2, curves: Z_CURVES_7,
    filter: (d) => d.month >= 24 && d.month <= 60,
    patientXY: (age, w, h, hc) => [age, hc],
    show: (age, w, h, hc) => age > 24 && age <= 60 && hc > 0,
  },
  {
    id: '5to19_heightForAge',
    title: (g) => `Height-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '5 to 19 years (z-scores)',
    dataKey: 'heightForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'Height (cm)',
    xTicks: () => buildAgeTicks(61, 228),
    yStep: 10, curves: Z_CURVES_7,
    filter: (d) => d.month >= 61,
    patientXY: (age, w, h) => [age, h],
    show: (age) => age > 60,
  },
  {
    id: '5to19_bmiForAge',
    title: (g) => `BMI-for-age ${g === 'boys' ? 'BOYS' : 'GIRLS'}`,
    subtitle: '5 to 19 years (z-scores)',
    dataKey: 'bmiForAge',
    xField: 'month', xLabel: 'Age (completed months and years)',
    yLabel: 'BMI (kg/m²)',
    xTicks: () => buildAgeTicks(61, 228),
    yStep: 2, curves: Z_CURVES_7,
    filter: (d) => d.month >= 61,
    patientXY: (age, w, h, hc, bmi) => [age, bmi],
    show: (age, w, h, hc, bmi) => age > 60 && bmi,
  },
]

/* ── Tick generation helpers ── */
function buildAgeTicks(startMonth, endMonth) {
  const ticks = []
  for (let m = startMonth; m <= endMonth; m++) {
    const yearNum = Math.floor(m / 12)
    const monthInYear = m % 12
    if (m === 0) {
      ticks.push({ value: m, label: 'Birth', major: true })
    } else if (monthInYear === 0) {
      const label = yearNum === 1 ? '1 year' : `${yearNum} years`
      ticks.push({ value: m, label, major: true })
    } else if (monthInYear === 11) {
      // Skip month 11 to avoid overlapping with the year label
      ticks.push({ value: m, label: '', major: false })
    } else {
      ticks.push({ value: m, label: String(monthInYear), major: false })
    }
  }
  return ticks
}

function buildLinearTicks(start, end, step) {
  const ticks = []
  for (let v = start; v <= end; v += step) {
    ticks.push({ value: v, label: String(v), major: v % (step * 2) === 0 || v === start })
  }
  return ticks
}

/* ── Canvas chart drawing ── */
const CHART_ASPECT = 1.42
const MARGIN = { top: 0.08, right: 0.06, bottom: 0.12, left: 0.08 }

function drawChart(canvas, config, data, gender, patientX, patientY, dpr) {
  const ctx = canvas.getContext('2d')
  const W = canvas.width
  const H = canvas.height

  const headerH = H * 0.075
  const headerColor = gender === 'boys' ? '#0099cc' : '#d563a0'

  ctx.fillStyle = headerColor
  ctx.fillRect(0, 0, W, headerH)

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.round(20 * dpr)}px Arial, sans-serif`
  ctx.textBaseline = 'top'
  ctx.fillText(config.title(gender), 14 * dpr, 10 * dpr)
  ctx.font = `${Math.round(11 * dpr)}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.85)'
  ctx.fillText(config.subtitle, 14 * dpr, 34 * dpr)

  ctx.textAlign = 'right'
  ctx.font = `${Math.round(10 * dpr)}px Arial, sans-serif`
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.fillText('WHO Child Growth Standards', W - 14 * dpr, 14 * dpr)
  ctx.textAlign = 'left'

  const plotL = W * MARGIN.left
  const plotR = W * (1 - MARGIN.right)
  const plotT = headerH + H * 0.03
  const plotB = H * (1 - MARGIN.bottom)
  const plotW = plotR - plotL
  const plotH = plotB - plotT

  const allYVals = data.flatMap(d =>
    config.curves.map(c => d[c.key]).filter(v => v != null)
  )
  const dataYMin = Math.min(...allYVals)
  const dataYMax = Math.max(...allYVals)
  const yPad = (dataYMax - dataYMin) * 0.05
  const yMin = Math.floor((dataYMin - yPad) / config.yStep) * config.yStep
  const yMax = Math.ceil((dataYMax + yPad) / config.yStep) * config.yStep

  const allXVals = data.map(d => d[config.xField])
  const xMin = Math.min(...allXVals)
  const xMax = Math.max(...allXVals)

  const mapX = (v) => plotL + ((v - xMin) / (xMax - xMin)) * plotW
  const mapY = (v) => plotB - ((v - yMin) / (yMax - yMin)) * plotH

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, headerH, W, H - headerH)


  ctx.strokeStyle = '#d4d4d4'
  ctx.lineWidth = 0.5 * dpr
  for (let y = yMin; y <= yMax; y += config.yStep) {
    const py = mapY(y)
    ctx.beginPath(); ctx.moveTo(plotL, py); ctx.lineTo(plotR, py); ctx.stroke()
  }
  const minorYStep = config.yStep / 2
  ctx.strokeStyle = '#e8e8e8'
  ctx.lineWidth = 0.3 * dpr
  for (let y = yMin + minorYStep; y < yMax; y += config.yStep) {
    const py = mapY(y)
    ctx.beginPath(); ctx.moveTo(plotL, py); ctx.lineTo(plotR, py); ctx.stroke()
  }

  const xTicks = config.xTicks()
  xTicks.forEach(t => {
    if (t.value < xMin || t.value > xMax) return
    const px = mapX(t.value)
    ctx.strokeStyle = t.major ? '#c0c0c0' : '#e0e0e0'
    ctx.lineWidth = (t.major ? 0.6 : 0.3) * dpr
    ctx.beginPath(); ctx.moveTo(px, plotT); ctx.lineTo(px, plotB); ctx.stroke()
  })

  ctx.strokeStyle = '#666666'
  ctx.lineWidth = 1 * dpr
  ctx.strokeRect(plotL, plotT, plotW, plotH)

  config.curves.forEach(curve => {
    ctx.strokeStyle = curve.color
    ctx.lineWidth = curve.width * dpr
    ctx.beginPath()
    let started = false
    data.forEach(d => {
      const val = d[curve.key]
      if (val == null) return
      const px = mapX(d[config.xField])
      const py = mapY(val)
      if (!started) { ctx.moveTo(px, py); started = true }
      else ctx.lineTo(px, py)
    })
    ctx.stroke()
  })

  const lastD = data[data.length - 1]
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  config.curves.forEach(curve => {
    const val = lastD[curve.key]
    if (val == null) return
    const py = mapY(val)
    ctx.font = `bold ${Math.round(12 * dpr)}px Arial, sans-serif`
    ctx.fillStyle = curve.color
    ctx.fillText(curve.label, plotR + 4 * dpr, py)
  })

  ctx.textBaseline = 'middle'
  ctx.font = `${Math.round(11 * dpr)}px Arial, sans-serif`
  ctx.fillStyle = '#333333'
  for (let y = yMin; y <= yMax; y += config.yStep) {
    const py = mapY(y)
    ctx.textAlign = 'right'
    ctx.fillText(String(y), plotL - 6 * dpr, py)
    ctx.textAlign = 'left'
    ctx.fillText(String(y), plotR + 28 * dpr, py)
  }

  ctx.textBaseline = 'top'
  ctx.fillStyle = '#333333'
  // Draw minor (month) tick labels first
  xTicks.forEach(t => {
    if (t.value < xMin || t.value > xMax) return
    if (t.major) return // skip major ticks here, draw them below
    if (xTicks.length > 50) return // 5-19yr charts: skip minor labels
    const px = mapX(t.value)
    ctx.font = `${Math.round(9 * dpr)}px Arial, sans-serif`
    ctx.textAlign = 'center'
    if (t.label) ctx.fillText(t.label, px, plotB + 4 * dpr)
    ctx.strokeStyle = '#888888'
    ctx.lineWidth = 0.5 * dpr
    ctx.beginPath(); ctx.moveTo(px, plotB); ctx.lineTo(px, plotB + 3 * dpr); ctx.stroke()
  })
  // Draw major (year) tick labels on a second row
  xTicks.filter(t => t.major).forEach(t => {
    if (t.value < xMin || t.value > xMax) return
    const px = mapX(t.value)
    ctx.font = `bold ${Math.round(10 * dpr)}px Arial, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = '#333333'
    ctx.fillText(t.label, px, plotB + 16 * dpr)
    ctx.strokeStyle = '#666666'
    ctx.lineWidth = 0.8 * dpr
    ctx.beginPath(); ctx.moveTo(px, plotB); ctx.lineTo(px, plotB + 6 * dpr); ctx.stroke()
  })


  ctx.fillStyle = '#333333'
  ctx.textAlign = 'center'
  ctx.font = `bold ${Math.round(11 * dpr)}px Arial, sans-serif`
  ctx.fillText(config.xLabel, plotL + plotW / 2, H - 10 * dpr)

  ctx.save()
  ctx.translate(12 * dpr, plotT + plotH / 2)
  ctx.rotate(-Math.PI / 2)
  ctx.fillText(config.yLabel, 0, 0)
  ctx.restore()


  if (patientX != null && patientY != null) {
    const dx = mapX(patientX)
    const dy = mapY(patientY)
    if (dx >= plotL && dx <= plotR && dy >= plotT && dy <= plotB) {
      ctx.beginPath()
      ctx.arc(dx, dy, 7 * dpr, 0, Math.PI * 2)
      ctx.fillStyle = '#dc2626'
      ctx.fill()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2.5 * dpr
      ctx.stroke()
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 0.8 * dpr
      ctx.stroke()
    }
  }
}

/* ── Generate chart as data URL for the new-tab report ── */
function renderChartToDataURL(config, gender, patientX, patientY) {
  const genderData = whoData[gender]
  const rawData = genderData[config.dataKey]
  const data = config.filter ? rawData.filter(config.filter) : rawData

  const canvas = document.createElement('canvas')
  const width = 900
  const height = width / CHART_ASPECT
  const dpr = 2

  canvas.width = width * dpr
  canvas.height = height * dpr

  drawChart(canvas, config, data, gender, patientX, patientY, dpr)
  return canvas.toDataURL('image/png')
}

/* ── Open report in new browser tab ── */
function openReportInNewTab({ gender, age, w, h, hc, bmi, zScores, activeCharts }) {
  const isBoy = gender === 'boys'
  const accentColor = isBoy ? '#0099cc' : '#d563a0'
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // Build z-score rows — same order as charts
  const zRows = []
  zRows.push({ label: age <= 24 ? 'Length-for-age' : 'Height-for-age', z: zScores.lengthForAge, indicator: 'lengthForAge' })
  if (age <= 60) zRows.push({ label: 'Weight-for-age', z: zScores.weightForAge, indicator: 'weightForAge' })
  if (age <= 24) zRows.push({ label: 'Weight-for-length', z: zScores.weightForLength, indicator: 'weightForLength' })
  if (age > 24 && age <= 60) zRows.push({ label: 'Weight-for-height', z: zScores.weightForHeight, indicator: 'weightForHeight' })
  if (bmi) zRows.push({ label: 'BMI-for-age', z: zScores.bmiForAge, indicator: 'bmiForAge' })
  if (hc > 0 && age <= 60) zRows.push({ label: 'Head circ-for-age', z: zScores.headCircForAge, indicator: 'headCircForAge' })

  const zRowsHTML = zRows.map(row => {
    const color = getZColor(row.z, row.indicator)
    const bg = getZBg(color)
    const zVal = row.z != null ? row.z.toFixed(1) : '—'
    const zPrefix = row.z != null ? (row.z > 0 ? '+' : '') : ''
    const zLabel = row.z != null ? getZInterpretation(row.z, row.indicator) : '—'
    return `<tr style="background:${bg}">
      <td style="padding:8px 12px;font-weight:500">${row.label}</td>
      <td style="padding:8px 12px;text-align:center;font-weight:700;color:${color}">${zPrefix}${zVal}</td>
      <td style="padding:8px 12px"><span style="display:inline-block;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:600;color:${color};background:${bg}">${zLabel}</span></td>
    </tr>`
  }).join('')

  // Render all charts to data URLs
  const chartImages = activeCharts.map(config => {
    const [px, py] = config.patientXY(age, w, h, hc, bmi)
    const dataURL = renderChartToDataURL(config, gender, px, py)
    return `<div style="margin-bottom:24px;break-inside:avoid"><img src="${dataURL}" style="width:100%;display:block" /></div>`
  }).join('')

  // Patient info items
  const infoItems = [
    `<div><span style="color:#666">Gender:</span> <strong>${isBoy ? 'Male' : 'Female'}</strong></div>`,
    `<div><span style="color:#666">Age:</span> <strong>${Math.floor(age / 12)}y ${age % 12}m</strong> <span style="color:#999;font-size:11px">(${age} months)</span></div>`,
    `<div><span style="color:#666">Weight:</span> <strong>${w} kg</strong></div>`,
    `<div><span style="color:#666">${age <= 24 ? 'Length' : 'Height'}:</span> <strong>${h} cm</strong></div>`,
  ]
  if (bmi) infoItems.push(`<div><span style="color:#666">BMI:</span> <strong>${bmi} kg/m²</strong></div>`)
  if (hc > 0) infoItems.push(`<div><span style="color:#666">Head Circ:</span> <strong>${hc} cm</strong></div>`)

  const html = `<!DOCTYPE html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Growth Report — ${isBoy ? 'Boy' : 'Girl'}, ${Math.floor(age / 12)}y ${age % 12}m</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:Arial,sans-serif; background:#f5f5f5; color:#333; }
  .page { max-width:900px; margin:20px auto; background:#fff; padding:32px 36px; box-shadow:0 1px 10px rgba(0,0,0,0.12); }
  @media (max-width:640px) { .page { margin:0; padding:20px 14px; box-shadow:none; } }
  @media print {
    body { background:#fff; }
    .page { margin:0; padding:20px; box-shadow:none; }
    img { break-inside:avoid; }
  }
</style>
</head><body>
<div class="page">

  <!-- Header -->
  <div style="border-bottom:3px solid ${accentColor};padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:8px">
    <div>
      <h1 style="font-size:22px;font-weight:700;color:#1a1a1a">WHO Growth Chart Report</h1>
      <p style="font-size:12px;color:#888;margin-top:4px">Generated on ${dateStr}</p>
    </div>
    <div style="font-size:11px;color:#888;text-align:right;line-height:1.5">
      WHO Child Growth Standards<br>Based on official LMS parameters
    </div>
  </div>

  <!-- Patient Info -->
  <div style="background:${isBoy ? '#eff6ff' : '#fdf2f8'};border:1px solid ${isBoy ? '#bfdbfe' : '#fbcfe8'};border-radius:8px;padding:14px 18px;margin-bottom:24px">
    <h2 style="font-size:13px;font-weight:700;color:${accentColor};margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Patient Information</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:8px 24px;font-size:13px">
      ${infoItems.join('')}
    </div>
  </div>

  <!-- Z-Score Table -->
  <div style="margin-bottom:28px">
    <h2 style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Z-Score Summary</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      <thead>
        <tr style="background:#f8f9fa">
          <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #dee2e6;font-weight:600">Indicator</th>
          <th style="text-align:center;padding:8px 12px;border-bottom:2px solid #dee2e6;font-weight:600">Z-Score</th>
          <th style="text-align:left;padding:8px 12px;border-bottom:2px solid #dee2e6;font-weight:600">Interpretation</th>
        </tr>
      </thead>
      <tbody>${zRowsHTML}</tbody>
    </table>
  </div>

  <!-- Charts -->
  <h2 style="font-size:13px;font-weight:700;color:#1a1a1a;margin-bottom:16px;text-transform:uppercase;letter-spacing:0.5px">Growth Charts</h2>
  ${chartImages}

  <!-- Footer -->
  <div style="border-top:1px solid #dee2e6;padding-top:12px;margin-top:12px;font-size:10px;color:#aaa;text-align:center;line-height:1.6">
    WHO Child Growth Standards (0–5 years) &bull; WHO Growth Reference 2007 (5–19 years)<br>
    Data derived from official WHO LMS parameters &bull; Red dot indicates patient measurement
  </div>

</div>
</body></html>`

  const win = window.open('', '_blank')
  if (win) {
    win.document.write(html)
    win.document.close()
  }
}

/* ── Main component ── */
export default function GrowthCalculator({ open, onClose, theme }) {
  const [gender, setGender] = useState('boys')
  const [ageYears, setAgeYears] = useState('')
  const [ageExtraMonths, setAgeExtraMonths] = useState('')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [headCirc, setHeadCirc] = useState('')

  const age = (parseInt(ageYears) || 0) * 12 + (parseInt(ageExtraMonths) || 0)
  const hasAge = ageYears !== '' || ageExtraMonths !== ''
  const w = parseFloat(weight) || 0
  const h = parseFloat(height) || 0
  const hc = parseFloat(headCirc) || 0
  const bmi = calcBMI(w, h)

  const genderData = whoData[gender]
  const canCalculate = hasAge && age >= 0 && age <= 228 && w > 0 && h > 0

  const handleCalculate = () => {
    if (!canCalculate) return

    const zScores = {
      weightForAge: calcZScore(w, genderData.weightForAge, age, 'month'),
      lengthForAge: age <= 24
        ? calcZScore(h, genderData.lengthForAge, age, 'month')
        : calcZScore(h, genderData.heightForAge, age, 'month'),
      weightForLength: age <= 24
        ? calcZScore(w, genderData.weightForLength, h, 'length')
        : null,
      weightForHeight: age > 24 && age <= 60
        ? calcZScore(w, genderData.weightForHeight, h, 'height')
        : null,
      bmiForAge: bmi ? calcZScore(bmi, genderData.bmiForAge, age, 'month') : null,
      headCircForAge: hc ? calcZScore(hc, genderData.headCircForAge, age, 'month') : null,
    }

    const activeCharts = CHART_CONFIGS.filter(c => c.show(age, w, h, hc, bmi))

    openReportInNewTab({ gender, age, w, h, hc, bmi, zScores, activeCharts })
  }

  const handleReset = () => {
    setGender('boys')
    setAgeYears('')
    setAgeExtraMonths('')
    setWeight('')
    setHeight('')
    setHeadCirc('')
  }

  const themeColor = theme?.text || '#16a34a'

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2" style={{ color: themeColor }}>
            <Calculator className="h-5 w-5" />
            Growth Chart Calculator
          </DialogTitle>
          <DialogDescription>
            Enter patient measurements to plot on WHO growth charts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Gender</label>
            <div className="flex gap-2">
              <button
                onClick={() => setGender('boys')}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all border"
                style={gender === 'boys'
                  ? { backgroundColor: '#dbeafe', borderColor: '#3b82f6', color: '#1d4ed8' }
                  : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >Boy</button>
              <button
                onClick={() => setGender('girls')}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all border"
                style={gender === 'girls'
                  ? { backgroundColor: '#fce7f3', borderColor: '#ec4899', color: '#be185d' }
                  : { backgroundColor: '#f9fafb', borderColor: '#e5e7eb', color: '#6b7280' }
                }
              >Girl</button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">Age</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <div className="relative">
                  <Input type="number" min="0" max="19" placeholder="0" value={ageYears} onChange={e => setAgeYears(e.target.value)} className="pr-12" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">years</span>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <Input type="number" min="0" max="11" placeholder="0" value={ageExtraMonths} onChange={e => setAgeExtraMonths(e.target.value)} className="pr-16" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">months</span>
                </div>
              </div>
            </div>
            {hasAge && <p className="text-xs text-muted-foreground mt-1">Total: {age} months</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Weight (kg)</label>
              <Input type="number" min="0" step="0.1" placeholder="e.g. 10.5" value={weight} onChange={e => setWeight(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">{age <= 24 ? 'Length' : 'Height'} (cm)</label>
              <Input type="number" min="0" step="0.1" placeholder="e.g. 75.5" value={height} onChange={e => setHeight(e.target.value)} />
            </div>
          </div>

          {bmi && (
            <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">BMI</span>
              <span className="text-lg font-bold" style={{ color: themeColor }}>{bmi} <span className="text-xs font-normal text-muted-foreground">kg/m²</span></span>
            </div>
          )}

          {age <= 60 && (
            <div>
              <label className="text-sm font-medium mb-1.5 block">Head Circumference (cm) <span className="text-muted-foreground">(optional)</span></label>
              <Input type="number" min="0" step="0.1" placeholder="e.g. 46" value={headCirc} onChange={e => setHeadCirc(e.target.value)} />
            </div>
          )}

          <Button onClick={handleCalculate} disabled={!canCalculate} className="w-full" style={{ backgroundColor: themeColor }}>
            <Calculator className="h-4 w-4 mr-2" />
            Generate Growth Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
