#!/usr/bin/env node
// 对比两个计算样式快照：node diff-styles.mjs <a名称> <b名称>（在 snapshots/ 目录下查找 <名称>.json）
// 只打印不同的项；完全一致时打印 "identical" 并以 0 退出，有差异时以 1 退出。
import fs from 'node:fs'

const [a, b] = process.argv.slice(2)
if (!a || !b) {
  console.error('Usage: node diff-styles.mjs <snapshotA> <snapshotB>')
  process.exit(2)
}
const load = (name) => JSON.parse(fs.readFileSync(new URL(`./snapshots/${name}.json`, import.meta.url), 'utf8'))
const A = load(a)
const B = load(b)

const diffs = []
for (const key of new Set([...Object.keys(A.vars), ...Object.keys(B.vars)])) {
  if (A.vars[key] !== B.vars[key]) diffs.push(`var ${key}: ${A.vars[key]} -> ${B.vars[key]}`)
}
for (const sel of new Set([...Object.keys(A.el), ...Object.keys(B.el)])) {
  if (!A.el[sel] || !B.el[sel]) {
    diffs.push(`${sel}: ${A.el[sel] ? 'present' : 'missing'} -> ${B.el[sel] ? 'present' : 'missing'}`)
    continue
  }
  for (const prop of Object.keys(A.el[sel])) {
    if (A.el[sel][prop] !== B.el[sel][prop]) diffs.push(`${sel} { ${prop}: ${A.el[sel][prop]} -> ${B.el[sel][prop]} }`)
  }
}

if (diffs.length === 0) {
  console.log('identical')
} else {
  console.log(diffs.join('\n'))
  process.exit(1)
}
