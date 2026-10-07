// Shared by content.js and the Node test. Pure functions, no DOM or chrome APIs.
var Diffstat = (() => {
  const BLOCKS = 5

  // Count changed lines in a unified diff. Header lines between `diff --git`
  // and the first `@@` are skipped so `--- a/file` / `+++ b/file` don't count,
  // while a removed line whose content starts with `--` still does.
  function count(diffText) {
    let additions = 0
    let deletions = 0
    let inHunk = false
    for (const line of diffText.split("\n")) {
      if (line.startsWith("diff --git ")) inHunk = false
      else if (line.startsWith("@@")) inHunk = true
      else if (!inHunk) continue
      else if (line[0] === "+") additions++
      else if (line[0] === "-") deletions++
    }
    return { additions, deletions }
  }

  // Matches GitHub: +10 −53 renders 0 green, 4 red, 1 neutral.
  function blocks({ additions, deletions }) {
    const total = additions + deletions
    if (total === 0) return { added: 0, deleted: 0, neutral: BLOCKS }
    const added = Math.floor((additions / total) * BLOCKS)
    const deleted = Math.floor((deletions / total) * BLOCKS)
    return { added, deleted, neutral: BLOCKS - added - deleted }
  }

  return { count, blocks }
})()

if (typeof module !== "undefined") module.exports = Diffstat
