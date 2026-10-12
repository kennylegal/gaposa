const KEY='Gaposa_theme';
export function currentTheme(){const s=localStorage.getItem(KEY);if(s==='dark'||s==='light')return s;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches?'dark':'light'}
export function apply(t){document.documentElement.dataset.theme=t;localStorage.setItem(KEY,t)}
export function toggle(){const n=currentTheme()==='dark'?'light':'dark';apply(n);return n}
export function init(){apply(currentTheme())}
