import { store,restockMedication } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { fmtDate,money,daysUntil } from '../ui/format.js';
import { toast } from '../ui/toast.js';
import { renderPaginator } from '../ui/paginator.js';
import { can } from '../auth.js';
export const title='Inventory';
export const roles=['admin','doctor','nurse','pharmacist'];
const state={q:'',cat:'',page:1,page_size:25};
let meta={count:0,page:1,pages:1,page_size:25};
export async function render(root){
    const cats=[...new Set(store.medications.map(m=>m.category))].filter(Boolean).sort();
    const total=store.medications.reduce((s,m)=>s+m.unitCost*m.quantity,0);
    const canManage=can('inventory.*');
    root.innerHTML='<div class="page-head"><div><h2>Pharmacy Inventory</h2>'+
        '<p class="muted">'+store.medications.length+' items · value '+money(total)+'</p></div></div>'+
        '<div class="card"><div class="toolbar">'+
        '<div class="search">'+icon('search')+'<input class="input" id="q" placeholder="Search name, batch…" value="'+esc(state.q)+'"></div>'+
        '<select class="input" id="cat" style="max-width:200px"><option value="">All categories</option>'+
        cats.map(c=>'<option'+(state.cat===c?' selected':'')+'>'+esc(c)+'</option>').join('')+'</select>'+
        '</div><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        try{
            let list;
            if(API_ENABLED){const p={page:state.page,page_size:state.page_size,ordering:'name'};
                if(state.q)p.search=state.q;if(state.cat)p.category=state.cat;
                const res=await api.medications.list(p);list=res.results;meta=res;
            } else {
                const t=state.q.trim().toLowerCase();
                const all=store.medications.filter(m=>{const hay=(m.name+' '+m.category+' '+m.batchNo+' '+m.supplier).toLowerCase();
                    return (!t||hay.includes(t))&&(!state.cat||m.category===state.cat)})
                    .sort((a,b)=>a.name.localeCompare(b.name));
                meta={count:all.length,page:state.page,pages:Math.ceil(all.length/state.page_size),page_size:state.page_size};
                const from=(state.page-1)*state.page_size;list=all.slice(from,from+state.page_size);
            }
            tbl.innerHTML=list.length?'<table class="table"><thead><tr>'+
                '<th>Medication</th><th>Category</th><th>Batch</th><th>Expiry</th><th>Stock</th><th>Reorder</th><th>Value</th><th></th></tr></thead><tbody>'+
                list.map(m=>{const exp=m.expiryDate&&daysUntil(m.expiryDate)<0;
                    const low=m.quantity<=m.reorderLevel;
                    const pct=Math.min(100,Math.round(m.quantity/Math.max(m.reorderLevel*3,1)*100));
                    const bc=exp||m.quantity<=0?'#e11d48':low?'#f59e0b':'#0d9488';
                    const eb=exp?'<span class="badge badge-danger">Expired</span>':
                        (m.expiryDate&&daysUntil(m.expiryDate)<=90?'<span class="badge badge-warn">'+daysUntil(m.expiryDate)+'d</span>':'');
                    return '<tr><td><strong>'+esc(m.name)+'</strong><div class="muted small">'+esc(m.strength)+' · '+esc(m.form)+'</div></td>'+
                        '<td><span class="badge badge-neutral">'+esc(m.category)+'</span></td>'+
                        '<td><code>'+esc(m.batchNo||'—')+'</code></td>'+
                        '<td>'+fmtDate(m.expiryDate)+' '+eb+'</td>'+
                        '<td><strong>'+m.quantity+'</strong> <span class="muted small">'+esc(m.unit)+'</span>'+
                        '<div class="stock-bar"><div style="width:'+pct+'%;background:'+bc+'"></div></div></td>'+
                        '<td class="muted">'+m.reorderLevel+'</td>'+
                        '<td>'+money(m.unitCost)+'<div class="muted small">'+money(m.unitCost*m.quantity)+'</div></td>'+
                        '<td class="right">'+(canManage?'<button class="icon-btn" data-restock="'+m.id+'">'+icon('plus')+'</button>':'')+'</td></tr>'}).join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('box')+'</div><strong>No items</strong></div>';
            if(canManage){
                tbl.querySelectorAll('[data-restock]').forEach(b=>b.addEventListener('click',async()=>{
                    const m=list.find(x=>String(x.id)===String(b.dataset.restock));
                    const qty=parseInt(prompt('Quantity for '+m.name+':','100'),10);
                    if(!qty||qty<1)return;
                    try{await restockMedication(m.id,{quantity:qty});toast('Restocked '+m.name);load()}
                    catch(e){toast(e.message,'error')}}));
            }
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    let t;
    document.getElementById('q').addEventListener('input',e=>{clearTimeout(t);
        t=setTimeout(()=>{state.q=e.target.value;state.page=1;load()},250)});
    document.getElementById('cat').addEventListener('change',e=>{state.cat=e.target.value;state.page=1;load()});
    await load();
}
