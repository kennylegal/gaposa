import { $ } from './dom.js';
export function toast(msg,type='success'){
    const t=document.createElement('div');
    t.className='toast'+(type!=='success'?' toast-'+type:'');
    t.textContent=msg;$('#toast-root').appendChild(t);
    requestAnimationFrame(()=>t.classList.add('show'));
    setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),300)},3200);
}
