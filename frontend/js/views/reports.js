import { store } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { barList,weekChart } from '../components/charts.js';
export const title='Reports';
export const roles=['admin','doctor'];
export async function render(root){
    root.innerHTML='<div class="card"><div class="empty"><strong>Loading reports…</strong></div></div>';
    let data;
    if(API_ENABLED){
        try{data=await api.reports.overview()}
        catch(e){root.innerHTML='<div class="card"><div class="empty"><strong>Failed</strong><p class="muted small">'+e.message+'</p></div></div>';return}
    } else {
        const bf={};store.visits.forEach(v=>{const s=store.students.find(x=>String(x.id)===String(v.studentId));
            const f=s?s.faculty:'Unknown';bf[f]=(bf[f]||0)+1});
        const bd={};store.visits.forEach(v=>{if(v.diagnosis)bd[v.diagnosis]=(bd[v.diagnosis]||0)+1});
        const bm={};store.prescriptions.filter(p=>p.status==='dispensed').forEach(p=>{
            const m=store.medications.find(x=>String(x.id)===String(p.medicationId));
            const k=m?m.name+' '+m.strength:'Unknown';bm[k]=(bm[k]||0)+p.quantity});
        data={by_faculty:Object.entries(bf).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value),
            top_diagnoses:Object.entries(bd).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,8),
            medications_dispensed:Object.entries(bm).map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value).slice(0,8),
            monthly_visits:[],
            kpis:{total_visits:store.visits.length,
                unique_patients:new Set(store.visits.map(v=>v.studentId)).size,
                total_prescriptions:store.prescriptions.length,
                dispensed_prescriptions:store.prescriptions.filter(p=>p.status==='dispensed').length,
                inventory_value:store.medications.reduce((s,m)=>s+m.unitCost*m.quantity,0)}};
    }
    const rate=data.kpis.total_prescriptions?Math.round(data.kpis.dispensed_prescriptions/data.kpis.total_prescriptions*100):0;
    root.innerHTML='<div class="page-head"><div><h2>Reports & Analytics</h2>'+
        '<p class="muted">'+(API_ENABLED?'Server-side aggregation':'Client-side aggregation')+'</p></div>'+
        '<div class="page-head-actions"><button class="btn" onclick="window.print()">'+icon('print')+' Print</button></div></div>'+
        '<div class="grid grid-4" style="margin-bottom:16px">'+
        '<div class="stat"><div class="stat-ico teal">'+icon('clipboard')+'</div><div><div class="stat-val">'+data.kpis.total_visits+'</div><div class="stat-label">Consultations</div></div></div>'+
        '<div class="stat"><div class="stat-ico blue">'+icon('users')+'</div><div><div class="stat-val">'+data.kpis.unique_patients+'</div><div class="stat-label">Unique patients</div></div></div>'+
        '<div class="stat"><div class="stat-ico amber">'+icon('pill')+'</div><div><div class="stat-val">'+rate+'%</div><div class="stat-label">Rx fulfilment</div></div></div>'+
        '<div class="stat"><div class="stat-ico green">'+icon('box')+'</div><div><div class="stat-val" style="font-size:19px">₦'+Math.round(data.kpis.inventory_value).toLocaleString()+'</div><div class="stat-label">Inventory value</div></div></div>'+
        '</div>'+
        '<div class="grid grid-2" style="margin-bottom:16px">'+
        '<div class="card"><div class="card-head"><h3>Consultations by Faculty</h3></div><div class="card-body">'+barList(data.by_faculty,'#0d9488')+'</div></div>'+
        '<div class="card"><div class="card-head"><h3>Top Diagnoses</h3></div><div class="card-body">'+barList(data.top_diagnoses,'#2563eb')+'</div></div></div>'+
        '<div class="grid grid-2">'+
        '<div class="card"><div class="card-head"><h3>Medications Dispensed</h3></div><div class="card-body">'+barList(data.medications_dispensed,'#f59e0b')+'</div></div>'+
        '<div class="card"><div class="card-head"><h3>Weekly Visits</h3></div><div class="card-body">'+weekChart(store.visits)+'</div></div></div>';
}
