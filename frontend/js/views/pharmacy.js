import { store,dispenseRx,cancelRx } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/modal.js';
import { renderPaginator } from '../ui/paginator.js';
import { can } from '../auth.js';
export const title='Pharmacy';
export const roles=['admin','doctor','nurse','pharmacist'];
let tab='pending';
const state={page:1,page_size:25};
let meta={count:0,page:1,pages:1,page_size:25};
export async function render(root){
    // In API mode, fetch counts from server first
    let counts={pending:0,dispensed:0,cancelled:0,all:0};
    if(API_ENABLED){
        try{
            const [pending,dispensed,cancelled]=await Promise.all([
                api.prescriptions.list({status:'pending',page_size:1}),
                api.prescriptions.list({status:'dispensed',page_size:1}),
                api.prescriptions.list({status:'cancelled',page_size:1})]);
            counts={pending:pending.count,dispensed:dispensed.count,cancelled:cancelled.count,
                all:pending.count+dispensed.count+cancelled.count};
        }catch(e){/* leave zeros */}
    } else {
        counts={pending:store.prescriptions.filter(p=>p.status==='pending').length,
            dispensed:store.prescriptions.filter(p=>p.status==='dispensed').length,
            cancelled:store.prescriptions.filter(p=>p.status==='cancelled').length,
            all:store.prescriptions.length};
    }
    const canDisp=can('rx.dispense');
    root.innerHTML='<div class="page-head"><div><h2>Pharmacy</h2>'+
        '<p class="muted">'+counts.pending+' prescriptions awaiting dispense</p></div></div>'+
        '<div class="grid grid-4" style="margin-bottom:16px">'+
        '<div class="stat"><div class="stat-ico amber">'+icon('pill')+'</div><div><div class="stat-val">'+counts.pending+'</div><div class="stat-label">Pending</div></div></div>'+
        '<div class="stat"><div class="stat-ico green">'+icon('check')+'</div><div><div class="stat-val">'+counts.dispensed+'</div><div class="stat-label">Dispensed</div></div></div>'+
        '<div class="stat"><div class="stat-ico blue">'+icon('clipboard')+'</div><div><div class="stat-val">'+counts.all+'</div><div class="stat-label">Total</div></div></div>'+
        '<div class="stat"><div class="stat-ico red">'+icon('alert')+'</div><div><div class="stat-val">'+store.medications.filter(m=>m.quantity<m.reorderLevel).length+'</div><div class="stat-label">Below reorder</div></div></div>'+
        '</div>'+
        '<div class="card"><div class="tabs">'+
        '<button class="tab '+(tab==='pending'?'active':'')+'" data-t="pending">Pending ('+counts.pending+')</button>'+
        '<button class="tab '+(tab==='dispensed'?'active':'')+'" data-t="dispensed">Dispensed ('+counts.dispensed+')</button>'+
        '<button class="tab '+(tab==='cancelled'?'active':'')+'" data-t="cancelled">Cancelled ('+counts.cancelled+')</button>'+
        '<button class="tab '+(tab==='all'?'active':'')+'" data-t="all">All ('+counts.all+')</button>'+
        '</div><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        try{
            let list;
            if(API_ENABLED){const p={page:state.page,page_size:state.page_size};
                if(tab!=='all')p.status=tab;
                const res=await api.prescriptions.list(p);list=res.results;meta=res;
            } else {
                const all=store.prescriptions.filter(p=>tab==='all'||p.status===tab).sort((a,b)=>String(b.id).localeCompare(String(a.id)));
                meta={count:all.length,page:state.page,pages:Math.ceil(all.length/state.page_size),page_size:state.page_size};
                const from=(state.page-1)*state.page_size;list=all.slice(from,from+state.page_size);
            }
            tbl.innerHTML=list.length?'<table class="table"><thead><tr>'+
                '<th>Student</th><th>Medication</th><th>Directions</th><th>Qty</th><th>Status</th><th></th></tr></thead><tbody>'+
                list.map(p=>{const s=p.student||store.students.find(x=>String(x.id)===String(p.studentId));
                    const m=store.medications.find(x=>String(x.id)===String(p.medicationId));
                    const cls=p.status==='dispensed'?'success':p.status==='cancelled'?'neutral':'warn';
                    return '<tr><td><strong>'+(s?esc(s.firstName)+' '+esc(s.lastName):'?')+'</strong></td>'+
                        '<td><strong>'+esc(m?m.name:'?')+' '+esc(m?m.strength:'')+'</strong></td>'+
                        '<td>'+esc(p.dosage)+' · '+esc(p.frequency)+'<div class="muted small">'+esc(p.duration)+'</div></td>'+
                        '<td>'+p.quantity+'</td><td><span class="badge badge-'+cls+'">'+p.status+'</span></td>'+
                        '<td class="right"><button class="icon-btn" data-print="'+p.id+'">'+icon('print')+'</button>'+
                        (p.status==='pending'&&canDisp?'<button class="icon-btn" data-disp="'+p.id+'">'+icon('check')+'</button>'+
                            '<button class="icon-btn danger" data-cancel="'+p.id+'">'+icon('close')+'</button>':'')+'</td></tr>'}).join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('pill')+'</div><strong>Nothing here</strong></div>';
            tbl.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>{
                const rx=list.find(p=>String(p.id)===String(b.dataset.print));
                import('../print.js').then(m=>m.printRx(rx))}));
            tbl.querySelectorAll('[data-disp]').forEach(b=>b.addEventListener('click',async()=>{
                const id=b.dataset.disp;const rx=list.find(p=>String(p.id)===String(id));
                const m=store.medications.find(x=>String(x.id)===String(rx.medicationId));
                b.disabled=true;
                try{await dispenseRx(id,rx.quantity);toast('Dispensed '+(m?m.name:'medication'));load()}
                catch(e){toast(e.message,'error');b.disabled=false}}));
            tbl.querySelectorAll('[data-cancel]').forEach(b=>b.addEventListener('click',()=>{
                confirmDialog('Cancel prescription?','This cannot be undone.','Cancel',async()=>{
                    try{await cancelRx(b.dataset.cancel);toast('Cancelled.','warn');load()}
                    catch(e){toast(e.message,'error')}})}));
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    root.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.t;state.page=1;render(root)}));
    await load();
}
