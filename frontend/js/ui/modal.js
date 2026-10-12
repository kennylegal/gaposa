import { $,$$,esc } from './dom.js';
import { icon } from './icons.js';
export function openModal({title,body,footer,size='',onSubmit,onMount}){
    const root=$('#modal-root');
    root.innerHTML='<div class="modal-backdrop"></div><div class="modal '+(size?'modal-'+size:'')+'" role="dialog">'+
        '<div class="modal-head"><h3>'+esc(title)+'</h3>'+
        '<button type="button" class="icon-btn" data-modal-close>'+icon('close')+'</button></div>'+
        '<form class="modal-form" novalidate><div class="modal-body">'+body+'</div>'+
        '<div class="modal-foot">'+(footer??'<button type="button" class="btn ghost" data-modal-close>Close</button>')+'</div>'+
        '</form></div>';
    const form=root.querySelector('form');
    form.addEventListener('submit',e=>{e.preventDefault();if(onSubmit)onSubmit(form,root)});
    $$('[data-modal-close]',root).forEach(b=>b.addEventListener('click',closeModal));
    $('.modal-backdrop',root).addEventListener('click',closeModal);
    const first=root.querySelector('.modal-body input, .modal-body select, .modal-body textarea');
    if(first)setTimeout(()=>first.focus(),60);
    if(onMount)onMount(root);
    return root;
}
export function closeModal(){$('#modal-root').innerHTML=''}
export function confirmDialog(title,message,confirmLabel,onConfirm){
    openModal({title,size:'sm',
        body:'<p class="muted" style="font-size:13.5px">'+esc(message)+'</p>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn danger">'+esc(confirmLabel)+'</button>',
        onSubmit:()=>{onConfirm();closeModal()}});
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
