export function toHyphenCase(text: string): string {
  return text.replace(/([A-Z])/g, '-$1').toLocaleLowerCase()
}
