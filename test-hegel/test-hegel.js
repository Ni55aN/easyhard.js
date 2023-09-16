// type List = {
//   a: string;
//   b: boolean;
// }

// type Keys = 'a' | 'b';


// type A = (...args: Array<unknown>) => number
// type B8 = <K: Keys = Keys>(tag: K) => $PropertyType<List, 'a'> | $PropertyType<List, 'b'>

// const b8: B8 = (() => '3')
// // const n: $PropertyType<List, 'b'> = true

// // const case8: A = b8



type Admin = { name: string, age: number };
const propertyOf = <O: Object, K: $Keys<O>>(obj: O, key: K): $PropertyType<O, K> => obj[key];
const admin: Admin = { name: "Maurice Moss", age: 33 };
// Type of "age" variable is "number"
const age = propertyOf(admin, "age");

