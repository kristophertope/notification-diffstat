const PR_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+/
const DONE = "data-gh-diffstat"

function onNotificationsPage() {
  return location.pathname.startsWith("/notifications")
}

function scan() {
  if (!onNotificationsPage()) return
  for (const link of document.querySelectorAll('a[href*="/pull/"]')) {
    const path = prPath(link)
    const row = link.closest("li")
    if (!path || !row || row.hasAttribute(DONE)) continue
    row.setAttribute(DONE, "")
    decorate(link, path)
  }
}

function prPath(link) {
  const url = new URL(link.getAttribute("href"), location.origin)
  if (url.origin !== location.origin) return null
  return url.pathname.match(PR_PATH)?.[0] ?? null
}

async function decorate(link, path) {
  // Sits right after "owner/repo #123" on the title's top line.
  const repoLine = link.querySelector("p.f6")
  if (!repoLine) return

  const badge = document.createElement("span")
  badge.className = "gh-diffstat gh-diffstat--loading"
  badge.textContent = "…"
  repoLine.append(badge)

  const res = await chrome.runtime.sendMessage({ type: "diffstat", path })
  if (res?.ok) render(badge, res.stats)
  else fail(badge, res?.error ?? "no response")
}

function render(badge, stats) {
  const { added, deleted, neutral } = Diffstat.blocks(stats)
  badge.className = "gh-diffstat"
  badge.title = `${stats.additions} additions, ${stats.deletions} deletions`
  badge.replaceChildren(
    span("gh-diffstat__add", `+${stats.additions}`),
    span("gh-diffstat__del", `−${stats.deletions}`),
    ...repeat(added, "gh-diffstat__block gh-diffstat__block--add"),
    ...repeat(deleted, "gh-diffstat__block gh-diffstat__block--del"),
    ...repeat(neutral, "gh-diffstat__block")
  )
}

function fail(badge, error) {
  badge.className = "gh-diffstat gh-diffstat--error"
  badge.textContent = "diff ?"
  badge.title = error
}

function span(className, text = "") {
  const el = document.createElement("span")
  el.className = className
  el.textContent = text
  return el
}

function repeat(n, className) {
  return Array.from({ length: n }, () => span(className))
}

let scheduled = false
function scheduleScan() {
  if (scheduled) return
  scheduled = true
  requestAnimationFrame(() => {
    scheduled = false
    scan()
  })
}

new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true })
scan()
