const PR_PATH = /^\/[^/]+\/[^/]+\/pull\/\d+/
const PLUS_COUNT = /^\+\d+$/
const REASONS = [
  "review requested", "mention", "team mention", "author", "comment",
  "assigned", "subscribed", "state change", "ci activity", "manual",
  "security alert", "approval requested", "your activity"
]
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
    decorate(row, link, path)
  }
}

function prPath(link) {
  const url = new URL(link.getAttribute("href"), location.origin)
  if (url.origin !== location.origin) return null
  return url.pathname.match(PR_PATH)?.[0] ?? null
}

async function decorate(row, link, path) {
  const badge = document.createElement("span")
  badge.className = "gh-diffstat gh-diffstat--loading"
  badge.textContent = "…"
  place(row, link, badge)

  const res = await chrome.runtime.sendMessage({ type: "diffstat", path })
  if (res?.ok) render(badge, res.stats)
  else fail(badge, res?.error ?? "no response")
}

// Put the badge just before the "+N" column, else before the reason column,
// else after the title link.
function place(row, link, badge) {
  const anchor = findLeaf(row, (t) => PLUS_COUNT.test(t)) ??
    findLeaf(row, (t) => REASONS.includes(t.toLowerCase()))
  if (anchor) {
    const column = topmostSoleChild(anchor, row)
    column.parentElement.insertBefore(badge, column)
  } else {
    link.after(badge)
  }
}

function findLeaf(root, test) {
  for (const el of root.querySelectorAll("*")) {
    if (el.children.length === 0 && test(el.textContent.trim())) return el
  }
  return null
}

// Climb from el while it is its parent's only element child, so we insert
// next to the column wrapper rather than inside it.
function topmostSoleChild(el, stopAt) {
  while (el.parentElement && el.parentElement !== stopAt && el.parentElement.children.length === 1) {
    el = el.parentElement
  }
  return el
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
