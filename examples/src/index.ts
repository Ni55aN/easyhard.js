import Sum from './sum';
import Timer from './timer';
import List from './list';

const App = ({
  '#sum': Sum,
  '#timer': Timer,
  '#list': List,
  '': Sum
} as {[key: string]: typeof Sum})[location.hash];

const app = App();

document.body.appendChild(app);