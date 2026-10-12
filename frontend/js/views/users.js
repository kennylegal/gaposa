import { api,API_ENABLED } from '../api.js';
import { icon } from '../ui/icons.js';
import { esc } from '../ui/dom.js';
import { toast } from '../ui/toast.js';
import { openModal,closeModal,confirmDialog } from '../ui/modal.js';
import { renderPaginator } from '../ui/paginator.js';
export const title='Users';
export const roles=['admin'];
const state={q:'',page:1,page_size:25};
let meta={count:0,page:1,pages:1,page_size:25};
const ROLES_OPT=[{value:'admin',label:'Administrator'},{value:'doctor',label:'Doctor'},
    {value:'nurse',label:'Nurse'},{value:'pharmacist',label:'Pharmacist'},{value:'receptionist',label:'Receptionist'}];
export async function render(root){
    if(!API_ENABLED){
        root.innerHTML='<div class="card"><div class="empty"><div class="empty-ico">'+icon('shield')+'</div>'+
            '<strong>User management requires API</strong><p class="muted small">Set API_ENABLED = true.</p></div></div>';return}
    root.innerHTML='<div class="page-head"><div><h2>Users</h2><p class="muted" id="cnt">Loading…</p></div>'+
        '<div class="page-head-actions"><button class="btn primary" id="new">'+icon('plus')+' New User</button></div></div>'+
        '<div class="card"><div class="toolbar">'+
        '<div class="search">'+icon('search')+'<input class="input" id="q" placeholder="Search username…" value="'+esc(state.q)+'"></div>'+
        '</div><div class="table-wrap" id="tbl"></div><div id="pager"></div></div>';
    const load=async()=>{
        const tbl=document.getElementById('tbl');
        try{
            const p={page:state.page,page_size:state.page_size};if(state.q)p.search=state.q;
            const res=await api.users.list(p);meta=res;
            document.getElementById('cnt').textContent=meta.count+' user'+(meta.count===1?'':'s');
            tbl.innerHTML=res.results.length?'<table class="table"><thead><tr>'+
                '<th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>'+
                res.results.map(u=>'<tr><td><strong>'+esc(u.name||u.username)+'</strong></td>'+
                    '<td><code>'+esc(u.username)+'</code></td>'+
                    '<td class="muted">'+esc(u.email||'—')+'</td>'+
                    '<td><span class="badge badge-info">'+esc(u.role||'—')+'</span></td>'+
                    '<td>'+(u.is_active?'<span class="badge badge-success">Active</span>':'<span class="badge badge-neutral">Disabled</span>')+'</td>'+
                    '<td class="right"><button class="icon-btn" data-edit="'+u.id+'">'+icon('edit')+'</button>'+
                    '<button class="icon-btn" data-pw="'+u.id+'">'+icon('key')+'</button>'+
                    '<button class="icon-btn" data-toggle="'+u.id+'">'+(u.is_active?icon('close'):icon('check'))+'</button>'+
                    '<button class="icon-btn danger" data-del="'+u.id+'">'+icon('trash')+'</button></td></tr>').join('')+
                '</tbody></table>':'<div class="empty"><div class="empty-ico">'+icon('users')+'</div><strong>No users</strong></div>';
            tbl.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editModal(res.results.find(u=>String(u.id)===String(b.dataset.edit)),load)));
            tbl.querySelectorAll('[data-pw]').forEach(b=>b.addEventListener('click',()=>pwModal(res.results.find(u=>String(u.id)===String(b.dataset.pw)))));
            tbl.querySelectorAll('[data-toggle]').forEach(b=>b.addEventListener('click',async()=>{
                try{await api.users.toggleActive(b.dataset.toggle);load()}catch(e){toast(e.message,'error')}}));
            tbl.querySelectorAll('[data-del]').forEach(b=>b.addEventListener('click',()=>{
                confirmDialog('Delete user?','Cannot be undone.','Delete',async()=>{
                    try{await api.users.remove(b.dataset.del);toast('Deleted.','warn');load()}
                    catch(e){toast(e.message,'error')}})}));
            renderPaginator(document.getElementById('pager'),meta,p=>{state.page=p;load()});
        }catch(e){tbl.innerHTML='<div class="empty"><strong>Failed</strong><p class="muted small">'+esc(e.message)+'</p></div>'}
    };
    let t;
    document.getElementById('q').addEventListener('input',e=>{clearTimeout(t);
        t=setTimeout(()=>{state.q=e.target.value;state.page=1;load()},250)});
    document.getElementById('new').addEventListener('click',()=>createModal(load));
    await load();
}
function createModal(onDone){
    openModal({title:'Create User',
        body:'<div class="form-grid">'+
            '<label class="field"><span class="field-label">Username *</span><input class="input" name="username" required></label>'+
            '<label class="field"><span class="field-label">Role *</span><select class="input" name="role">'+
            ROLES_OPT.map(r=>'<option value="'+r.value+'">'+r.label+'</option>').join('')+'</select></label>'+
            '<label class="field"><span class="field-label">First Name</span><input class="input" name="first_name"></label>'+
            '<label class="field"><span class="field-label">Last Name</span><input class="input" name="last_name"></label>'+
            '<div class="span-2"><label class="field"><span class="field-label">Email</span><input class="input" name="email" type="email"></label></div>'+
            '<div class="span-2"><label class="field"><span class="field-label">Password *</span><input class="input" name="password" type="password" minlength="8" required></label></div>'+
            '</div>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn primary">Create</button>',
        async onSubmit(form){
            const d=Object.fromEntries(new FormData(form).entries());
            try{await api.users.create(d);toast('Created.');closeModal();onDone()}
            catch(e){toast(e.message,'error')}}});
}
function editModal(u,onDone){
    openModal({title:'Edit '+u.username,
        body:'<div class="form-grid">'+
            '<label class="field"><span class="field-label">Role</span><select class="input" name="role">'+
            ROLES_OPT.map(r=>'<option value="'+r.value+'"'+(u.role===r.value?' selected':'')+'>'+r.label+'</option>').join('')+'</select></label>'+
            '<label class="field"><span class="field-label">Email</span><input class="input" name="email" value="'+esc(u.email||'')+'"></label>'+
            '<label class="field"><span class="field-label">First Name</span><input class="input" name="first_name" value="'+esc(u.first_name||'')+'"></label>'+
            '<label class="field"><span class="field-label">Last Name</span><input class="input" name="last_name" value="'+esc(u.last_name||'')+'"></label>'+
            '</div>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn primary">Save</button>',
        async onSubmit(form){
            const d=Object.fromEntries(new FormData(form).entries());
            try{await api.users.update(u.id,{...d,is_active:u.is_active});toast('Updated.');closeModal();onDone()}
            catch(e){toast(e.message,'error')}}});
}
function pwModal(u){
    openModal({title:'Reset password — '+u.username,size:'sm',
        body:'<label class="field"><span class="field-label">New password</span>'+
            '<input class="input" name="np" type="password" minlength="8" required></label>',
        footer:'<button type="button" class="btn ghost" data-modal-close>Cancel</button>'+
            '<button type="submit" class="btn primary">Reset</button>',
        async onSubmit(form){
            const d=Object.fromEntries(new FormData(form).entries());
            try{const r=await api.users.resetPassword(u.id,d.np);toast(r.message||'Reset.');closeModal()}
            catch(e){toast(e.message,'error')}}});
}
