// Small Levenberg-Marquardt least-squares solver (numerical Jacobian). No dependencies.
export function lm(resFn, p0, { iters = 200, lambda0 = 1e-2, h = 1e-6, tol = 1e-12, lo = null, hi = null } = {}) {
  let p = p0.slice()
  const proj = (q) => q.map((v, i) => Math.min(hi ? hi[i] : Infinity, Math.max(lo ? lo[i] : -Infinity, v)))
  p = proj(p)
  let r = resFn(p), cost = r.reduce((a, v) => a + v * v, 0), lambda = lambda0
  const n = p.length
  for (let it = 0; it < iters; it++) {
    const m = r.length
    const J = Array.from({ length: m }, () => new Float64Array(n))
    for (let j = 0; j < n; j++) {
      const q = p.slice(); const d = h * Math.max(1, Math.abs(p[j])); q[j] += d
      const rq = resFn(q)
      for (let i = 0; i < m; i++) J[i][j] = (rq[i] - r[i]) / d
    }
    const A = Array.from({ length: n }, () => new Float64Array(n)), g = new Float64Array(n)
    for (let i = 0; i < m; i++) for (let a = 0; a < n; a++) { if (!J[i][a]) continue; g[a] += J[i][a] * r[i]; for (let b = 0; b < n; b++) A[a][b] += J[i][a] * J[i][b] }
    let improved = false
    for (let tries = 0; tries < 12; tries++) {
      const M = A.map((row, a) => { const c = Array.from(row); c[a] += lambda * (A[a][a] + 1e-9); return c })
      const step = solve(M, Array.from(g).map(v => -v))
      if (!step) { lambda *= 10; continue }
      const q = proj(p.map((v, j) => v + step[j]))
      const rq = resFn(q), cq = rq.reduce((a, v) => a + v * v, 0)
      if (Number.isFinite(cq) && cq < cost) {
        const rel = (cost - cq) / (cost + 1e-30)
        p = q; r = rq; cost = cq; lambda = Math.max(1e-12, lambda / 3); improved = true
        if (rel < tol) return { p, cost, r }
        break
      }
      lambda *= 8
    }
    if (!improved) break
  }
  return { p, cost, r }
}

function solve(M, b) {
  const n = b.length, A = M.map((row, i) => [...row, b[i]])
  for (let c = 0; c < n; c++) {
    let piv = c
    for (let i = c + 1; i < n; i++) if (Math.abs(A[i][c]) > Math.abs(A[piv][c])) piv = i
    if (Math.abs(A[piv][c]) < 1e-300) return null
    ;[A[c], A[piv]] = [A[piv], A[c]]
    for (let i = c + 1; i < n; i++) { const f = A[i][c] / A[c][c]; if (!f) continue; for (let k = c; k <= n; k++) A[i][k] -= f * A[c][k] }
  }
  const x = new Array(n)
  for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = s / A[i][i] }
  return x
}

// LM with a caller-supplied Jacobian: jac(p, r) → array of rows (Float64Array per residual).
// Optional bounds lo/hi per parameter.
export function lmJ(resFn, jacFn, p0, { iters = 200, lambda0 = 1e-2, tol = 1e-10, lo = null, hi = null, log = null } = {}) {
  const proj = (q) => q.map((v, i) => Math.min(hi ? hi[i] : Infinity, Math.max(lo ? lo[i] : -Infinity, v)))
  let p = proj(p0.slice()), r = resFn(p), cost = r.reduce((a, v) => a + v * v, 0), lambda = lambda0
  const n = p.length
  for (let it = 0; it < iters; it++) {
    const J = jacFn(p, r), m = r.length
    const A = Array.from({ length: n }, () => new Float64Array(n)), g = new Float64Array(n)
    for (let i = 0; i < m; i++) {
      const row = J[i], nz = []
      for (let a = 0; a < n; a++) if (row[a]) nz.push(a)
      for (const a of nz) { g[a] += row[a] * r[i]; for (const b of nz) A[a][b] += row[a] * row[b] }
    }
    let improved = false
    for (let tries = 0; tries < 14; tries++) {
      const M = A.map((row, a) => { const c = Array.from(row); c[a] += lambda * (A[a][a] + 1e-9) + 1e-12; return c })
      const step = solve(M, Array.from(g).map(v => -v))
      if (!step) { lambda *= 10; continue }
      const q = proj(p.map((v, j) => v + step[j]))
      const rq = resFn(q), cq = rq.reduce((a, v) => a + v * v, 0)
      if (Number.isFinite(cq) && cq < cost) {
        const rel = (cost - cq) / (cost + 1e-30)
        p = q; r = rq; cost = cq; lambda = Math.max(1e-12, lambda / 3); improved = true
        if (log && it % 10 === 0) log(it, cost)
        if (rel < tol) return { p, cost, r }
        break
      }
      lambda *= 8
    }
    if (!improved) break
  }
  return { p, cost, r }
}
