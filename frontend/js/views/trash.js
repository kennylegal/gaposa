import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/modal.js';
export const title='Trash';
export const roles=['admin'];
export async function render(root){
    if(!API_ENABLED){
        root.innerHTML='<div class="card"><div class="empty"><div class="empty-ico">'+icon('trash')+'</div>'+
            '<strong>Trash requires API</strong><p class="muted small">Set API_ENABLED = true.</p></div></div>';return}
    root.innerHTML='<div class="page-head"><div><h2>Trash</h2><p class="muted" id="cnt">Loading…</p></div></div>'+
        '<div class="card"><div class="table-wrap" id="tbl"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        try{
            const res=await api.trash.list();
            document.getElementById('cnt').textContent=res.count+' deleted record'+(res.count===1?'':'s');
            tbl.innerHTML=res.results.length?'<table class="table"><thead><tr>'+
                '<th>Type</th><th>Record</th><th>Deleted</th><th>By</th><th></th></tr></thead><tbody>'+
                res.results.map(r=>'<tr><td><span class="badge badge-neutral">'+esc(r.kind)+'</span></td>'+
                    '<td><strong>'+esc(r.label)+'</strong></td>'+
                    '<td class="muted small">'+(r.deleted_at?new Date(r.deleted_at).toLocaleString('en-GB'):'—')+'</td>'+
                    '<td class="muted">'+esc(r.deleted_by||'—')+'</td>'+
                    '<td class="right"><button class="btn sm ghost" data-restore="'+r.kind+'|'+r.id+'">Restore</button>'+
                    '<button class="btn sm danger" data-purge="'+r.kind+'|'+r.id+'">Delete forever</button></td></tr>').join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('trash')+'</div><strong>Trash is empty</strong></div>';
            tbl.querySelectorAll('[data-restore]').forEach(b=>b.addEventListener('click',async()=>{
                const [k,id]=b.dataset.restore.split('|');
                try{await api.trash.restore(k,id);toast('Restored.');load()}catch(e){toast(e.message,'error')}}));
            tbl.querySelectorAll('[data-purge]').forEach(b=>b.addEventListener('click',()=>{
                const [k,id]=b.dataset.purge.split('|');
                confirmDialog('Delete permanently?','Cannot be undone.','Delete',async()=>{
                    try{await api.trash.purge(k,id);toast('Purged.','warn');load()}catch(e){toast(e.message,'error')}})}));
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    await load();
}
