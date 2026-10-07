// Shared by background.js and the Node test. Pure functions, no chrome APIs.
var ReviewRequests = (() => {
  // `user-review-requested` matches requests made to you by name and leaves
  // out requests made to a team you're on. GitHub clears the request once
  // you submit a review.
  const QUERY = "is:pr is:open user-review-requested:@me"

  function searchUrl(page) {
    return `https://github.com/search?type=pullrequests&p=${page}&q=${encodeURIComponent(QUERY)}`
  }

  // Parses the JSON that github.com/search returns for an Accept:
  // application/json request into lowercase "/owner/repo/pull/123" paths.
  function parse(json) {
    const search = json?.payload?.blackbirdSearchRoute
    if (!search) throw new Error("unexpected search response")
    if (!search.logged_in) throw new Error("not signed in to GitHub")
    const paths = search.results.map(({ repo, number }) => {
      const { owner_login, name } = repo.repository
      return `/${owner_login}/${name}/pull/${number}`.toLowerCase()
    })
    return { paths, pageCount: search.page_count }
  }

  return { searchUrl, parse }
})()

if (typeof module !== "undefined") module.exports = ReviewRequests
