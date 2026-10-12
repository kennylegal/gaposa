import { api,API_ENABLED } from '../api.js';
import { store } from '../store.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { fmtDate,todayISO } from '../ui/format.js';
import { statCard } from '../components/stat-card.js';
import { donut } from '../components/charts.js';
export const title='Dashboard';
export const roles=['admin','doctor','nurse','pharmacist','receptionist'];

export async function render(root){
    root.innerHTML='<div class="card"><div class="empty"><strong>Loading…</strong></div></div>';
    let data;
    if(API_ENABLED){
        try{data=await api.dashboard.summary()}
        catch(e){
            root.innerHTML='<div class="card"><div class="empty"><strong>Dashboard unavailable</strong>'+
                '<p class="muted small">'+esc(e.message)+'</p></div></div>';
            return;
        }
    } else {
        data=localSummary();
    }
    const today=todayISO();
    const maxV=Math.max(1,...data.visits_by_day.map(d=>d.value));
    const chart='<div class="chart-cols">'+data.visits_by_day.map(d=>
        '<div class="chart-col"><div class="chart-bar" style="height:'+Math.max(4,d.value/maxV*100)+'%">'+
        '<span>'+d.value+'</span></div>'+
        '<div class="chart-day">'+new Date(d.label+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short'})+'</div></div>').join('')+'</div>';
    const rxTotal=data.rx_status.dispensed+data.rx_status.pending+data.rx_status.cancelled;
    root.innerHTML='<div class="page-head"><div><h2>Welcome back, '+
        esc(store.settings.staffName.split(' ').slice(-1)[0])+' 👋</h2>'+
        '<p class="muted">'+esc(store.settings.clinicName)+' — '+fmtDate(today)+'</p></div>'+
        '<div class="page-head-actions"><a class="btn" href="#/visits">'+icon('clipboard')+' View Visits</a></div></div>'+
        '<div class="grid grid-4" style="margin-bottom:16px">'+
        statCard({tone:'teal',icon:'users',label:'Registered Students',value:data.student_count})+
        statCard({tone:'blue',icon:'clipboard',label:'Visits Today',value:data.visits_today})+
        statCard({tone:'amber',icon:'clock',label:'Awaiting Doctor',value:data.awaiting_doctor})+
        statCard({tone:'red',icon:'alert',label:'Stock Alerts',value:data.low_stock_count})+
        '</div>'+
        '<div class="grid grid-2-1" style="margin-bottom:16px">'+
        '<div class="card"><div class="card-head"><h3>Patient Visits — Last 7 Days</h3></div>'+
        '<div class="card-body">'+chart+'</div></div>'+
        '<div class="card"><div class="card-head"><h3>Prescriptions</h3></div>'+
        '<div class="card-body">'+donut([
            {label:'Dispensed',value:data.rx_status.dispensed,color:'#0d9488'},
            {label:'Pending',value:data.rx_status.pending,color:'#f59e0b'},
            {label:'Cancelled',value:data.rx_status.cancelled,color:'#cbd5e1'}],rxTotal,'total')+'</div></div></div>'+
        '<div class="grid grid-2-1">'+
        '<div class="card"><div class="card-head"><h3>Recent Consultations</h3>'+
        '<a class="btn sm ghost" href="#/visits">View all</a></div><div class="table-wrap">'+
        renderRecent(data.recent_visits)+'</div></div>'+
        '<div class="card"><div class="card-head"><h3>Inventory Alerts</h3>'+
        '<a class="btn sm ghost" href="#/inventory">Manage</a></div>'+
        renderAlerts(data.low_stock_items)+'</div></div>';
    root.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>
        import('../print.js').then(m=>m.printVisit(b.dataset.print))));
}

function renderRecent(visits){
    if(!visits.length)return '<div class="empty"><div class="empty-ico">'+icon('inbox')+'</div><strong>No visits yet</strong></div>';
    return '<table class="table"><thead><tr><th>Student</th><th>Date</th><th>Status</th><th></th></tr></thead><tbody>'+
        visits.map(v=>{
            const cls=v.status==='completed'?'success':v.status==='referred'?'info':'warn';
            const lbl=v.status==='completed'?'Completed':v.status==='referred'?'Referred':'Awaiting doctor';
            const name=v.student?esc(v.student.firstName)+' '+esc(v.student.lastName):'?';
            return '<tr><td><strong>'+name+'</strong></td>'+
                '<td class="muted">'+fmtDate(v.date)+'</td>'+
                '<td><span class="badge badge-'+cls+'">'+lbl+'</span></td>'+
                '<td class="right"><button class="icon-btn" data-print="'+v.id+'">'+icon('print')+'</button></td></tr>';
        }).join('')+'</tbody></table>';
}
function renderAlerts(items){
    if(!items.length)return '<div class="empty"><div class="empty-ico">'+icon('check')+'</div><strong>All stock healthy</strong></div>';
    return items.map(m=>'<div class="alert-row"><div class="alert-ico warn">'+icon('alert')+'</div>'+
        '<div style="flex:1"><div style="font-weight:600">'+esc(m.name)+' '+esc(m.strength)+'</div>'+
        '<div class="muted small">'+m.quantity+' '+esc(m.unit)+' left</div></div></div>').join('');
}
function localSummary(){
    const today=todayISO();
    const week=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));
        return d.toISOString().slice(0,10)});
    const byDay=week.map(d=>({label:d,value:store.visits.filter(v=>v.date===d).length}));
    const low=store.medications.filter(m=>m.quantity<=m.reorderLevel);
    return {student_count:store.students.length,
        visits_today:store.visits.filter(v=>v.date===today).length,
        awaiting_doctor:store.visits.filter(v=>v.status==='awaiting_doctor').length,
        pending_prescriptions:store.prescriptions.filter(p=>p.status==='pending').length,
        low_stock_count:low.length,
        rx_status:{dispensed:store.prescriptions.filter(p=>p.status==='dispensed').length,
            pending:store.prescriptions.filter(p=>p.status==='pending').length,
            cancelled:store.prescriptions.filter(p=>p.status==='cancelled').length},
        visits_by_day:byDay,
        recent_visits:[...store.visits].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time)).slice(0,8)
            .map(v=>({...v,student:store.students.find(s=>String(s.id)===String(v.studentId))})),
        low_stock_items:low.slice(0,6)};
}
