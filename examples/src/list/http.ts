import { h, $, $$, $for } from 'easyhard';
import { map, tap } from 'rxjs/operators';
import { Observable} from 'rxjs';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
}

function fromFetch<T>(url: Observable<string>) {
  return new Observable<T>((observer) => {
    return url.subscribe({
      async next(url) {
        const resp = await fetch(url);
        const data = await resp.json();
  
        observer.next(data);
      },
      complete() {}
    });
  });
}

function UsersList(users: User[]) {
  return $for($$(users), map(item => h('div', {}, item.email)));
}

function App() {
  const page = $(1);
  const url = page.pipe(map(p => 'https://reqres.in/api/users?page='+p));
  const response = fromFetch<{ data: User[] }>(url).pipe(map(data => data.data));

  return h('div', {},
    h('button', { click() { page.next(page.value + 1)}}, 'Next page'),
    response.pipe(tap(console.log), map(UsersList))
  );
}

document.body.appendChild(App());