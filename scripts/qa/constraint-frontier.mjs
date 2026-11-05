/**
 * Exact enumeration of all mine layouts compatible with currently visible clues
 * and total mine count. Uses no underlying cell.mine positions.
 *
 * Returns:
 * - forced: at least one provably safe cell / certain mine
 * - guess-required: NO certain hidden cell, all feasible global configurations
 *   enumerated (the current state offers no zero-risk logical move)
 * - inconclusive: component too large / search cap reached (never call guess)
 *
 * Test-only. Not referenced by game logic or Android builds.
 */
export function analyzeExactFrontier(board, { maxVariables = 23, maxSearchNodes = 250000 } = {}) {
  const hidden = []
  let flags = 0
  for (let id = 0; id < board.cells.length; id++) {
    const c = board.cells[id]
    if (c.quarantined) flags++
    else if (!c.revealed) hidden.push(id)
  }
  const remainingMines = board.mineCount - flags
  if (remainingMines < 0 || remainingMines > hidden.length) throw Error('Invalid global remaining mines')
  const equations = []
  const frontierSet = new Set()
  for (const c of board.cells) {
    if (!c.revealed || c.mine) continue
    const vars = []
    let flagged = 0
    for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue
      const row = c.row + dr
      const col = c.col + dc
      if (row < 0 || col < 0 || row >= board.rows || col >= board.cols) continue
      const id = row * board.cols + col
      const neighbor = board.cells[id]
      if (neighbor.quarantined) flagged++
      else if (!neighbor.revealed) vars.push(id)
    }
    const count = c.adjacent - flagged
    if (count < 0 || count > vars.length) throw Error('Inconsistent visible clues')
    if (!vars.length) {
      if (count !== 0) throw Error('Inconsistent completed clue')
      continue
    }
    vars.sort((a, b) => a - b)
    equations.push({ vars, count })
    for (const id of vars) frontierSet.add(id)
  }
  const frontier = [...frontierSet].sort((a, b) => a - b)
  const outside = hidden.filter(id => !frontierSet.has(id))
  const parent = new Map(frontier.map(id => [id, id]))
  function find(id) {
    let current = id
    while (parent.get(current) !== current) current = parent.get(current)
    return current
  }
  function unite(a, b) {
    const rootA = find(a), rootB = find(b)
    if (rootA !== rootB) parent.set(rootB, rootA)
  }
  for (const eq of equations) for (const id of eq.vars.slice(1)) unite(eq.vars[0], id)
  const groups = new Map()
  for (const id of frontier) {
    const root = find(id)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root).push(id)
  }

  const components = []
  let searchNodes = 0
  for (const ids of groups.values()) {
    if (ids.length > maxVariables) {
      return { status: 'inconclusive', reason: 'component-size', components: groups.size,
        maxComponent: ids.length, searchNodes, safe: new Set(), mines: new Set() }
    }
    const at = new Map(ids.map((id, index) => [id, index]))
    const constraints = equations.filter(eq => at.has(eq.vars[0])).map(eq => ({
      vars: eq.vars.map(id => at.get(id)),
      count: eq.count,
      assigned: 0,
      unassigned: eq.vars.length,
    }))
    const touched = ids.map(() => [])
    for (let k = 0; k < constraints.length; k++) {
      for (const id of constraints[k].vars) touched[id].push(k)
    }
    const order = ids.map((_, index) => index).sort((a, b) => touched[b].length - touched[a].length)
    const values = new Int8Array(ids.length)
    const buckets = new Map()
    let cutoff = false
    function dfs(depth, mines) {
      searchNodes++
      if (searchNodes > maxSearchNodes) { cutoff = true; return }
      if (depth === ids.length) {
        for (const constraint of constraints) if (constraint.assigned !== constraint.count) return
        if (!buckets.has(mines)) buckets.set(mines, { solutions: 0, mined: new Array(ids.length).fill(0) })
        const bucket = buckets.get(mines)
        bucket.solutions++
        for (let j = 0; j < ids.length; j++) if (values[j]) bucket.mined[j]++
        return
      }
      const variable = order[depth]
      for (const value of [0, 1]) {
        values[variable] = value
        let valid = true
        for (const equationIndex of touched[variable]) {
          const e = constraints[equationIndex]
          e.assigned += value
          e.unassigned--
          if (e.assigned > e.count || e.assigned + e.unassigned < e.count) valid = false
        }
        if (valid) dfs(depth + 1, mines + value)
        for (const equationIndex of touched[variable]) {
          const e = constraints[equationIndex]
          e.assigned -= value
          e.unassigned++
        }
        if (cutoff) return
      }
    }
    dfs(0, 0)
    if (cutoff) return { status: 'inconclusive', reason: 'search-limit', components: groups.size,
      maxComponent: ids.length, searchNodes, safe: new Set(), mines: new Set() }
    if (!buckets.size) throw Error('No consistent component assignments')
    components.push({ ids, buckets })
  }

  // Prefix / suffix possible mine totals across independent components.
  const prefix = [new Set([0])]
  for (const c of components) {
    const next = new Set()
    for (const a of prefix.at(-1)) for (const b of c.buckets.keys()) next.add(a + b)
    prefix.push(next)
  }
  const suffix = Array(components.length + 1)
  suffix[components.length] = new Set([0])
  for (let i = components.length - 1; i >= 0; i--) {
    const next = new Set()
    for (const a of suffix[i + 1]) for (const b of components[i].buckets.keys()) next.add(a + b)
    suffix[i] = next
  }
  const fitsGlobal = total => total <= remainingMines && remainingMines - total <= outside.length
  const feasibleTotals = [...prefix.at(-1)].filter(fitsGlobal)
  if (!feasibleTotals.length) throw Error('No globally consistent mine assignments')

  const safe = new Set()
  const mines = new Set()
  for (let i = 0; i < components.length; i++) {
    const c = components[i]
    const validBuckets = []
    for (const [count, bucket] of c.buckets) {
      let possible = false
      for (const left of prefix[i]) {
        for (const right of suffix[i + 1]) {
          if (fitsGlobal(left + count + right)) { possible = true; break }
        }
        if (possible) break
      }
      if (possible) validBuckets.push(bucket)
    }
    if (!validBuckets.length) throw Error('Unreachable component')
    for (let j = 0; j < c.ids.length; j++) {
      const alwaysMine = validBuckets.every(bucket => bucket.mined[j] === bucket.solutions)
      const alwaysSafe = validBuckets.every(bucket => bucket.mined[j] === 0)
      if (alwaysMine) mines.add(c.ids[j])
      if (alwaysSafe) safe.add(c.ids[j])
    }
  }
  const allowedOutside = feasibleTotals.map(total => remainingMines - total)
  if (allowedOutside.every(count => count === 0)) for (const id of outside) safe.add(id)
  if (allowedOutside.every(count => count === outside.length)) for (const id of outside) mines.add(id)
  for (const id of safe) if (mines.has(id)) throw Error('Conflicting exact deductions')
  return { status: safe.size || mines.size ? 'forced' : 'guess-required', safe, mines,
    components: components.length, maxComponent: Math.max(0, ...components.map(c => c.ids.length)),
    searchNodes, hidden: hidden.length, outside: outside.length }
}
