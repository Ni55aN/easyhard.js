import Sum from './sum';
import Timer from './timer';
import List from './list';
import Lifecycle from './lifecycle';
import Todolist from './todo-list';
import DI from './di';

const App = ({
  '#sum': Sum,
  '#timer': Timer,
  '#list': List,
  '#lifecycle': Lifecycle,
  '#todolist': Todolist,
  '#di': DI,
  '': Sum
} as {[key: string]: typeof Sum})[location.hash];

const app = App();

document.body.appendChild(app);