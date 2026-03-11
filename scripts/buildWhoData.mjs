/**
 * Build WHO Growth Data from official LMS parameters
 * Sources:
 *   - CDC/WHO CSV files (birth-24 months, monthly)
 *   - WHO anthro GitHub raw files (0-60 months, daily → sampled monthly)
 */
import { readFileSync, writeFileSync } from 'fs'

function lmsToValue(L, M, S, z) {
  if (Math.abs(L) < 0.0001) return +(M * Math.exp(S * z)).toFixed(1)
  return +(M * Math.pow(1 + L * S * z, 1 / L)).toFixed(1)
}

function lmsRowToZscores(L, M, S) {
  return {
    neg3: lmsToValue(L, M, S, -3),
    neg2: lmsToValue(L, M, S, -2),
    neg1: lmsToValue(L, M, S, -1),
    median: lmsToValue(L, M, S, 0),
    pos1: lmsToValue(L, M, S, 1),
    pos2: lmsToValue(L, M, S, 2),
    pos3: lmsToValue(L, M, S, 3),
  }
}

// ─── Parse WHO anthro daily data and sample at monthly intervals ───
function parseAnthroDaily(filePath, sex, monthRange, keyField = 'month') {
  const text = readFileSync(filePath, 'utf-8')
  const lines = text.trim().split('\n')
  const header = lines[0].split('\t').map(s => s.trim())

  const sexIdx = header.indexOf('sex')
  const ageIdx = header.indexOf('age')
  const lIdx = header.indexOf('l')
  const mIdx = header.indexOf('m')
  const sIdx = header.indexOf('s')

  const sexVal = sex === 'boys' ? '1' : '2'

  // Build a map of day → {l, m, s}
  const dayMap = new Map()
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(s => s.trim())
    if (cols[sexIdx] === sexVal) {
      dayMap.set(parseInt(cols[ageIdx]), {
        l: parseFloat(cols[lIdx]),
        m: parseFloat(cols[mIdx]),
        s: parseFloat(cols[sIdx]),
      })
    }
  }

  // Sample at monthly intervals (1 month ≈ 30.4375 days)
  const results = []
  for (let month = monthRange[0]; month <= monthRange[1]; month++) {
    const targetDay = Math.round(month * 30.4375)
    // Find closest day in data
    let bestDay = 0
    let bestDiff = Infinity
    for (const day of dayMap.keys()) {
      const diff = Math.abs(day - targetDay)
      if (diff < bestDiff) { bestDiff = diff; bestDay = day }
    }
    const lms = dayMap.get(bestDay)
    if (lms) {
      results.push({
        [keyField]: month,
        ...lmsRowToZscores(lms.l, lms.m, lms.s)
      })
    }
  }
  return results
}

// Parse weight-for-length/height data (keyed by cm, not age)
function parseAnthroByMeasure(filePath, sex, keyName) {
  const text = readFileSync(filePath, 'utf-8')
  const lines = text.trim().split('\n')
  const header = lines[0].split('\t').map(s => s.trim())

  const sexIdx = header.indexOf('sex')
  const lIdx = header.indexOf('l')
  const mIdx = header.indexOf('m')
  const sIdx = header.indexOf('s')
  // The key column could be 'length' or 'height' depending on the file
  const keyIdx = header.findIndex(h => h !== 'sex' && h !== 'l' && h !== 'm' && h !== 's')

  const sexVal = sex === 'boys' ? '1' : '2'

  // Group by integer cm values (the data has 0.1cm resolution, pick the whole numbers)
  const results = []
  const seen = new Set()

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split('\t').map(s => s.trim())
    if (cols[sexIdx] !== sexVal) continue

    const rawVal = parseFloat(cols[keyIdx])
    // Only take integer cm values
    if (Math.abs(rawVal - Math.round(rawVal)) > 0.01) continue
    const intVal = Math.round(rawVal)
    if (seen.has(intVal)) continue
    seen.add(intVal)

    results.push({
      [keyName]: intVal,
      ...lmsRowToZscores(
        parseFloat(cols[lIdx]),
        parseFloat(cols[mIdx]),
        parseFloat(cols[sIdx])
      )
    })
  }

  return results.sort((a, b) => a[keyName] - b[keyName])
}

// ─── Process all data ───
console.log('Processing WHO anthro data...')

const boys = {
  // Weight-for-age (0-60 months)
  weightForAge: parseAnthroDaily('scripts/weianthro.txt', 'boys', [0, 60]),
  // Length-for-age (0-24 months)
  lengthForAge: parseAnthroDaily('scripts/lenanthro.txt', 'boys', [0, 24]),
  // Height-for-age (24-60 months) — from same file, higher ages
  heightForAge: parseAnthroDaily('scripts/lenanthro.txt', 'boys', [24, 60]),
  // Weight-for-length (45-110cm)
  weightForLength: parseAnthroByMeasure('scripts/wflanthro.txt', 'boys', 'length'),
  // Weight-for-height (65-120cm)
  weightForHeight: parseAnthroByMeasure('scripts/wfhanthro.txt', 'boys', 'height'),
  // BMI-for-age (0-60 months)
  bmiForAge: parseAnthroDaily('scripts/bmianthro.txt', 'boys', [0, 60]),
  // Head circumference (0-60 months)
  headCircForAge: parseAnthroDaily('scripts/hcanthro.txt', 'boys', [0, 60]),
}

const girls = {
  weightForAge: parseAnthroDaily('scripts/weianthro.txt', 'girls', [0, 60]),
  lengthForAge: parseAnthroDaily('scripts/lenanthro.txt', 'girls', [0, 24]),
  heightForAge: parseAnthroDaily('scripts/lenanthro.txt', 'girls', [24, 60]),
  weightForLength: parseAnthroByMeasure('scripts/wflanthro.txt', 'girls', 'length'),
  weightForHeight: parseAnthroByMeasure('scripts/wfhanthro.txt', 'girls', 'height'),
  bmiForAge: parseAnthroDaily('scripts/bmianthro.txt', 'girls', [0, 60]),
  headCircForAge: parseAnthroDaily('scripts/hcanthro.txt', 'girls', [0, 60]),
}

// ─── For 5-19 years, use WHO Growth Reference 2007 expanded z-score tables ───
const who5to19 = JSON.parse(readFileSync('scripts/who5to19.json', 'utf-8'))

boys.heightForAge = [...boys.heightForAge, ...who5to19.boysHFA]
girls.heightForAge = [...girls.heightForAge, ...who5to19.girlsHFA]
boys.bmiForAge = [...boys.bmiForAge, ...who5to19.boysBMI]
girls.bmiForAge = [...girls.bmiForAge, ...who5to19.girlsBMI]

// ─── Verify key data points ───
console.log('\n=== Verification ===')
const bwfl75 = boys.weightForLength.find(d => d.length === 75)
console.log('Boys WFL at 75cm:', JSON.stringify(bwfl75))
console.log('  Expected median ~9.5 kg')

const bwfa12 = boys.weightForAge.find(d => d.month === 12)
console.log('Boys WFA at 12mo:', JSON.stringify(bwfa12))
console.log('  Expected median ~9.6 kg')

const blfa12 = boys.lengthForAge.find(d => d.month === 12)
console.log('Boys LFA at 12mo:', JSON.stringify(blfa12))
console.log('  Expected median ~75.7 cm')

const bbmi12 = boys.bmiForAge.find(d => d.month === 12)
console.log('Boys BMI at 12mo:', JSON.stringify(bbmi12))
console.log('  Expected median ~17.2-17.5')

const bhc12 = boys.headCircForAge.find(d => d.month === 12)
console.log('Boys HC at 12mo:', JSON.stringify(bhc12))
console.log('  Expected median ~46.1 cm')

const gwfl75 = girls.weightForLength.find(d => d.length === 75)
console.log('Girls WFL at 75cm:', JSON.stringify(gwfl75))
console.log('  Expected median ~9.1 kg')

// ─── Counts ───
console.log('\n=== Data counts ===')
for (const [key, arr] of Object.entries(boys)) {
  console.log(`boys.${key}: ${arr.length} entries`)
}
for (const [key, arr] of Object.entries(girls)) {
  console.log(`girls.${key}: ${arr.length} entries`)
}

// ─── Generate output file ───
function arrToString(arr) {
  return '[\n    ' + arr.map(d => JSON.stringify(d)).join(',\n    ') + ',\n    ]'
}

const output = `// WHO Child Growth Standards z-score reference data
// Source: WHO Multicentre Growth Reference Study Group (official LMS tables)
// Generated from official WHO/CDC LMS parameters
// 0-60 months: WHO Child Growth Standards
// 61-228 months: WHO Growth Reference 2007
// Each object contains: neg3 (-3 SD), neg2 (-2 SD), neg1 (-1 SD), median (0), pos1 (+1 SD), pos2 (+2 SD), pos3 (+3 SD)

export const whoData = {
  boys: {
    weightForAge: ${arrToString(boys.weightForAge)},
    lengthForAge: ${arrToString(boys.lengthForAge)},
    heightForAge: ${arrToString(boys.heightForAge)},
    weightForLength: ${arrToString(boys.weightForLength)},
    weightForHeight: ${arrToString(boys.weightForHeight)},
    bmiForAge: ${arrToString(boys.bmiForAge)},
    headCircForAge: ${arrToString(boys.headCircForAge)},
  },
  girls: {
    weightForAge: ${arrToString(girls.weightForAge)},
    lengthForAge: ${arrToString(girls.lengthForAge)},
    heightForAge: ${arrToString(girls.heightForAge)},
    weightForLength: ${arrToString(girls.weightForLength)},
    weightForHeight: ${arrToString(girls.weightForHeight)},
    bmiForAge: ${arrToString(girls.bmiForAge)},
    headCircForAge: ${arrToString(girls.headCircForAge)},
  },
}
`

writeFileSync('src/data/whoGrowthData.js', output)
console.log('\n✓ Written to src/data/whoGrowthData.js')
