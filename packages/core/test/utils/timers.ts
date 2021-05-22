export async function waitAnimationFrame(): Promise<void> {
  return new Promise((res) => {
    requestAnimationFrame(() => res())
  })
}

export async function delay(ms: number): Promise<void> {
  return new Promise((res) => {
    setTimeout(() => res(), ms)
  })
}