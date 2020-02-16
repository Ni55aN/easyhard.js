import { h, $, $provide, $inject } from 'easyhard';
import { map } from 'rxjs/operators';

function useTheme<T>() {
    const theme = new $<T | null>(null);

    return {
        theme,
        get themeInjection() { return $inject(useTheme, theme); },
        get themeProvider() { return $provide(useTheme, theme); }
    };
}

function useModeTheme<M, T>() {
    const basic = useTheme<T>();
    const themes = new Map<M, T>();
    const mode = new $<M | null>(null);

    return {
        theme: basic.theme,
        setTheme(id: M, t: T) {
            themes.set(id, t);
        },
        get themeInjection() { return [basic.themeInjection, $inject(useModeTheme, mode)] },
        get themeProvider() { return [basic.themeProvider, $provide(useModeTheme, mode)] },
        mode: mode.asObservable(),
        getMode() { return mode.value; },
        setMode(id: M) {
            const th = themes.get(id)

            if (th) {
                mode.next(id);
                basic.theme.next(th);
            }
        }
    }
}

interface Theme {
    font: string;
    bg: string;
}

enum Mode {
    DAY,
    NIGHT
}

function Button(text: string, click: EventListener) {
    const { theme, themeInjection, mode } = useModeTheme<Mode, Theme>();
    const style = theme.pipe(map(th => th ? `background: ${th.bg}; color: ${th.font}` : ''));

    return h('button', { style, click },
        themeInjection,
        text, ' ', mode.pipe(map(m => m === Mode.DAY ? '[day]' : '[night]'))
    )
}

function Form(onSubmit: EventListener) {
    return h('div', {}, 
        Button('Click', onSubmit)
    );
}

function App() {
    const { setTheme, setMode, getMode, themeProvider } = useModeTheme<Mode, Theme>();

    setTheme(Mode.DAY, { font: 'grey', bg: 'white' });
    setTheme(Mode.NIGHT, { font: 'black', bg: 'grey' });
    setMode(Mode.NIGHT);

    return h('div', {},
        themeProvider,
        Form(() => setMode(getMode() === Mode.DAY ? Mode.NIGHT : Mode.DAY))
    )
}

document.body.appendChild(App());