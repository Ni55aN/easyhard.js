import { h, compose, $, $provide, $inject } from 'easyhard';
import { map } from 'rxjs/operators';

interface Theme {
    font: string;
    bg: string;
}

function useTheme(): [Observable<Theme>, Function] {
    const nightMode = new $(false);
    const nightTheme: Theme = { font: 'white', bg: 'black' };
    const whiteScene: Theme = { font: 'grey', bg: '#eee' };
    const theme = nightMode.pipe(map(night => (night ? nightTheme : whiteScene)));

    return [theme, () => nightMode.next(!nightMode.value)];
}

function Button(text: string, click: Function) {
    const theme = new $<Theme | null>(null);
    const style = theme.pipe(map(th => th ? `background: ${th.bg}; color: ${th.font}` : ''));

    return compose(
    )
}

function Form(onSubmit: Function) {
    return Button('Click', onSubmit);
}

export default function() {
    const [theme, switchMode] = useTheme();

    return compose(
    )
}