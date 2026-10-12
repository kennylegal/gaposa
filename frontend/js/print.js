import { store } from './store.js';
import { fmtDate,age,todayISO } from './ui/format.js';
function printHTML(html){
    document.getElementById('print-root').innerHTML=html;
    document.body.classList.add('printing');
    setTimeout(()=>{window.print();
        setTimeout(()=>{document.body.classList.remove('printing');
            document.getElementById('print-root').innerHTML=''},400)},60);
}
function slip({title,body,footerLeft,footerRight,ref}){
    return '<div class="print-slip"><div class="slip-head"><div><h1>'+store.settings.clinicName+'</h1>'+
        '<div class="slip-sub">University Health Centre</div><div class="slip-sub">'+title+'</div></div>'+
        '<div style="text-align:right"><div class="slip-sub">'+(ref||'')+'</div>'+
        '<div class="slip-sub">'+fmtDate(todayISO())+'</div></div></div>'+body+
        '<div class="slip-foot"><div class="sig">'+footerLeft+'</div>'+
        '<div class="sig">'+footerRight+'</div></div></div>';
}
function ptable(s,extra=''){
    return '<table><tr><th style="width:150px">Patient</th><td>'+s.firstName+' '+s.lastName+'</td>'+
        '<th style="width:120px">Matric No.</th><td>'+s.studentId+'</td></tr>'+
        '<tr><th>Age / Sex</th><td>'+age(s.dob)+' yrs / '+s.gender+'</td>'+
        '<th>Faculty</th><td>'+(s.faculty||'—')+'</td></tr>'+
        '<tr><th>Blood / Genotype</th><td>'+(s.bloodGroup||'—')+' / '+(s.genotype||'—')+'</td>'+
        '<th>Allergies</th><td>'+((s.allergies||[]).length?s.allergies.join(', '):'None known')+'</td></tr>'+
        extra+'</table>';
}
export function printVisit(id){
    const v=store.visits.find(x=>String(x.id)===String(id));if(!v)return;
    const s=v.student||store.students.find(x=>String(x.id)===String(v.studentId));if(!s)return;
    const rxs=store.prescriptions.filter(p=>String(p.visitId)===String(v.id));
    const vitals='<table><tr><th>BP</th><td>'+(v.vitals.bp||'—')+' mmHg</td>'+
        '<th>Temp</th><td>'+(v.vitals.temp||'—')+' °C</td></tr>'+
        '<tr><th>Pulse</th><td>'+(v.vitals.pulse||'—')+' bpm</td>'+
        '<th>Weight</th><td>'+(v.vitals.weight||'—')+' kg</td></tr>'+
        '<tr><th>SpO₂</th><td>'+(v.vitals.spo2||'—')+'%</td>'+
        '<th>When</th><td>'+fmtDate(v.date)+' · '+v.time+'</td></tr></table>';
    const rxSec=rxs.length?'<h3 style="margin-top:24px">Prescriptions</h3>'+
        '<table><thead><tr><th>Medication</th><th>Dosage</th><th>Freq</th><th>Duration</th><th style="text-align:right">Qty</th></tr></thead><tbody>'+
        rxs.map(p=>{const m=store.medications.find(x=>String(x.id)===String(p.medicationId));
            return '<tr><td>'+(m?m.name+' '+m.strength:'—')+'</td><td>'+p.dosage+'</td><td>'+p.frequency+
            '</td><td>'+p.duration+'</td><td style="text-align:right">'+p.quantity+'</td></tr>'}).join('')+'</tbody></table>':'';
    printHTML(slip({title:'Clinical Consultation Note',ref:'Ref '+String(v.id).slice(0,8).toUpperCase(),
        body:ptable(s,'<tr><th>Attending</th><td colspan="3">'+(v.attending||'—')+'</td></tr>')+
            '<h3>Vital Signs</h3>'+vitals+
            '<h3 style="margin-top:24px">Presenting Complaint</h3><p>'+(v.complaint||'—')+'</p>'+
            '<h3 style="margin-top:20px">Diagnosis</h3><p><strong>'+(v.diagnosis||'Pending')+'</strong></p>'+
            (v.treatment?'<h3 style="margin-top:20px">Treatment</h3><p>'+v.treatment+'</p>':'')+rxSec,
        footerLeft:'Attending Officer<br><span style="font-size:11px">'+(v.attending||'')+'</span>',
        footerRight:'Signature / Stamp<br><span style="font-size:11px">&nbsp;</span>'}));
}
export function printSickNote(id){
    const v=store.visits.find(x=>String(x.id)===String(id));if(!v)return;
    const s=v.student||store.students.find(x=>String(x.id)===String(v.studentId));if(!s)return;
    const days=parseInt(prompt('Days of rest:','2'),10)||1;
    const from=v.date;const to=new Date(new Date(from).getTime()+(days-1)*864e5).toISOString().slice(0,10);
    printHTML(slip({title:'Medical Certificate',ref:'Med Cert '+String(v.id).slice(0,8).toUpperCase(),
        body:'<p style="font-size:14px;line-height:1.9;margin-top:22px">This is to certify that <strong>'+
            s.firstName+' '+s.lastName+'</strong> (Matric No. <strong>'+s.studentId+'</strong>), a student of '+s.faculty+
            ' ('+s.department+'), Level '+s.level+', attended the University Health Centre on <strong>'+fmtDate(v.date)+
            '</strong> and was diagnosed with <strong>'+(v.diagnosis||'—')+'</strong>.</p>'+
            '<p style="font-size:14px;line-height:1.9;margin-top:16px">It is recommended that the student be granted <strong>'+
            days+' day'+(days>1?'s':'')+'</strong> of rest from <strong>'+fmtDate(from)+'</strong> to <strong>'+fmtDate(to)+
            '</strong> inclusive.</p>'+ptable(s,'<tr><th>Attending</th><td colspan="3">'+v.attending+'</td></tr>'),
        footerLeft:'Medical Officer<br><span style="font-size:11px">'+v.attending+'</span>',
        footerRight:'Signature / Stamp<br><span style="font-size:11px">&nbsp;</span>'}));
}
export function printReferral(id){
    const v=store.visits.find(x=>String(x.id)===String(id));if(!v)return;
    const s=v.student||store.students.find(x=>String(x.id)===String(v.studentId));if(!s)return;
    const facility=prompt('Referral destination:','');if(!facility)return;
    const reason=prompt('Reason for referral:','Further specialist evaluation');
    printHTML(slip({title:'Referral Letter',ref:'Ref '+String(v.id).slice(0,8).toUpperCase(),
        body:'<p style="font-size:14px;line-height:1.9;margin-top:22px"><strong>To:</strong> The Medical Officer in Charge<br>'+
            facility+'</p><p style="font-size:14px;line-height:1.9;margin-top:16px">Dear Colleague,</p>'+
            '<p style="font-size:14px;line-height:1.9;margin-top:12px">I am referring <strong>'+s.firstName+' '+s.lastName+
            '</strong> (Matric No. '+s.studentId+', '+age(s.dob)+' years, '+s.gender+'), a student of '+s.faculty+' — '+s.department+
            ', who attended on '+fmtDate(v.date)+'.</p>'+
            '<h3 style="margin-top:20px">Presenting Complaint</h3><p>'+v.complaint+'</p>'+
            '<h3 style="margin-top:16px">Diagnosis</h3><p><strong>'+(v.diagnosis||'—')+'</strong></p>'+
            '<h3 style="margin-top:16px">Treatment Given</h3><p>'+(v.treatment||'—')+'</p>'+
            '<h3 style="margin-top:16px">Reason for Referral</h3><p>'+reason+'</p>'+
            '<h3 style="margin-top:16px">History</h3><p>Allergies: '+((s.allergies||[]).length?s.allergies.join(', '):'None known')+
            '<br>Chronic: '+((s.conditions||[]).length?s.conditions.join(', '):'None')+'</p>',
        footerLeft:'Yours sincerely<br><span style="font-size:11px">'+v.attending+'</span>',
        footerRight:'Signature / Stamp<br><span style="font-size:11px">&nbsp;</span>'}));
}
export function printLabReport(id){
    const l=store.labRequests.find(x=>String(x.id)===String(id));if(!l)return;
    const s=l.student||store.students.find(x=>String(x.id)===String(l.studentId));if(!s)return;
    printHTML(slip({title:'Laboratory Report',ref:'Lab '+String(l.id).slice(0,8).toUpperCase(),
        body:ptable(s,'<tr><th>Ordered</th><td>'+fmtDate(l.orderedAt)+'</td>'+
            '<th>Ordered by</th><td>'+(l.orderedBy||'—')+'</td></tr>')+
            '<h3 style="margin-top:24px">Test</h3><p><strong>'+l.testType+'</strong></p>'+
            '<h3 style="margin-top:20px">Status</h3><p style="text-transform:capitalize">'+l.status+'</p>'+
            (l.result?'<h3 style="margin-top:20px">Result</h3><div style="border:1px solid #999;padding:12px;font-family:ui-monospace,monospace;font-size:13px">'+l.result+'</div>':
                '<p style="margin-top:20px;color:#666">Pending.</p>'),
        footerLeft:'Reviewed by<br><span style="font-size:11px">'+(l.reviewedBy||'____')+'</span>',
        footerRight:'Lab Scientist<br><span style="font-size:11px">&nbsp;</span>'}));
}
export function printRx(rx){
    const m=store.medications.find(x=>String(x.id)===String(rx.medicationId));
    const s=rx.student||store.students.find(x=>String(x.id)===String(rx.studentId));
    const v=store.visits.find(x=>String(x.id)===String(rx.visitId));
    printHTML(slip({title:'Pharmacy Prescription Slip',ref:'℞ '+String(rx.id).slice(0,8).toUpperCase(),
        body:ptable(s,'<tr><th>Diagnosis</th><td colspan="3">'+(v?v.diagnosis:'—')+'</td></tr>')+
            '<table><thead><tr><th>Medication</th><th>Dosage</th><th>Freq</th><th>Duration</th><th style="text-align:right">Qty</th></tr></thead><tbody>'+
            '<tr><td>'+(m?m.name+' '+m.strength+' ('+m.form+')':'—')+'</td><td>'+rx.dosage+'</td><td>'+rx.frequency+
            '</td><td>'+rx.duration+'</td><td style="text-align:right">'+rx.quantity+'</td></tr></tbody></table>'+
            '<p style="font-size:12.5px;color:#333">Complete the full course even if symptoms improve.</p>',
        footerLeft:'Prescriber<br><span style="font-size:11px">'+rx.prescribedBy+'</span>',
        footerRight:'Dispensed by<br><span style="font-size:11px">'+(rx.dispensedBy||'____')+'</span>'}));
}
