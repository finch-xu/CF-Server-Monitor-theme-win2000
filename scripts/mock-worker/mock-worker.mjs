#!/usr/bin/env node
// 本地模拟 CF-Server-Monitor Worker，仅用于开发调试，不会被打包进 dist/（Vite 只打包 src/ 中被引用的代码）。
// vite.config.js 在没有 VITE_DEV_PROXY_TARGET 时把 /api、/flags、/os-icons 代理到 http://localhost:8787。
// 用法：npm run mock                    （端口 8787，数据随机生成；旗帜和系统图标返回 404，界面显示占位）
//      MOCK_STYLE=xp npm run mock        （模拟后台 theme_options.win2000_style）
import fs from 'node:fs'
import http from 'node:http'

const PORT = Number(process.env.PORT || 8787)
const MOCK_STYLE = process.env.MOCK_STYLE || ''

const now = () => Date.now()
const rand = (min, max) => min + Math.random() * (max - min)

const SERVERS = [
  { id: 'hk-01', name: 'HK-01 Edge', server_group: 'Asia', region: 'HK', os: 'Ubuntu 22.04', price: '30.00', currency: '¥', billing_cycle: 'month', expire_date: '2026-12-31', traffic_limit: '1TB', tags: 'prod,edge', online: true, gpu: true },
  { id: 'hk-02', name: 'HK-02 Backup', server_group: 'Asia', region: 'HK', os: 'Debian 12', price: '15.00', currency: '$', billing_cycle: 'month', expire_date: '2026-10-05', traffic_limit: '500GB', tags: 'backup', online: true },
  { id: 'jp-01', name: 'JP-Tokyo', server_group: 'Asia', region: 'JP', os: 'CentOS 7', price: '120.00', currency: '$', billing_cycle: 'year', expire_date: '2027-03-01', traffic_limit: '', tags: '', online: true },
  { id: 'sg-01', name: 'SG-Offline', server_group: 'Asia', region: 'SG', os: 'Alpine 3.19', price: '0', currency: '$', billing_cycle: 'month', expire_date: '', traffic_limit: '', tags: 'test', online: false },
  { id: 'us-01', name: 'US-LA-Main', server_group: 'America', region: 'US', os: 'Ubuntu 24.04', price: '5.00', currency: '$', billing_cycle: 'month', expire_date: '2026-09-30', traffic_limit: '2TB', tags: 'prod', online: true },
  { id: 'us-02', name: 'US-NY', server_group: 'America', region: 'US', os: 'Windows Server 2022', price: '9.99', currency: '$', billing_cycle: 'month', expire_date: '2026-11-11', traffic_limit: '', tags: '', online: true },
  { id: 'de-01', name: 'DE-Frankfurt', server_group: 'Europe', region: 'DE', os: 'Debian 11', price: '4.50', currency: '€', billing_cycle: 'month', expire_date: '2026-10-20', traffic_limit: '20TB', tags: 'cdn', online: true },
  { id: 'gb-01', name: 'GB-London', server_group: 'Europe', region: 'GB', os: 'Rocky Linux 9', price: '6.00', currency: '£', billing_cycle: 'month', expire_date: '2027-01-15', traffic_limit: '', tags: '', online: true },
  { id: 'fr-01', name: 'FR-Paris', server_group: 'Europe', region: 'FR', os: 'Arch Linux', price: '3.00', currency: '€', billing_cycle: 'month', expire_date: '2026-12-01', traffic_limit: '', tags: '', online: true },
  { id: 'kr-01', name: 'KR-Seoul', server_group: 'Asia', region: 'KR', os: 'Ubuntu 20.04', price: '8.00', currency: '$', billing_cycle: 'month', expire_date: '2026-10-10', traffic_limit: '', tags: '', online: true },
  { id: 'tw-01', name: 'TW-Taipei', server_group: 'Asia', region: 'TW', os: 'Debian 12', price: '10.00', currency: '$', billing_cycle: 'month', expire_date: '2026-10-25', traffic_limit: '', tags: '', online: true },
  { id: 'au-01', name: 'AU-Sydney', server_group: 'Oceania', region: 'AU', os: 'Ubuntu 22.04', price: '12.00', currency: '$', billing_cycle: 'month', expire_date: '2026-12-12', traffic_limit: '', tags: '', online: true }
]

const metrics = (s, ts = now()) => ({
  cpu: +rand(3, s.id === 'hk-01' ? 92 : 45).toFixed(2),
  load_avg: `${rand(0, 2).toFixed(2)} ${rand(0, 2).toFixed(2)} ${rand(0, 2).toFixed(2)}`,
  net_in_speed: Math.round(rand(1e3, 5e6)),
  net_out_speed: Math.round(rand(1e3, 2e6)),
  net_rx: 123456789012,
  net_tx: 98765432101,
  net_rx_monthly: Math.round(rand(1e10, 4e11)),
  net_tx_monthly: Math.round(rand(1e10, 2e11)),
  processes: Math.round(rand(120, 400)),
  tcp_conn: Math.round(rand(10, 300)),
  udp_conn: Math.round(rand(1, 30)),
  ping_ct: Math.round(rand(20, 80)), ping_cu: Math.round(rand(20, 90)), ping_cm: Math.round(rand(20, 100)), ping_bd: Math.round(rand(5, 40)),
  loss_ct: +rand(0, 2).toFixed(1), loss_cu: 0, loss_cm: +rand(0, 5).toFixed(1), loss_bd: 0,
  ram_total: 8192, ram_used: Math.round(rand(1500, 7600)),
  swap_total: 2048, swap_used: Math.round(rand(0, 600)),
  disk_total: 102400, disk_used: s.id === 'us-01' ? 90000 : Math.round(rand(10000, 70000)),
  disk: { read_bps: Math.round(rand(0, 5e6)), write_bps: Math.round(rand(0, 3e6)), read_iops: Math.round(rand(0, 200)), write_iops: Math.round(rand(0, 150)), await_ms: +rand(0.2, 8).toFixed(2), util: +rand(0, 60).toFixed(1) },
  gpu_info: s.gpu ? JSON.stringify([{ id: '0', name: 'NVIDIA RTX 3060', info: +rand(0, 90).toFixed(1), mem_used: Math.round(rand(500, 11000)), sm_clock: Math.round(rand(300, 1800)), power: Math.round(rand(20, 170)) }]) : '',
  last_updated: s.online ? ts : ts - 3 * 24 * 3600 * 1000,
  timestamp: s.online ? ts : ts - 3 * 24 * 3600 * 1000
})

const serverRecord = (s) => {
  const ts = now()
  const base = {
    id: s.id, name: s.name, server_group: s.server_group, tags: s.tags,
    price: s.price, billing_cycle: s.billing_cycle, auto_renewal: '0', currency: s.currency,
    expire_date: s.expire_date, traffic_limit: s.traffic_limit, traffic_calc_type: 'total', reset_day: 1,
    report_interval: 60, wss_report_interval: 2, is_hidden: '0', sort_order: 0,
    cpu_cores: 4, cpu_info: 'Intel Xeon E5-2680 v4', arch: 'x86_64', os: s.os,
    kernel_version: '6.8.0-36-generic', region: s.region, ip_v4: '1', ip_v6: s.id.startsWith('hk') ? '1' : '0',
    boot_time: String(ts - 12 * 24 * 3600 * 1000),
    latestReportUpdates: [],
    ...metrics(s, ts)
  }
  const windowPoints = Array.from({ length: 20 }, (_, i) => ({ ts: ts - (20 - i) * 6 * 60 * 1000, ct: Math.round(rand(20, 80)), cu: Math.round(rand(20, 90)), cm: Math.round(rand(20, 100)), bd: Math.round(rand(5, 40)) }))
  return { ...base, ping: windowPoints, loss: windowPoints.map(p => ({ ts: p.ts, ct: +rand(0, 3).toFixed(1), cu: 0, cm: +rand(0, 6).toFixed(1), bd: 0 })) }
}

const config = () => ({
  version: '2.7.12',
  last_workers_version: null,
  last_agent_version: null,
  is_public: true,
  authorization: false,
  turnstile_enabled: false,
  turnstile_login_enabled: false,
  turnstile_site_key: '',
  custom_ct_name: '电信', custom_cu_name: '联通', custom_cm_name: '移动', custom_bd_name: 'BGP',
  site_title: 'Mock Server Monitor',
  preferred_theme: 'auto',
  default_language: 'auto',
  theme_options: MOCK_STYLE ? { win2000_style: MOCK_STYLE } : {},
  verified: false,
  turnstile_verified: null,
  frontend_ws_timeout_minutes: 0,
  long_history_points: 120,
  latency_window: { points: 20, hours: 2 }
})

const serversPayload = () => {
  const servers = SERVERS.map(serverRecord)
  const regionStats = {}
  for (const s of servers) regionStats[s.region] = (regionStats[s.region] || 0) + 1
  const online = SERVERS.filter(s => s.online).length
  return {
    servers,
    stats: { total: servers.length, online, offline: servers.length - online, globalSpeedIn: 1234567, globalSpeedOut: 654321, globalNetTx: 987654321012, globalNetRx: 1234567890123 },
    regionStats,
    sysConfig: { show_price: true, show_expire: true, show_tf: true, show_three_net_details: true }
  }
}

const history = (s, hours) => {
  const end = now()
  const points = hours <= 1 ? 60 : 120
  const step = (hours * 3600 * 1000) / points
  return Array.from({ length: points }, (_, i) => {
    const m = metrics(s, end - (points - i) * step)
    return { ...m, timestamp: end - (points - i) * step }
  })
}

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' })
  res.end(JSON.stringify(body))
}

// 开发辅助：浏览器把计算样式快照 POST 到 http://localhost:8787/__save?name=<名称>（Content-Type: text/plain），
// 保存为 snapshots/<名称>.json，供 diff-styles.mjs 对比
const SNAPSHOT_DIR = new URL('./snapshots/', import.meta.url)
const saveSnapshot = (req, res, name) => {
  let body = ''
  req.on('data', chunk => { body += chunk })
  req.on('end', () => {
    if (!/^[\w.-]+$/.test(name)) return send(res, 400, { error: 'bad name' })
    fs.mkdirSync(SNAPSHOT_DIR, { recursive: true })
    fs.writeFileSync(new URL(`${name}.json`, SNAPSHOT_DIR), body)
    send(res, 200, { saved: name })
  })
}

http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  if (req.method === 'POST' && url.pathname === '/__save') return saveSnapshot(req, res, url.searchParams.get('name') || '')
  if (url.pathname === '/__capture.js') {
    res.writeHead(200, { 'Content-Type': 'text/javascript', 'Access-Control-Allow-Origin': '*' })
    return res.end(fs.readFileSync(new URL('./capture-styles.js', import.meta.url)))
  }
  const id = url.searchParams.get('id')
  const server = SERVERS.find(s => s.id === id)
  if (url.pathname === '/api/config') return send(res, 200, config())
  if (url.pathname === '/api/servers') return send(res, 200, serversPayload())
  if (url.pathname === '/api/server') {
    if (!server) return send(res, 404, { error: 'Server not found' })
    return send(res, 200, { ...serverRecord(server), sysConfig: { long_history_points: 120 } })
  }
  if (url.pathname === '/api/history/all') {
    if (!server) return send(res, 404, { error: 'Server not found' })
    const hours = Number(url.searchParams.get('hours') || 24)
    if (hours > 24) return send(res, 401, { error: 'Unauthorized' })
    return send(res, 200, history(server, hours))
  }
  // /flags、/os-icons 由真实 Worker 提供，这里返回 404，主题会显示文字占位
  return send(res, 404, { error: 'Not Found' })
}).listen(PORT, () => {
  console.log(`mock worker on http://localhost:${PORT}${MOCK_STYLE ? ` (win2000_style=${MOCK_STYLE})` : ''}`)
})
