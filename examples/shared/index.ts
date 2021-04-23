
export interface Actions {
  getData: {
    response: { count: number }
  },
  getDataWithParams: {
    request: { num: number }
    response: { count: number }
  }
}
