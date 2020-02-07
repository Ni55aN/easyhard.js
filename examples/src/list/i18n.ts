import { h, compose, $, $provide, $inject, Child, Directive, $$, $for } from 'easyhard';
import { Observable, interval, of, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

type Dictionary = { [text: string]: { [locale: string]: string } };
type Text = string | Observable<string>;

function translate(value: Text, dictionary: Observable<Dictionary>, locale: Observable<string>): Observable<string> {
  const input = value instanceof Observable ? value : of(value);

  return combineLatest(input, dictionary, locale).pipe(
    map(([text, d, l]) => d && d[text] ? d[text][l] || text : text)
  );
}

interface TranslatorData {
  locale: $<string>;
  dictionary: $<Dictionary>
}

interface Translator {
  t: (text: Text) => Observable<string>;
  getLocale: () => string;
  setDictionary: (d: Dictionary) => void;
  setLocale: (locale: string) => void;
  injectTranslation: Directive;
  provideTranslation: Directive;
}

function useTranslation(): Translator {
  const parent: $<TranslatorData> = new $({
    locale: new $('en'),
    dictionary: new $<Dictionary>({})
  });
  const locale$ = parent.pipe(switchMap(m => m.locale));
  const dictionary$ = parent.pipe(switchMap(m => m.dictionary));

  const translator: Translator = {
    t: (text: Text) => translate(text, dictionary$, locale$),
    getLocale: () => parent.value.locale.value,
    setDictionary: (d: Dictionary) => parent.value.dictionary.next(d),
    setLocale: (val: string) => parent.value.locale.next(val),
    injectTranslation: $inject(useTranslation, parent),
    provideTranslation: $provide(useTranslation, parent)
  }

  return translator;
}


const dictionary: Dictionary = {
  'dictionary': {
    'ru': 'словарь',
    'ua': 'словник'
  },
  'first': {
    'ru': 'первый',
    'ua': 'перший'
  },
  'second': {
    'ru': 'второй',
    'ua': 'другий'
  },
  'click': {
    'ru': 'Нажми',
    'ua': 'Натисни'
  }
};

function Child() {
  const { t, injectTranslation, setLocale } = useTranslation();

  return compose(
    injectTranslation,
    h('u', { click() { setLocale('ua'); } }, t('dictionary'))
  )
}

function App() {
  const text = interval(1000).pipe(map(step => step % 2 === 0 ? 'first' : 'second'));
  const list = new $$(new Array(100).fill(null).map((_, i) => new $(i)));
  const { t, getLocale, setDictionary, setLocale, provideTranslation } = useTranslation();

  setDictionary(dictionary);

  return h('div', {},
    provideTranslation,
    h('button', { click: () => setLocale(getLocale() === 'ua' ? 'ru' : 'ua') }, 'switch'),
    Child(),
    $for(list, map(i => h('div', {}, t(text), i)))
  );
}

document.body.appendChild(App());