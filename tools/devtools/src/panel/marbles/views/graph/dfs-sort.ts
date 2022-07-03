function dfsTopSortHelper(getParents: (id: string) => string[], v: string, n: number, visited: {[key: string]: boolean}, topNums: {[key: string]: number}) {
  visited[v] = true
  const neighbors = getParents(v)

  for (const neighbor of neighbors) {
    if (!visited[neighbor]) {
      n = dfsTopSortHelper(getParents, neighbor, n, visited, topNums)
    }
  }
  topNums[v] = n
  return n - 1
}

export function dfsTopSort(getNodes: () => string[], getParents:  (id: string) => string[]): {[key: string]: number} {
  const vertices = getNodes()
  const visited: {[key: string]: boolean} = {}
  const topNums = {}
  let n = vertices.length - 1
  for (const v of vertices) {
    if (!visited[v]) {
      n = dfsTopSortHelper(getParents, v, n, visited, topNums)
    }
  }
  return topNums
}
