import { openModal,closeModal } from '../ui/modal.js';
import { $,$$ } from '../ui/dom.js';
import { todayISO } from '../ui/format.js';
import { store,createStudent,updateStudent,createVisit,updateVisit,createPrescription } from '../store.js';
import { toast } from '../ui/toast.js';
import { currentUser } from '../auth.js';
import { api,API_ENABLED } from '../api.js';
import { studentPickerHTML,bindStudentPicker } from './student-picker.js';

const F={
    field:(l,c,h='')=>'<label class="field"><span class="field-label">'+l+'</span>'+c+(h?'<small>'+h+'</small>':'')+'</label>',
    input:(n,v='',t='text',a='')=>'<input class="input" name="'+n+'" type="'+t+'" value="'+(v||'')+'" '+a+'>',
    ta:(n,v='',a='')=>'<textarea class="input" name="'+n+'" '+a+'>'+(v||'')+'</textarea>',
    sel:(n,opts,v,a='')=>'<select class="input" name="'+n+'" '+a+'>'+opts.map(o=>{
        const val=typeof o==='object'?o.value:o;const lbl=typeof o==='object'?o.label:o;
        return '<option value="'+val+'"'+(String(val)===String(v)?' selected':'')+'>'+lbl+'</option>'}).join('')+'</select>'};
const fd=f=>Object.fromEntries(new FormData(f).entries());

export function studentModal(student){
    const isEdit=!!student;
    const s=student||{gender:'Female',level:'100',faculty:'Science'};
    const faculties=['Science','Engineering','Arts','Medicine','Law','Business','Social Sciences','Education','Agriculture'];
    const blood=['','O+','O-','A+','A-','B+','B-','AB+','AB-'];const geno=['','AA','AS','SS','AC'];
    const levels=['100','200','300','400','500','600','Postgraduate'];
    openModal({title:isEdit?'Edit Student':'Register New Student',size:'lg',
        body:'<div class="form-section"><h4>Personal</h4><div class="form-grid">'+
            F.field('Matric No. *',F.input('studentId',s.studentId,'text','required'))+
            F.field('Level',F.sel('level',levels,s.level))+
            F.field('First Name *',F.input('firstName',s.firstName,'text','required'))+
            F.field('Last Name *',F.input('lastName',s.lastName,'text','required'))+
            F.field('Date of Birth',F.input('dob',s.dob,'date'))+
            F.field('Gender',F.sel('gender',['Female','Male','Other'],s.gender))+
            F.field('Phone',F.input('phone',s.phone))+
            F.field('Email',F.input('email',s.email,'email'))+
            '</div></div>'+
            '<div class="form-section"><h4>Academic</h4><div class="form-grid">'+
            F.field('Faculty',F.sel('faculty',faculties,s.faculty))+
            F.field('Department',F.input('department',s.department))+
            '</div></div>'+
            '<div class="form-section"><h4>Medical</h4><div class="form-grid">'+
            F.field('Blood Group',F.sel('bloodGroup',blood,s.bloodGroup))+
            F.field('Genotype',F.sel('genotype',geno,s.genotype))+
            '<div class="span-2">'+F.field('Allergies (comma separated)',F.input('allergies',(s.allergies||[]).join(', ')))+'</div>'+
            '<div class="span-2">'+F.field('Chronic conditions',F.input('conditions',(s.conditions||[]).join(', ')))+'</div>'+
            '</div></div>'+
            '<div class="form-section"><h4>Emergency Contact</h4><div class="form-grid">'+
            F.field('Name',F.input('ec_name',s.emergency?.name))+
            F.field('Relationship',F.input('ec_relation',s.emergency?.relation))+
            '<div class="span-2">'+F.field('Phone',F.input('ec_phone',s.emergency?.phone))+'</div>'+
            '</div></div>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn primary">'+(isEdit?'Save':'Register')+'</button>',
        async onSubmit(form){
            const d=fd(form);
            if(!d.studentId.trim()||!d.firstName.trim()||!d.lastName.trim()){
                toast('Matric number, first name and last name required.','error');return}
            const payload={studentId:d.studentId.trim(),firstName:d.firstName.trim(),lastName:d.lastName.trim(),
                dob:d.dob,gender:d.gender,phone:d.phone,email:d.email,
                faculty:d.faculty,department:d.department,level:d.level,
                bloodGroup:d.bloodGroup,genotype:d.genotype,
                allergies:d.allergies.split(',').map(x=>x.trim()).filter(Boolean),
                conditions:d.conditions.split(',').map(x=>x.trim()).filter(Boolean),
                emergency:{name:d.ec_name,relation:d.ec_relation,phone:d.ec_phone}};
            try{
                if(isEdit)await updateStudent(student.id,payload);else await createStudent(payload);
                toast(isEdit?'Updated.':'Registered.');closeModal();
                const {rerender}=await import('../router.js');rerender();
            }catch(e){toast(e.message,'error')}}});
}

export async function nurseVisitModal(visit,onSaved){
    const isEdit=!!visit;
    const user=currentUser();
    // Fetch preselected student so the chip shows in edit mode
    let preselected=null;
    if(isEdit){
        if(API_ENABLED){
            try{preselected=await api.students.get(visit.studentId)}catch{preselected=null}
        } else {
            preselected=store.students.find(s=>String(s.id)===String(visit.studentId));
        }
    }
    const v=visit||{studentId:'',date:todayISO(),time:new Date().toTimeString().slice(0,5),
        vitals:{bp:'',temp:'',pulse:'',weight:'',spo2:''},attending:user?.name||'Nurse'};
    openModal({title:isEdit?'Edit Intake':'Record New Visit',size:'lg',
        body:'<div class="tl-box" style="margin-top:0;background:var(--info-50);border-color:#bfdbfe">'+
            '<strong style="font-size:12.5px">🩺 Nurse intake</strong>'+
            '<div class="muted small" style="margin-top:3px">Capture vitals and complaint. The doctor will diagnose and prescribe.</div></div>'+
            '<div class="form-section"><h4>Patient & Encounter</h4><div class="form-grid">'+
            '<div class="span-2">'+F.field('Student *',studentPickerHTML(preselected))+'</div>'+
            F.field('Date *',F.input('date',v.date,'date','required'))+
            F.field('Time',F.input('time',v.time,'time'))+
            '<div class="span-2">'+F.field('Attending',F.input('attending',v.attending,'text','readonly'))+'</div>'+
            '</div></div>'+
            '<div class="form-section"><h4>Vital Signs</h4><div class="form-grid">'+
            F.field('BP (mmHg)',F.input('bp',v.vitals.bp,'text','placeholder="120/80"'))+
            F.field('Temp (°C)',F.input('temp',v.vitals.temp,'text','placeholder="36.8"'))+
            F.field('Pulse (bpm)',F.input('pulse',v.vitals.pulse,'text','placeholder="72"'))+
            F.field('Weight (kg)',F.input('weight',v.vitals.weight,'text','placeholder="65"'))+
            F.field('SpO₂ (%)',F.input('spo2',v.vitals.spo2,'text','placeholder="98"'))+
            '</div></div>'+
            '<div class="form-section"><h4>Presenting Complaint</h4>'+
            F.field('What brings the student in? *',F.ta('complaint',v.complaint,'required placeholder="e.g. Fever, headache for 3 days"'))+'</div>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn primary">'+(isEdit?'Save Intake':'Submit to Doctor')+'</button>',
        onMount(root){bindStudentPicker(root)},
        async onSubmit(form){
            const d=fd(form);
            if(!d.studentId){toast('Select a student.','error');return}
            if(!d.complaint.trim()){toast('Complaint is required.','error');return}
            const payload={studentId:d.studentId,date:d.date,time:d.time||'00:00',
                complaint:d.complaint.trim(),attending:d.attending,
                vitals:{bp:d.bp||'',temp:d.temp||'',pulse:d.pulse||'',weight:d.weight||'',spo2:d.spo2||''}};
            try{
                if(isEdit)await updateVisit(visit.id,payload);else await createVisit(payload);
                toast(isEdit?'Intake updated.':'Visit created — awaiting doctor.');closeModal();onSaved?.();
            }catch(e){toast(e.message,'error')}}});
}

function rxRowHTML(){
    const opts=store.medications.filter(m=>(!m.expiryDate||new Date(m.expiryDate)>=new Date())&&m.quantity>0)
        .sort((a,b)=>a.name.localeCompare(b.name))
        .map(m=>({value:m.id,label:m.name+' '+m.strength+' — '+m.quantity+' '+m.unit}));
    if(!opts.length)return '<div class="tl-box">No medications in stock.</div>';
    return '<div class="rx-row">'+F.sel('rx_med',opts)+
        '<input class="input" name="rx_dose" placeholder="Dosage">'+
        '<input class="input" name="rx_freq" placeholder="Freq">'+
        '<input class="input" name="rx_days" type="number" min="1" placeholder="Days">'+
        '<input class="input" name="rx_qty" type="number" min="1" placeholder="Qty">'+
        '<button type="button" class="icon-btn danger" data-remove-rx>✕</button></div>';
}

export function doctorConsultModal(visit,onSaved){
    if(!visit)return;
    // Prefer embedded student, fall back to store
    const s=visit.student||store.students.find(x=>String(x.id)===String(visit.studentId));
    if(!s){toast('Student not found.','error');return}
    const allergyBlock=(s.allergies||[]).length?
        '<div class="tl-box" style="background:var(--danger-50);border-color:#fecdd3">'+
        '<strong style="font-size:12px;color:var(--danger)">⚠ KNOWN ALLERGIES</strong>'+
        '<div style="margin-top:4px">'+s.allergies.map(a=>'<span class="badge badge-danger">'+a+'</span>').join(' ')+'</div>'+
        '<div class="muted small" style="margin-top:5px">Server will block any cross-reacting prescription.</div></div>':
        '<div class="tl-box" style="background:var(--success-50);border-color:#bbf7d0">'+
        '<strong style="font-size:12px;color:var(--success)">✓ No known drug allergies</strong></div>';
    const v=visit.vitals||{};
    openModal({title:'Consultation — '+s.firstName+' '+s.lastName,size:'lg',
        body:'<div class="detail-grid" style="margin-bottom:16px">'+
            '<div class="detail"><span class="detail-label">Patient</span><span class="detail-value">'+s.firstName+' '+s.lastName+'</span></div>'+
            '<div class="detail"><span class="detail-label">Matric</span><span class="detail-value">'+s.studentId+'</span></div>'+
            '<div class="detail"><span class="detail-label">Age / Sex</span><span class="detail-value">'+(s.dob?new Date().getFullYear()-new Date(s.dob).getFullYear():'—')+' / '+s.gender+'</span></div>'+
            '<div class="detail"><span class="detail-label">Blood / Genotype</span><span class="detail-value">'+(s.bloodGroup||'—')+' / '+(s.genotype||'—')+'</span></div>'+
            '<div class="detail"><span class="detail-label">Date / Time</span><span class="detail-value">'+visit.date+' · '+visit.time+'</span></div>'+
            '<div class="detail"><span class="detail-label">Nurse</span><span class="detail-value">'+(visit.attending||'—')+'</span></div>'+
            '</div>'+allergyBlock+
            '<div class="form-section"><h4>Intake Summary (read-only)</h4>'+
            '<div class="detail-grid" style="margin-bottom:12px">'+
            '<div class="detail"><span class="detail-label">BP</span><span class="detail-value">'+(v.bp||'—')+' mmHg</span></div>'+
            '<div class="detail"><span class="detail-label">Temp</span><span class="detail-value">'+(v.temp||'—')+' °C</span></div>'+
            '<div class="detail"><span class="detail-label">Pulse</span><span class="detail-value">'+(v.pulse||'—')+' bpm</span></div>'+
            '<div class="detail"><span class="detail-label">Weight</span><span class="detail-value">'+(v.weight||'—')+' kg</span></div>'+
            '<div class="detail"><span class="detail-label">SpO₂</span><span class="detail-value">'+(v.spo2||'—')+'%</span></div>'+
            '</div>'+
            '<div class="tl-box"><strong style="font-size:11.5px;color:var(--muted);letter-spacing:.05em">PRESENTING COMPLAINT</strong>'+
            '<div style="margin-top:4px">'+(visit.complaint||'—')+'</div></div></div>'+
            '<div class="form-section"><h4>Clinical Assessment</h4><div class="form-grid">'+
            '<div class="span-2">'+F.field('Diagnosis *',F.input('diagnosis',visit.diagnosis,'text','required placeholder="e.g. Uncomplicated malaria"'))+'</div>'+
            '<div class="span-2">'+F.field('Treatment / Management',F.ta('treatment',visit.treatment,'placeholder="Drugs given, advice, follow-up…"'))+'</div>'+
            '<div class="span-2">'+F.field('Clinical Notes',F.ta('notes',visit.notes,'placeholder="Optional"'))+'</div>'+
            F.field('Outcome *',F.sel('status',[{value:'completed',label:'Completed'},{value:'referred',label:'Referred out'}],
                visit.status==='referred'?'referred':'completed'))+
            '</div></div>'+
            '<div class="form-section"><h4>Prescriptions</h4><div id="rx-container"></div>'+
            '<button type="button" class="btn sm ghost" id="add-rx">+ Add medication</button>'+
            '<p class="muted small" style="margin-top:8px">Sent to pharmacy as pending. Server checks allergy and stock.</p></div>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn primary">Complete Consultation</button>',
        onMount(root){
            const cont=$('#rx-container',root);
            const bind=el=>{const b=$('[data-remove-rx]',el);if(b)b.addEventListener('click',()=>el.remove())};
            $('#add-rx',root).addEventListener('click',()=>{
                const tmp=document.createElement('div');tmp.innerHTML=rxRowHTML();
                const row=tmp.firstElementChild;cont.appendChild(row);bind(row)});
        },
        async onSubmit(form){
            const d=fd(form);
            if(!d.diagnosis.trim()){toast('Diagnosis is required.','error');return}
            try{
                await updateVisit(visit.id,{diagnosis:d.diagnosis.trim(),treatment:d.treatment.trim(),
                    notes:d.notes.trim(),status:d.status});
                const rows=$$('.rx-row',form);let added=0;
                for(const row of rows){
                    const medId=$('[name="rx_med"]',row).value;
                    const qty=parseInt($('[name="rx_qty"]',row).value,10);
                    if(!medId||!qty||qty<1)continue;
                    const days=$('[name="rx_days"]',row).value.trim();
                    await createPrescription({visitId:visit.id,studentId:visit.studentId,
                        medicationId:medId,
                        dosage:$('[name="rx_dose"]',row).value.trim()||'1 unit',
                        frequency:$('[name="rx_freq"]',row).value.trim()||'As directed',
                        duration:days?days+' day'+(days>1?'s':''):'—',
                        quantity:qty,prescribedBy:currentUser()?.name||'Doctor'});
                    added++;
                }
                toast('Consultation saved.'+(added?' '+added+' prescription'+(added>1?'s':'')+' to pharmacy.':''));
                closeModal();onSaved?.();
            }catch(e){toast(e.message,'error')}}});
}
