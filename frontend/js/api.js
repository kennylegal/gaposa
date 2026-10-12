export const API_ENABLED=true;
export const API_BASE='http://127.0.0.1:8000/api';
const AK='Gaposa_access',RK='Gaposa_refresh';
export function setTokens(a,r){if(a)localStorage.setItem(AK,a);if(r)localStorage.setItem(RK,r)}
export function clearTokens(){localStorage.removeItem(AK);localStorage.removeItem(RK)}
export const hasToken=()=>!!localStorage.getItem(AK);
async function refreshAccess(){
    const r=localStorage.getItem(RK);if(!r)return null;
    try{const res=await fetch(API_BASE+'/auth/refresh/',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({refresh:r})});
        if(!res.ok)return null;const d=await res.json();setTokens(d.access,d.refresh);return d.access}catch{return null}
}
async function fj(path,opts={},_r=true){
    const a=localStorage.getItem(AK);
    const headers={'Content-Type':'application/json',...(opts.headers||{})};
    if(a)headers['Authorization']='Bearer '+a;
    const res=await fetch(API_BASE+path,{...opts,headers,credentials:'include'});
    if(res.status===401&&_r&&localStorage.getItem(RK)){
        const f=await refreshAccess();
        if(f)return fj(path,opts,false);
        clearTokens();throw new Error('Session expired');
    }
    if(res.status===204)return null;
    const data=await res.json().catch(()=>({}));
    if(!res.ok){let m=data.error||data.detail;
        if(!m&&typeof data==='object'){const f=Object.values(data)[0];m=Array.isArray(f)?f[0]:f}
        throw new Error(m||('HTTP '+res.status))}
    return data;
}
function qs(p={}){const c=Object.entries(p).filter(([,v])=>v!==''&&v!=null);
    return c.length?'?'+new URLSearchParams(c).toString():''}
const env=d=>({results:Array.isArray(d)?d:(d.results||[]),count:d.count??(Array.isArray(d)?d.length:0),
    page:d.page??1,pages:d.pages??1,page_size:d.page_size??25});
export const api={
    auth:{login:async(u,p)=>{const r=await fetch(API_BASE+'/auth/login/',{method:'POST',
        headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
        const d=await r.json();if(!r.ok)throw new Error(d.error||'Login failed');return d},
        me:()=>fj('/auth/me/'),logout:()=>fj('/auth/logout/',{method:'POST'})},
    students:{
        list:p=>fj('/students/'+qs(p)).then(env),
        lookup:q=>fj('/students/lookup/?q='+encodeURIComponent(q)),
        profile:id=>fj('/students/'+id+'/profile/'),
        get:id=>fj('/students/'+id+'/'),
        create:d=>fj('/students/',{method:'POST',body:JSON.stringify(d)}),
        update:(id,d)=>fj('/students/'+id+'/',{method:'PUT',body:JSON.stringify(d)}),
        remove:id=>fj('/students/'+id+'/',{method:'DELETE'})},
    medications:{list:p=>fj('/medications/'+qs(p)).then(env),
        create:d=>fj('/medications/',{method:'POST',body:JSON.stringify(d)}),
        update:(id,d)=>fj('/medications/'+id+'/',{method:'PUT',body:JSON.stringify(d)}),
        remove:id=>fj('/medications/'+id+'/',{method:'DELETE'}),
        restock:(id,d)=>fj('/medications/'+id+'/restock/',{method:'POST',body:JSON.stringify(d)})},
    visits:{list:p=>fj('/visits/'+qs(p)).then(env),
        create:d=>fj('/visits/',{method:'POST',body:JSON.stringify(d)}),
        update:(id,d)=>fj('/visits/'+id+'/',{method:'PUT',body:JSON.stringify(d)}),
        remove:id=>fj('/visits/'+id+'/',{method:'DELETE'})},
    prescriptions:{list:p=>fj('/prescriptions/'+qs(p)).then(env),
        create:d=>fj('/prescriptions/',{method:'POST',body:JSON.stringify(d)}),
        dispense:(id,d)=>fj('/prescriptions/'+id+'/dispense/',{method:'POST',body:JSON.stringify(d)}),
        cancel:id=>fj('/prescriptions/'+id+'/cancel_rx/',{method:'POST'})},
    audit:{list:p=>fj('/audit/'+qs(p)).then(env)},
    users:{list:p=>fj('/users/'+qs(p)).then(env),
        create:d=>fj('/users/',{method:'POST',body:JSON.stringify(d)}),
        update:(id,d)=>fj('/users/'+id+'/',{method:'PUT',body:JSON.stringify(d)}),
        remove:id=>fj('/users/'+id+'/',{method:'DELETE'}),
        resetPassword:(id,np)=>fj('/users/'+id+'/reset_password/',{method:'POST',body:JSON.stringify({new_password:np})}),
        toggleActive:id=>fj('/users/'+id+'/toggle_active/',{method:'POST'}),
        changePassword:(cp,np)=>fj('/users/change_password/',{method:'POST',body:JSON.stringify({current_password:cp,new_password:np})})},
    trash:{list:()=>fj('/trash/').then(env),
        restore:(k,id)=>fj('/trash/restore/',{method:'POST',body:JSON.stringify({kind:k,id})}),
        purge:(k,id)=>fj('/trash/purge/',{method:'POST',body:JSON.stringify({kind:k,id})})},
    dashboard:{summary:()=>fj('/dashboard/')},
    reports:{overview:p=>fj('/reports/overview/'+qs(p))},
};
