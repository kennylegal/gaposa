import { $,esc } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { ROLES,login } from '../auth.js';
import { API_ENABLED } from '../api.js';
export function renderLogin(){
    const root=$('#login-roles');const err=$('#login-error');
    if(!API_ENABLED){
        root.innerHTML=Object.entries(ROLES).map(([k,r])=>
            '<button class="login-role" data-role="'+k+'">'+
            '<div class="login-role-ico">'+icon(r.icon)+'</div>'+
            '<div class="login-role-body"><div class="login-role-title">'+esc(r.label)+'</div>'+
            '<div class="login-role-desc">'+esc(r.desc)+'</div></div></button>').join('');
        root.querySelectorAll('.login-role').forEach(btn=>btn.addEventListener('click',async()=>{
            try{await login(btn.dataset.role,btn.dataset.role+'123');location.reload()}
            catch(e){err.textContent=e.message;err.classList.add('show')}}));
        return;
    }
    root.innerHTML='<form id="login-form" style="display:flex;flex-direction:column;gap:12px">'+
        '<label class="field"><span class="field-label">Username</span>'+
        '<input class="input" name="username" autocomplete="username" autofocus required></label>'+
        '<label class="field"><span class="field-label">Password</span>'+
        '<input class="input" name="password" type="password" autocomplete="current-password" required></label>'+
        '<button type="submit" class="btn primary full" style="margin-top:8px">Sign In</button></form>'+
        '<p class="muted small" style="margin-top:14px;text-align:center">Demo: <code>admin</code> / <code>admin123</code></p>';
    $('#login-form').addEventListener('submit',async e=>{
        e.preventDefault();err.classList.remove('show');
        const d=new FormData(e.target);const btn=e.target.querySelector('button[type=submit]');
        btn.disabled=true;btn.textContent='Signing in…';
        try{await login(d.get('username'),d.get('password'));location.reload()}
        catch(ex){err.textContent=ex.message;err.classList.add('show');
            btn.disabled=false;btn.textContent='Sign In'}});
}
