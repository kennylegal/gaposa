import { seed } from './data/seed.js';
import { api,API_ENABLED } from './api.js';
import { record as auditRecord } from './audit.js';
import { currentUser } from './auth.js';
import { uid } from './ui/dom.js';
import { todayISO } from './ui/format.js';
const KEY='Gaposa_db_v2';
export const store={students:[],medications:[],visits:[],prescriptions:[],
    audit:[],notificationsSeen:[],
    settings:{clinicName:'Gaposa',staffName:'Dr. A. Bello',
        staffRole:'Clinic Officer',staffInitials:'AB'}};
window.__store=store;
function loadLocal(){
    try{const r=localStorage.getItem(KEY);if(r){const d=JSON.parse(r);if(d&&d.students)return d}}catch{}
    return seed();
}
export function persist(){if(API_ENABLED)return;try{localStorage.setItem(KEY,JSON.stringify(store))}catch{}}
export async function loadAll(){
    if(API_ENABLED){
        // API mode: don't bulk-load students/visits/prescriptions.
        // Views fetch what they need on demand.
        const [medications]=await Promise.all([
            api.medications.list({page_size:200}),
           ,
        ]);
        Object.assign(store,{
            students:[],visits:[],prescriptions:[],audit:[],
            medications:medications.results.map(m=>({...m,unitCost:Number(m.unitCost)})),
            
        });
    } else {
        Object.assign(store,loadLocal());
        for(const k of ['audit','notificationsSeen'])
            if(!Array.isArray(store[k]))store[k]=[];
    }
}
export function resetAll(){Object.assign(store,seed());persist()}
// ID-safe lookups: normalize both sides to string
export const studentById=id=>store.students.find(s=>String(s.id)===String(id));
export const medById=id=>store.medications.find(m=>String(m.id)===String(id));
export const visitById=id=>store.visits.find(v=>String(v.id)===String(id));
export const studentName=id=>{const s=studentById(id);return s?s.firstName+' '+s.lastName:'Unknown'};
export function commit(action,target,details){
    if(API_ENABLED)return;
    auditRecord(store,{action,target,details,user:currentUser()});persist();
}
// Students
export async function createStudent(p){
    if(API_ENABLED){const s=await api.students.create(p);return s}
    const s={id:uid('s'),registeredAt:todayISO(),...p};
    store.students.push(s);commit('student.create',s.studentId,s.firstName+' '+s.lastName);return s;
}
export async function updateStudent(id,p){
    if(API_ENABLED)return api.students.update(id,p);
    const s=studentById(id);if(!s)throw new Error('Not found');
    Object.assign(s,p);commit('student.update',s.studentId,'');return s;
}
export async function deleteStudent(id){
    if(API_ENABLED){await api.students.remove(id);return}
    store.students=store.students.filter(s=>String(s.id)!==String(id));
    store.visits=store.visits.filter(v=>String(v.studentId)!==String(id));
    store.prescriptions=store.prescriptions.filter(p=>String(p.studentId)!==String(id));
    commit('student.delete',id,'');
}
// Visits
export async function createVisit(p){
    if(API_ENABLED){const v=await api.visits.create(p);return v}
    const v={id:uid('v'),status:'awaiting_doctor',...p};
    store.visits.push(v);commit('visit.create',v.studentId,v.complaint);return v;
}
export async function updateVisit(id,p){
    if(API_ENABLED)return api.visits.update(id,p);
    const v=visitById(id);if(!v)throw new Error('Not found');
    Object.assign(v,p);commit('visit.update',v.id,v.status);return v;
}
export async function deleteVisit(id){
    if(API_ENABLED){await api.visits.remove(id);return}
    store.visits=store.visits.filter(v=>String(v.id)!==String(id));
    store.prescriptions=store.prescriptions.filter(p=>String(p.visitId)!==String(id));
    commit('visit.delete',id,'');
}
// Prescriptions
export async function createPrescription(p){
    if(API_ENABLED){const x=await api.prescriptions.create(p);return x}
    const x={id:uid('p'),status:'pending',dispensedAt:null,dispensedBy:null,...p};
    store.prescriptions.push(x);commit('rx.create',x.studentId,x.dosage);return x;
}
export async function dispenseRx(rxId,quantity){
    if(API_ENABLED){
        const rx=await api.prescriptions.dispense(rxId,{quantity});
        const m=medById(rx.medicationId);if(m)m.quantity=Math.max(0,m.quantity-rx.quantity);
        return rx;
    }
    const rx=store.prescriptions.find(p=>String(p.id)===String(rxId));if(!rx)throw new Error('Not found');
    const m=medById(rx.medicationId);if(!m)throw new Error('Medication missing');
    if(m.quantity<quantity)throw new Error('Insufficient stock. Available: '+m.quantity);
    m.quantity-=quantity;rx.quantity=quantity;rx.status='dispensed';
    rx.dispensedAt=new Date().toISOString();
    rx.dispensedBy=currentUser()?.name||'Pharmacy';
    commit('rx.dispense',m.name,quantity+' units');return rx;
}
export async function cancelRx(rxId){
    if(API_ENABLED)return api.prescriptions.cancel(rxId);
    const rx=store.prescriptions.find(p=>String(p.id)===String(rxId));if(!rx)throw new Error('Not found');
    rx.status='cancelled';commit('rx.cancel',rx.studentId,'');return rx;
}
// Inventory
export async function restockMedication(id,{quantity,batchNo,expiryDate,supplier,unitCost}){
    if(API_ENABLED)return api.medications.restock(id,{quantity,batchNo,expiryDate,supplier,unitCost});
    const m=medById(id);if(!m)throw new Error('Not found');
    m.quantity+=quantity;
    if(batchNo)m.batchNo=batchNo;if(expiryDate)m.expiryDate=expiryDate;
    if(supplier)m.supplier=supplier;if(unitCost!=null)m.unitCost=unitCost;
    commit('inventory.restock',m.name,'+'+quantity);return m;
}

