import { store,persist,resetAll } from '../store.js';
import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { toast } from '../ui/toast.js';
import { confirmDialog } from '../ui/modal.js';
import { logout } from '../auth.js';
export const title='Settings';
export const roles=['admin'];
export function render(root){
    root.innerHTML='<div class="page-head"><div><h2>Settings</h2><p class="muted">Clinic configuration and data</p></div></div>'+
        '<div class="grid grid-2">'+
        '<div class="card"><div class="card-head"><h3>Clinic</h3></div><div class="card-body">'+
        '<div class="form-grid">'+
        '<label class="field"><span class="field-label">Clinic Name</span><input class="input" id="cn" value="'+store.settings.clinicName+'"></label>'+
        '<label class="field"><span class="field-label">Staff Name</span><input class="input" id="sn" value="'+store.settings.staffName+'"></label>'+
        '</div><button class="btn primary" style="margin-top:16px" id="save">'+icon('check')+' Save</button></div></div>'+
        '<div class="card"><div class="card-head"><h3>Data</h3></div><div class="card-body">'+
        '<div style="display:flex;flex-direction:column;gap:10px">'+
        '<button class="btn" id="exp">'+icon('download')+' Export JSON</button>'+
        '<button class="btn" id="imp">'+icon('upload')+' Import JSON</button>'+
        '<button class="btn danger" id="reset">'+icon('refresh')+' Reset to Demo</button>'+
        '<button class="btn" id="logout">'+icon('logout')+' Sign Out</button>'+
        '</div><input type="file" id="file" accept="application/json" hidden>'+
        '</div></div>'+
        (API_ENABLED?'<div class="card" style="margin-top:16px"><div class="card-head"><h3>Change Password</h3></div><div class="card-body">'+
            '<div class="form-grid">'+
            '<label class="field"><span class="field-label">Current password</span><input class="input" id="cp" type="password"></label>'+
            '<label class="field"><span class="field-label">New password</span><input class="input" id="np" type="password" minlength="8"></label>'+
            '</div><button class="btn primary" style="margin-top:14px" id="chpw">Update Password</button></div></div>':'')+
        '</div>';
    document.getElementById('save').addEventListener('click',()=>{
        store.settings.clinicName=document.getElementById('cn').value.trim()||'Gaposa';
        store.settings.staffName=document.getElementById('sn').value.trim()||'Staff';
        persist();toast('Saved.');location.reload()});
    document.getElementById('exp').addEventListener('click',()=>{
        const b=new Blob([JSON.stringify(store,null,2)],{type:'application/json'});
        const a=document.createElement('a');a.href=URL.createObjectURL(b);
        a.download='Gaposa-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();toast('Exported.')});
    document.getElementById('imp').addEventListener('click',()=>document.getElementById('file').click());
    document.getElementById('file').addEventListener('change',e=>{
        const f=e.target.files[0];if(!f)return;
        const r=new FileReader();r.onload=ev=>{
            try{const p=JSON.parse(ev.target.result);if(!p.students)throw new Error('Invalid');
                Object.assign(store,p);persist();toast('Imported.');location.reload()}
            catch{toast('Invalid file.','error')}};r.readAsText(f)});
    document.getElementById('reset').addEventListener('click',()=>{
        confirmDialog('Reset all data?','Replaced with demo.','Reset',()=>{
            resetAll();toast('Reset.','warn');location.reload()})});
    document.getElementById('logout').addEventListener('click',async()=>{await logout();location.reload()});
    if(API_ENABLED){
        const chpw=document.getElementById('chpw');
        if(chpw)chpw.addEventListener('click',async()=>{
            try{await api.users.changePassword(document.getElementById('cp').value,document.getElementById('np').value);
                toast('Password updated.');document.getElementById('cp').value='';document.getElementById('np').value=''}
            catch(e){toast(e.message,'error')}});
    }
}
