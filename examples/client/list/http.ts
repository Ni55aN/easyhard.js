/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { h, $, $for } from 'easyhard'
import { map, tap, mergeMap, mapTo, scan } from 'rxjs/operators'
import { BehaviorSubject, Observable, of, OperatorFunction, pipe, Subject } from 'rxjs'
import { $$, $$Return, getCollectionItemId, getUID } from 'easyhard-common'

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  avatar: string;
}

// const load = <T>(init?: RequestInit): OperatorFunction<RequestInfo, T> => pipe(
//   mergeMap(url => fetch(url, init)),
//   mergeMap(resp => resp.json())
// )

// function UsersList(users: User[]) {
//   return $for($$(users), map(item => h('div', {}, item.email)))
// }

// function App() {
//   const page = $(1)
//   const url = page.pipe(map(p => `https://reqres.in/api/users?page=${p}`))
//   const response = url.pipe(load<{ data: User[] }>(), map(data => data.data))

//   return h('div', {},
//     h('button', { click: tap(() => page.next(page.value + 1)) }, 'Next page'),
//     response.pipe(tap(console.log), map(UsersList))
//   )
// }

function App() {
  const users: User[] = [
    {
      'id': 1,
      'email': 'george.bluth@reqres.in',
      'first_name': 'George',
      'last_name': 'Bluth',
      'avatar': 'https://reqres.in/img/faces/1-image.jpg'
    },
    {
      'id': 2,
      'email': 'janet.weaver@reqres.in',
      'first_name': 'Janet',
      'last_name': 'Weaver',
      'avatar': 'https://reqres.in/img/faces/2-image.jpg'
    },
    {
      'id': 3,
      'email': 'emma.wong@reqres.in',
      'first_name': 'Emma',
      'last_name': 'Wong',
      'avatar': 'https://reqres.in/img/faces/3-image.jpg'
    },
    {
      'id': 4,
      'email': 'eve.holt@reqres.in',
      'first_name': 'Eve',
      'last_name': 'Holt',
      'avatar': 'https://reqres.in/img/faces/4-image.jpg'
    },
    {
      'id': 5,
      'email': 'charles.morris@reqres.in',
      'first_name': 'Charles',
      'last_name': 'Morris',
      'avatar': 'https://reqres.in/img/faces/5-image.jpg'
    },
    {
      'id': 6,
      'email': 'tracey.ramos@reqres.in',
      'first_name': 'Tracey',
      'last_name': 'Ramos',
      'avatar': 'https://reqres.in/img/faces/6-image.jpg'
    }
  ]
  const list = $$<User>([])
  // const b = pipe(tap(() => 3), mapTo(56), map(v => '57'))

  // console.log({ b })
  const m = map<string, HTMLElement>(v => h('b', {}, v, v))

  setTimeout(() => {
    list.next({ insert: true, item: users[0] })
    list.next({ insert: true, item: users[1] })
    list.next({ insert: true, item: users[2] })
  }, 2040)
  setTimeout(() => {
    list.next({ insert: true, item: users[3] })
  }, 4000)
  setTimeout(() => {
    list.complete()
  }, 6000)

  const s4 = $('4')

  return h('div', {},
    // of(true).pipe(map(() => 456), b, mergeMap(() => of(null).pipe(mapTo(45)))).pipe(tap(console.log))
    $for(list, item => item.email),
    // $for(list, item => {
    //   const email = item.email

    //   return $(true).pipe(map(() => h('p', {}, email)))
    // })
    // $('1').pipe(m),
    // $('2').pipe(m),
    // $('3').pipe(m),
    // s4.pipe(m),
    // s4.pipe(m),
    // s4.pipe(m)
  )
}

document.body.appendChild(App())

