const CACHE_TTL_MS = 5 * 60 * 1000
const MAX_CONCURRENT = 4

importScripts("diffstat.js")

let active = 0
const queue = []

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "diffstat") return
  statsFor(msg.path)
    .then((stats) => sendResponse({ ok: true, stats }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }))
  return true
})

async function statsFor(path) {
  const key = `diffstat:${path}`
  const cached = (await chrome.storage.session.get(key))[key]
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.stats

  const stats = await throttled(() => fetchStats(path))
  await chrome.storage.session.set({ [key]: { at: Date.now(), stats } })
  return stats
}

async function fetchStats(path) {
  const res = await fetch(`https://github.com${path}.diff`, { credentials: "include" })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}.diff`)
  return Diffstat.count(await res.text())
}

function throttled(task) {
  return new Promise((resolve, reject) => {
    queue.push({ task, resolve, reject })
    drain()
  })
}

function drain() {
  while (active < MAX_CONCURRENT && queue.length) {
    const { task, resolve, reject } = queue.shift()
    active++
    task().then(resolve, reject).finally(() => {
      active--
      drain()
    })
  }
}
