import { currentRole } from './auth.js';
const routes=new Map();let current=null;
export function register(name,mod){routes.set(name,mod)}
export function navigate(name,params={}){
    const qs=new URLSearchParams(params).toString();
    location.hash=qs?'#/'+name+'?'+qs:'#/'+name;
}
export function currentRoute(){
    const raw=location.hash.slice(2)||'dashboard';
    const [name,qs]=raw.split('?');
    return {name,params:Object.fromEntries(new URLSearchParams(qs||''))};
}
async function resolve(){
    const {name,params}=currentRoute();
    const mod=routes.get(name)||routes.get('dashboard');
    const root=document.getElementById('view');
    const role=currentRole();
    if(current?.unmount)try{current.unmount()}catch{}
    root.innerHTML='';
    if(mod.roles&&role&&!mod.roles.includes(role)){
        root.innerHTML='<div class="card"><div class="card-body"><div class="empty">'+
            '<div class="empty-ico">🔒</div><strong>Access restricted</strong>'+
            '<p class="muted small">Your role ('+role+') cannot view this page.</p>'+
            '</div></div></div>';
        document.getElementById('page-title').textContent=mod.title||name;
        return;
    }
    const cleanup=await mod.render(root,params);
    current={name,mod,unmount:typeof cleanup==='function'?cleanup:null};
    mod.onMount?.(root,params);
    document.getElementById('page-title').textContent=mod.title||name;
    document.querySelectorAll('[data-route]').forEach(el=>el.classList.toggle('active',el.dataset.route===name));
}
export function start(){window.addEventListener('hashchange',resolve);resolve()}
export const rerender=resolve;
