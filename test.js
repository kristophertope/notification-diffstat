// Run with: node test.js
const assert = require("node:assert")
const { count, blocks } = require("./diffstat.js")

const diff = [
  "diff --git a/a.rb b/a.rb",
  "index 1..2 100644",
  "--- a/a.rb",
  "+++ b/a.rb",
  "@@ -1,3 +1,3 @@",
  " context",
  "-old",
  "--- removed line that starts with dashes",
  "+new",
  "+++ added line that starts with pluses",
  "\\ No newline at end of file",
  "diff --git a/img.png b/img.png",
  "Binary files a/img.png and b/img.png differ",
  ""
].join("\n")

assert.deepStrictEqual(count(diff), { additions: 2, deletions: 2 })
assert.deepStrictEqual(blocks({ additions: 10, deletions: 53 }), { added: 0, deleted: 4, neutral: 1 })
assert.deepStrictEqual(blocks({ additions: 0, deletions: 0 }), { added: 0, deleted: 0, neutral: 5 })
assert.deepStrictEqual(blocks({ additions: 24, deletions: 0 }), { added: 5, deleted: 0, neutral: 0 })
assert.deepStrictEqual(blocks({ additions: 12, deletions: 14 }), { added: 2, deleted: 2, neutral: 1 })
console.log("ok")
