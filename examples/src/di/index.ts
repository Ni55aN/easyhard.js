import { h, hc, $, $provide, $inject } from 'easyhard';
import { Observable } from 'rxjs';
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

    return hc(
        $inject(useTheme, theme),
        h('button', { style, click }, text)
    )
}

function Form(onSubmit: Function) {
    return Button('Click', onSubmit);
}

export default function() {
    const [theme, switchMode] = useTheme();

    return hc(
        $provide(useTheme, theme),
        Form(switchMode)
    )
}