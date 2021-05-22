
type Unit = 'cm' | 'mm' | 'in' | 'px' | 'pt' | 'pc' | 'em' | 'ex' | 'ch' | 'rem' | 'vw' | 'vh' | 'vmin' | 'vmax' | '%'

export function unit(unit: Unit) {
  return function(value: number): string {
    return `${value}${unit}`
  }
}
