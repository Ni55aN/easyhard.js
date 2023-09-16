

let refA: WeakRef<any> | null = null
let refB: WeakRef<any> | null = null

function a() {
  const a = { a: 345 }
  const b = { a: 123 }

  refA = new WeakRef(a)
  refB = new WeakRef(b)
}

a()
const k = refB.deref()

setInterval(() => {
  console.log('k', k)
  console.log('a', refA.deref())
  console.log('b', refB.deref())
}, 500)
