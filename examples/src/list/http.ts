import { h, $, $$, $for } from 'easyhard';
import { map, tap, mergeMap } from 'rxjs/operators';
import { OperatorFunction, pipe } from 'rxjs';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

const load = <T>(init?: RequestInit): OperatorFunction<RequestInfo, T> => pipe(
  mergeMap(url => fetch(url, init)),
  mergeMap(resp => resp.json())
);

function UsersList(users: User[]) {
  return $for($$(users), map(item => h('div', {}, item.email)));
}

function App() {
  const page = $(1);
  const url = page.pipe(map(p => 'https://reqres.in/api/users?page='+p));
  const response = url.pipe(load<{ data: User[] }>(), map(data => data.data));

  return h('div', {},
    h('button', { click() { page.next(page.value + 1)}}, 'Next page'),
    response.pipe(tap(console.log), map(UsersList))
  );
}

document.body.appendChild(App());