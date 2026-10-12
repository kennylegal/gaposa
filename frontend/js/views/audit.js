import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { renderPaginator } from '../ui/paginator.js';
export const title='Audit Log';
export const roles=['admin'];
const state={page:1,page_size:50};
let meta={count:0,page:1,pages:1,page_size:50};
export async function render(root){
    if(!API_ENABLED){
        root.innerHTML='<div class="card"><div class="empty"><div class="empty-ico">'+icon('history')+'</div>'+
            '<strong>Server audit log requires API mode</strong>'+
            '<p class="muted small">Set API_ENABLED = true in js/api.js.</p></div></div>';return}
    root.innerHTML='<div class="page-head"><div><h2>Audit Log</h2><p class="muted" id="cnt">Loading…</p></div></div>'+
        '<div class="card"><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        try{
            const res=await api.audit.list({page:state.page,page_size:state.page_size});meta=res;
            document.getElementById('cnt').textContent=meta.count+' entries';
            tbl.innerHTML=res.results.length?'<table class="table"><thead><tr>'+
                '<th>When</th><th>Action</th><th>Model</th><th>Target</th><th>Actor</th></tr></thead><tbody>'+
                res.results.map(a=>'<tr><td class="muted small">'+new Date(a.at).toLocaleString('en-GB')+'</td>'+
                    '<td><code>'+esc(a.action)+'</code></td>'+
                    '<td><strong>'+esc(a.model)+'</strong></td>'+
                    '<td>'+esc(a.targetLabel||'—')+'</td>'+
                    '<td>'+esc(a.actorLabel||'—')+'</td></tr>').join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('history')+'</div><strong>No entries</strong></div>';
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    await load();
}
