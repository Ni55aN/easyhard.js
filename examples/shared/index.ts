
export interface Actions {
  getData: {
    response: { count: number }
  },
  getDataWithParams: {
    request: { num: number }
    response: { count: string }
  },
  getDataError: {
    response: { count: number }
  }
}

export interface ActionsUpload {
  upload: {
    request: { filename: string, numberOfChunks: number, index: number, chunk: string }
    response: boolean
  }
}
