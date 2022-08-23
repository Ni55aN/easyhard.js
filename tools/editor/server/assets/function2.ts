function a(num: number) {
  function b(num: number) {
    // eslint-disable-next-line no-unused-vars
    function c(num: number) {
      return num
    }
    return c(num)
  }
  return b(num)
}

const d = a(32)

export {};
