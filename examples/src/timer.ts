import { h, $ } from 'easyhard';

export default function(container: HTMLElement) {
  const count = new $(30);

  const interval = setInterval(() => {
    const next = count.value - 1;

    if (next < 0) return clearInterval(interval);

    count.next(next);
  }, 1000);

  container.appendChild(
    h('div', {}, count)
  );
}