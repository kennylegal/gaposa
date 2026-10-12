import { api,API_ENABLED,setTokens,clearTokens,hasToken } from './api.js';
export const ROLES={
    admin:{label:'Administrator',desc:'Full system access',icon:'shield',perms:['*']},
    doctor:{label:'Doctor',desc:'Consult, diagnose, prescribe',icon:'heart',
        perms:['visit.read','visit.update','rx.view','rx.create','student.view','student.edit','lab.*']},
    nurse:{label:'Nurse',desc:'Intake, vitals, triage',icon:'activity',
        perms:['visit.read','visit.create','visit.update','rx.view','student.view','lab.*']},
    pharmacist:{label:'Pharmacist',desc:'Dispense, inventory control',icon:'pill',
        perms:['rx.view','rx.dispense','rx.cancel','inventory.*','student.view']},
    receptionist:{label:'Receptionist',desc:'Registration, records',icon:'calendar',
        perms:['student.*','visit.read']}};
const SK='Gaposa_session';
let session=null;
export const getSession=()=>session;
export const currentUser=()=>session;
export const currentRole=()=>session?session.role:null;
export function can(perm){
    if(!session)return false;
    const list=ROLES[session.role]?.perms||[];
    if(list.includes('*'))return true;
    const [g]=perm.split('.');
    return list.includes(perm)||list.includes(g+'.*');
}
function build(u){
    const name=u.name||u.username;
    return {id:u.id,role:u.role,name,label:ROLES[u.role]?.label||u.role,
        initials:name.split(/\s+/).filter(Boolean).slice(-2).map(w=>w[0]).join('').toUpperCase().slice(0,3),
        signedInAt:new Date().toISOString()};
}
export async function login(username,password){
    if(API_ENABLED){
        const d=await api.auth.login(username,password);
        setTokens(d.access,d.refresh);session=build(d.user);
    } else {
        if(!ROLES[username])throw new Error('Unknown role');
        if(password!==username+'123'&&password!=='demo')throw new Error('Invalid password');
        session=build({id:0,username,role:username,
            name:{admin:'System Administrator',doctor:'Dr. A. Bello',nurse:'Nurse F. Adeyemi',
                pharmacist:'Pharm. J. Okafor',receptionist:'Ms. R. Yusuf'}[username]||username});
    }
    sessionStorage.setItem(SK,JSON.stringify(session));return session;
}
export async function logout(){
    try{if(API_ENABLED)await api.auth.logout()}catch{}
    clearTokens();session=null;sessionStorage.removeItem(SK);
}
export async function restore(){
    if(API_ENABLED){
        if(!hasToken())return false;
        try{const u=await api.auth.me();session=build(u);
            sessionStorage.setItem(SK,JSON.stringify(session));return true}catch{clearTokens();return false}
    }
    try{const r=sessionStorage.getItem(SK);if(r){session=JSON.parse(r);return true}}catch{}
    return false;
}
