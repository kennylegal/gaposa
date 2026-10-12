import { store,studentById } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { age,initials,fmtDate } from '../ui/format.js';
export const title='Student Record';
export const roles=['admin','doctor','nurse','pharmacist','receptionist'];
let tab='overview';

export async function render(root,params){
    const id=String(params.id);
    if(!API_ENABLED){
        const s=studentById(id);
        if(!s){root.innerHTML='<div class="card"><div class="empty"><strong>Student not found</strong></div></div>';return}
        paint(root,params,{student:s,
            visits:store.visits.filter(v=>String(v.studentId)===id),
            prescriptions:store.prescriptions.filter(p=>String(p.studentId)===id),
            immunizations:store.immunizations.filter(i=>String(i.studentId)===id),
            lab_requests:store.labRequests.filter(l=>String(l.studentId)===id)});
        return;
    }
    root.innerHTML='<div class="card"><div class="empty"><strong>Loading…</strong></div></div>';
    try{
        const data=await api.students.profile(id);
        paint(root,params,data);
    }catch(e){
        root.innerHTML='<div class="card"><div class="empty"><strong>Could not load student</strong>'+
            '<p class="muted small">'+esc(e.message)+'</p>'+
            '<a class="btn" href="#/students" style="margin-top:12px">Back to list</a></div></div>';
    }
}

function paint(root,params,data){
    const s=data.student;
    const visits=[...data.visits].sort((a,b)=>(b.date+b.time).localeCompare(a.date+a.time));
    const rxs=data.prescriptions;const imm=data.immunizations||[];
    let body='';
    if(tab==='overview'){
        body='<div class="grid grid-2">'+
            '<div class="card"><div class="card-head"><h3>Medical Profile</h3></div><div class="card-body"><div class="detail-grid">'+
            '<div class="detail"><span class="detail-label">Allergies</span><span class="detail-value">'+
            ((s.allergies||[]).length?s.allergies.map(a=>'<span class="badge badge-danger">'+esc(a)+'</span>').join(' '):'<span class="muted">None</span>')+
            '</span></div><div class="detail"><span class="detail-label">Conditions</span><span class="detail-value">'+
            ((s.conditions||[]).length?s.conditions.map(c=>'<span class="badge badge-warn">'+esc(c)+'</span>').join(' '):'<span class="muted">None</span>')+
            '</span></div><div class="detail"><span class="detail-label">Blood</span><span class="detail-value">'+esc(s.bloodGroup||'—')+'</span></div>'+
            '<div class="detail"><span class="detail-label">Genotype</span><span class="detail-value">'+esc(s.genotype||'—')+'</span></div>'+
            '<div class="detail"><span class="detail-label">Phone</span><span class="detail-value">'+esc(s.phone||'—')+'</span></div>'+
            '<div class="detail"><span class="detail-label">Email</span><span class="detail-value">'+esc(s.email||'—')+'</span></div>'+
            '</div></div></div>'+
            '<div class="card"><div class="card-head"><h3>Emergency Contact</h3></div><div class="card-body"><div class="detail-grid">'+
            '<div class="detail"><span class="detail-label">Name</span><span class="detail-value">'+esc(s.emergency?.name||'—')+'</span></div>'+
            '<div class="detail"><span class="detail-label">Relationship</span><span class="detail-value">'+esc(s.emergency?.relation||'—')+'</span></div>'+
            '<div class="detail"><span class="detail-label">Phone</span><span class="detail-value">'+esc(s.emergency?.phone||'—')+'</span></div>'+
            '</div></div></div></div>';
    } else if(tab==='history'){
        body=visits.length?'<div class="card"><div class="card-body"><div class="timeline">'+
            visits.map(v=>'<div class="tl-item"><div class="tl-dot"></div>'+
                '<div class="tl-head"><strong>'+(v.diagnosis?esc(v.diagnosis):'Awaiting diagnosis')+'</strong>'+
                '<span class="muted small">'+fmtDate(v.date)+' · '+esc(v.time)+' · '+esc(v.attending)+'</span></div>'+
                '<div class="tl-meta"><span>BP '+esc(v.vitals.bp||'—')+'</span><span>Temp '+esc(v.vitals.temp||'—')+'°C</span>'+
                '<span>Pulse '+esc(v.vitals.pulse||'—')+'</span><span>Wt '+esc(v.vitals.weight||'—')+'kg</span></div>'+
                '<div class="tl-box"><strong style="font-size:11.5px;color:var(--muted)">COMPLAINT</strong><div>'+esc(v.complaint)+'</div></div>'+
                (v.treatment?'<div class="tl-box"><strong style="font-size:11.5px;color:var(--muted)">TREATMENT</strong><div>'+esc(v.treatment)+'</div></div>':'')+
                '<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">'+
                '<button class="btn sm ghost" data-p-visit="'+v.id+'">'+icon('print')+' Note</button>'+
                (v.diagnosis?'<button class="btn sm ghost" data-p-sick="'+v.id+'">'+icon('fileText')+' Sick note</button>'+
                '<button class="btn sm ghost" data-p-ref="'+v.id+'">'+icon('fileText')+' Referral</button>':'')+
                '</div></div>').join('')+'</div></div></div>':
            '<div class="card"><div class="empty"><div class="empty-ico">'+icon('clipboard')+'</div><strong>No visits</strong></div></div>';
    } else if(tab==='rx'){
        body=rxs.length?'<div class="card"><div class="table-wrap"><table class="table"><thead><tr>'+
            '<th>Medication</th><th>Directions</th><th>Qty</th><th>Status</th><th></th></tr></thead><tbody>'+
            rxs.map(p=>{const m=store.medications.find(x=>String(x.id)===String(p.medicationId));
                const cls=p.status==='dispensed'?'success':p.status==='cancelled'?'neutral':'warn';
                return '<tr><td><strong>'+esc(m?m.name:'?')+'</strong><div class="muted small">'+esc(m?m.strength:'')+'</div></td>'+
                    '<td>'+esc(p.dosage)+' · '+esc(p.frequency)+'<div class="muted small">'+esc(p.duration)+'</div></td>'+
                    '<td>'+p.quantity+'</td><td><span class="badge badge-'+cls+'">'+p.status+'</span></td>'+
                    '<td class="right"><button class="icon-btn" data-p-rx="'+p.id+'">'+icon('print')+'</button></td></tr>'}).join('')+
            '</tbody></table></div></div>':'<div class="card"><div class="empty"><div class="empty-ico">'+icon('pill')+'</div><strong>No prescriptions</strong></div></div>';
    } else if(tab==='imm'){
        body=imm.length?'<div class="card"><div class="table-wrap"><table class="table"><thead><tr>'+
            '<th>Vaccine</th><th>Dose</th><th>Date</th><th>Given By</th><th>Batch</th></tr></thead><tbody>'+
            imm.map(i=>'<tr><td><strong>'+esc(i.vaccine)+'</strong></td><td>'+esc(i.dose)+'</td>'+
                '<td>'+fmtDate(i.date)+'</td><td class="muted">'+esc(i.givenBy||'—')+'</td>'+
                '<td><code>'+esc(i.batchNo||'—')+'</code></td></tr>').join('')+'</tbody></table></div></div>':
            '<div class="card"><div class="empty"><div class="empty-ico">'+icon('shield')+'</div><strong>No immunizations</strong></div></div>';
    }
    root.innerHTML='<div style="margin-bottom:14px"><a class="btn sm ghost" href="#/students">← Back</a></div>'+
        '<div class="card" style="margin-bottom:16px"><div class="card-body" style="display:flex;gap:18px;align-items:flex-start;flex-wrap:wrap">'+
        '<div class="avatar lg">'+initials(s)+'</div>'+
        '<div style="flex:1;min-width:220px"><h2 style="font-size:20px">'+esc(s.firstName)+' '+esc(s.lastName)+'</h2>'+
        '<div class="muted">'+esc(s.studentId)+' · '+esc(s.faculty||'')+' — '+esc(s.department||'')+'</div>'+
        '<div style="display:flex;gap:20px;margin-top:14px;flex-wrap:wrap">'+
        '<div class="detail"><span class="detail-label">Age</span><span class="detail-value">'+age(s.dob)+' yrs</span></div>'+
        '<div class="detail"><span class="detail-label">Level</span><span class="detail-value">'+esc(s.level||'')+'L</span></div>'+
        '<div class="detail"><span class="detail-label">Blood</span><span class="detail-value">'+esc(s.bloodGroup||'—')+'</span></div>'+
        '<div class="detail"><span class="detail-label">Visits</span><span class="detail-value">'+visits.length+'</span></div>'+
        '</div></div></div>'+
        '<div class="tabs">'+
        '<button class="tab '+(tab==='overview'?'active':'')+'" data-t="overview">Overview</button>'+
        '<button class="tab '+(tab==='history'?'active':'')+'" data-t="history">History ('+visits.length+')</button>'+
        '<button class="tab '+(tab==='rx'?'active':'')+'" data-t="rx">Prescriptions ('+rxs.length+')</button>'+
        '<button class="tab '+(tab==='imm'?'active':'')+'" data-t="imm">Immunizations ('+imm.length+')</button>'+
        '</div></div>'+body;
    root.querySelectorAll('[data-t]').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.t;render(root,params)}));
    root.querySelectorAll('[data-p-visit]').forEach(b=>b.addEventListener('click',()=>import('../print.js').then(m=>m.printVisit(b.dataset.pVisit))));
    root.querySelectorAll('[data-p-sick]').forEach(b=>b.addEventListener('click',()=>import('../print.js').then(m=>m.printSickNote(b.dataset.pSick))));
    root.querySelectorAll('[data-p-ref]').forEach(b=>b.addEventListener('click',()=>import('../print.js').then(m=>m.printReferral(b.dataset.pRef))));
    root.querySelectorAll('[data-p-rx]').forEach(b=>b.addEventListener('click',()=>{
        const rx=rxs.find(p=>String(p.id)===String(b.dataset.pRx));
        import('../print.js').then(m=>m.printRx(rx))}));
}
