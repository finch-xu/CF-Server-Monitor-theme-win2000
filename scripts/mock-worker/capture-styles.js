// 采集关键元素的计算样式，POST 给模拟 Worker 存为 snapshots/<名称>.json。
// 在浏览器中（javascript_tool）执行下面一行即可，返回 { saved, count }：
//   window.__SNAP_NAME = 'base-dark-cards'; await eval(await (await fetch('http://localhost:8787/__capture.js')).text())
(async () => {
  const NAME = window.__SNAP_NAME
  const SELECTORS = [
    'body', '.app-window', '.app-window > .title-bar', '.title-bar-text', '.title-btn', '.toolbar', '.tool-btn', '.tool-btn.active',
    '.tabs', '.tab', '.tab.active', '.tab-panel', '.groupbox', '.groupbox > legend', '.progress', '.progress-fill',
    '.server-card', '.server-card .title-bar', '.server-card .title-bar.inactive', '.card-status', '.badge', '.sunken',
    '.listview .col-head', '.listview td', '.status-bar', '.status-field', '.btn', '.graph', '.chart-box', '.filter-menu'
  ]
  const PROPS = ['background-color', 'background-image', 'color', 'border-top', 'border-right', 'border-bottom', 'border-left',
    'border-radius', 'box-shadow', 'outline', 'padding', 'margin', 'height', 'font-family', 'font-size', 'font-weight', 'text-shadow']
  const vars = ['--desktop', '--face', '--text', '--bar', '--graph-bg', '--graph-grid', '--graph-axis']
  const out = { url: location.href, bodyClass: document.body.className, vars: {}, el: {} }
  const bs = getComputedStyle(document.body)
  for (const v of vars) out.vars[v] = bs.getPropertyValue(v).trim()
  for (const sel of SELECTORS) {
    const el = document.querySelector(sel)
    if (!el) continue
    const cs = getComputedStyle(el)
    out.el[sel] = Object.fromEntries(PROPS.map(p => [p, cs.getPropertyValue(p)]))
  }
  const res = await fetch(`http://localhost:8787/__save?name=${encodeURIComponent(NAME)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(out, null, 2)
  })
  return { saved: (await res.json()).saved, count: Object.keys(out.el).length }
})()
