import { h, compose, $, $provide, $inject } from 'easyhard';
import { map } from 'rxjs/operators';

function useTheme<T>() {
    const theme = new $<T | null>(null);

    return {
        theme,
        themeInjection: $inject(useTheme, theme),
        themeProvider: $provide(useTheme, theme)
    };
}

function useModeTheme<M, T>() {
    const { theme, themeInjection, themeProvider } = useTheme<T>();
    const themes = new Map<M, T>();
    const mode = new $<M | null>(null);

    return {
        theme,
        setTheme(id: M, t: T) {
            themes.set(id, t);
        },
        themeInjection: compose(themeInjection, $inject(useModeTheme, mode)),
        themeProvider: compose(themeProvider, $provide(useModeTheme, mode)),
        mode: mode.asObservable(),
        getMode() { return mode.value; },
        setMode(id: M) {
            const th = themes.get(id)

            if (th) {
                mode.next(id);
                theme.next(th);
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

    return compose(
        themeInjection,
        h('button', { style, click }, text, ' ', mode.pipe(map(m => m === Mode.DAY ? '[day]' : '[night]')))
    )
}

function Form(onSubmit: EventListener) {
    return h('form', {}, 
        Button('Click', onSubmit)
    );
}

function App() {
    const { setTheme, setMode, getMode, themeProvider } = useModeTheme<Mode, Theme>();

    setTheme(Mode.DAY, { font: 'grey', bg: 'white' });
    setTheme(Mode.NIGHT, { font: 'black', bg: 'grey' });
    setMode(Mode.NIGHT);

    return compose(
        themeProvider,
        Form(() => setMode(getMode() === Mode.DAY ? Mode.NIGHT : Mode.DAY))
    )
}

document.body.appendChild(App());