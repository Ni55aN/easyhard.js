import Sum from './sum';
import Timer from './timer';
import List from './list';
import Lifecycle from './lifecycle';
import Todolist from './todo-list';

const App = ({
  '#sum': Sum,
  '#timer': Timer,
  '#list': List,
  '#lifecycle': Lifecycle,
  '#todolist': Todolist,
  '': Sum
} as {[key: string]: typeof Sum})[location.hash];

const app = App();

document.body.appendChild(app);