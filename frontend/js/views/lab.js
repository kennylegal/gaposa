import { store,updateLabRequest } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { fmtDate } from '../ui/format.js';
import { renderPaginator } from '../ui/paginator.js';
import { toast } from '../ui/toast.js';
export const title='Lab Requests';
export const roles=['admin','doctor','nurse'];
const state={page:1,page_size:25};
let meta={count:0,page:1,pages:1,page_size:25};
export async function render(root){
    root.innerHTML='<div class="page-head"><div><h2>Laboratory Requests</h2><p class="muted" id="cnt">Loading…</p></div></div>'+
        '<div class="card"><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        try{
            let list;
            if(API_ENABLED){const res=await api.labRequests.list({page:state.page,page_size:state.page_size,ordering:'-ordered_at'});list=res.results;meta=res}
            else{const all=[...store.labRequests].sort((a,b)=>b.orderedAt.localeCompare(a.orderedAt));
                meta={count:all.length,page:state.page,pages:Math.ceil(all.length/state.page_size),page_size:state.page_size};
                const from=(state.page-1)*state.page_size;list=all.slice(from,from+state.page_size)}
            document.getElementById('cnt').textContent=meta.count+' request'+(meta.count===1?'':'s');
            tbl.innerHTML=list.length?'<table class="table"><thead><tr>'+
                '<th>Date</th><th>Student</th><th>Test</th><th>Status</th><th>Result</th><th></th></tr></thead><tbody>'+
                list.map(l=>{const s=l.student||store.students.find(x=>String(x.id)===String(l.studentId));
                    const cls=l.status==='resulted'?'success':l.status==='collected'?'info':'warn';
                    return '<tr><td class="muted">'+fmtDate(l.orderedAt)+'</td>'+
                        '<td><strong>'+(s?esc(s.firstName)+' '+esc(s.lastName):'?')+'</strong></td>'+
                        '<td>'+esc(l.testType)+'</td>'+
                        '<td><span class="badge badge-'+cls+'">'+esc(l.status)+'</span></td>'+
                        '<td>'+(l.result?esc(l.result):'<span class="muted">—</span>')+'</td>'+
                        '<td class="right"><button class="icon-btn" data-print="'+l.id+'">'+icon('print')+'</button>'+
                        (l.status==='ordered'?'<button class="icon-btn" data-collect="'+l.id+'">'+icon('check')+'</button>':'')+
                        (l.status==='collected'?'<button class="icon-btn" data-result="'+l.id+'">'+icon('edit')+'</button>':'')+
                        '</td></tr>'}).join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('flask')+'</div><strong>No lab requests</strong></div>';
            tbl.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>{
                const l=list.find(x=>String(x.id)===String(b.dataset.print));
                import('../print.js').then(m=>m.printLabReport(l))}));
            tbl.querySelectorAll('[data-collect]').forEach(b=>b.addEventListener('click',async()=>{
                try{await updateLabRequest(b.dataset.collect,{status:'collected'});load()}
                catch(e){toast(e.message,'error')}}));
            tbl.querySelectorAll('[data-result]').forEach(b=>b.addEventListener('click',async()=>{
                const l=list.find(x=>String(x.id)===String(b.dataset.result));
                const r=prompt('Result for '+l.testType+':','');if(!r)return;
                try{await updateLabRequest(l.id,{status:'resulted',result:r});load()}
                catch(e){toast(e.message,'error')}}));
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    await load();
}
