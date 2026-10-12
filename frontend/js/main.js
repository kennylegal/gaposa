import { register,start } from './router.js';
import { loadAll,store } from './store.js';
import { icon } from './ui/icons.js';
import { $ } from './ui/dom.js';
import { init as initTheme,toggle as toggleTheme,currentTheme } from './theme.js';
import { ROLES,restore,currentUser,logout } from './auth.js';
import * as commandPalette from './ui/command-palette.js';
import { derive as deriveNotifs } from './notifications.js';
import { renderLogin } from './views/login.js';
import * as dashboard from './views/dashboard.js';
import * as students from './views/students.js';
import * as studentProfile from './views/student-profile.js';
import * as visits from './views/visits.js';
import * as pharmacy from './views/pharmacy.js';
import * as inventory from './views/inventory.js';
// import * as lab from './views/lab.js';
import * as reports from './views/reports.js';
import * as audit from './views/audit.js';
import * as users from './views/users.js';
import * as trash from './views/trash.js';
import * as settings from './views/settings.js';
const NAV=[
    {route:'dashboard',label:'Dashboard',icon:'grid',roles:['admin','doctor','nurse','pharmacist','receptionist']},
    {route:'students',label:'Students',icon:'users',roles:['admin','doctor','nurse','pharmacist','receptionist']},
    {route:'visits',label:'Clinic Visits',icon:'clipboard',roles:['admin','doctor','nurse','pharmacist','receptionist']},
    {route:'pharmacy',label:'Pharmacy',icon:'pill',roles:['admin','doctor','nurse','pharmacist']},
    {route:'inventory',label:'Inventory',icon:'box',roles:['admin','doctor','nurse','pharmacist']},
    {route:'audit',label:'Audit Log',icon:'history',roles:['admin']},
    {route:'users',label:'Users',icon:'shield',roles:['admin']},
    {route:'trash',label:'Trash',icon:'trash',roles:['admin']},
    {route:'settings',label:'Settings',icon:'gear',roles:['admin']}];
initTheme();
function showLogin(){
    document.getElementById('login-screen').style.display='flex';
    document.getElementById('app').style.display='none';renderLogin();
}

function addLogoutButton() {
    const app = document.getElementById('app');
    if (!app) return;

    // Prevent duplicate buttons if showApp() runs more than once.
    let button = document.getElementById('logout-btn');

    if (!button) {
        button = document.createElement('button');
        button.id = 'logout-btn';
        button.type = 'button';
        button.textContent = '↪ Logout';

        // Keep the button visible without requiring an HTML edit.
        Object.assign(button.style, {
            position: 'fixed',
            top: '16px',
            right: '20px',
            zIndex: '10000',
            padding: '9px 16px',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            background: '#ffffff',
            color: '#be123c',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.08)'
        });

        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = 'Logging out...';
            button.style.cursor = 'wait';

            try {
                await logout();

                // Re-run startup so restore() determines the new session.
                window.location.reload();
            } catch (error) {
                console.error('Gaposa logout failed:', error);

                button.disabled = false;
                button.textContent = '↪ Logout';
                button.style.cursor = 'pointer';

                alert('Logout failed. Please try again.');
            }
        });

        app.appendChild(button);
    }

    button.hidden = false;
}

function showApp(){
    document.getElementById('login-screen').style.display='none';
    document.getElementById('app').style.display='flex';

    addLogoutButton();
    const u=currentUser();
    document.getElementById('user-avatar').textContent=u.initials;
    document.getElementById('user-name').textContent=u.name;
    document.getElementById('user-role').textContent=u.label;
    document.getElementById('foot-role').textContent=u.label;
    document.getElementById('brand-name').textContent=store.settings.clinicName;
    document.getElementById('foot-user').textContent='Signed in as '+u.name;
    document.getElementById('nav').innerHTML='<div class="nav-label">Main</div>'+
        NAV.filter(i=>i.roles.includes(u.role)).map(i=>'<a class="nav-item" data-route="'+i.route+'" href="#/'+i.route+'">'+
            icon(i.icon)+'<span>'+i.label+'</span></a>').join('');
    register('dashboard',dashboard);register('students',students);register('student',studentProfile);
    register('visits',visits);register('pharmacy',pharmacy);register('inventory',inventory);
    register('reports',reports);register('audit',audit);
    register('users',users);register('trash',trash);register('settings',settings);
    commandPalette.init();start();updateNotifDot();

}


function updateNotifDot(){
    const seen=new Set(store.notificationsSeen||[]);
    const dot=document.getElementById('notif-dot');
    if(dot)dot.hidden=deriveNotifs(store).every(n=>seen.has(n.id));
}
$('#menu-btn').innerHTML=icon('menu');
$('#cmdk-btn').innerHTML=icon('command');
$('#notif-btn').innerHTML=icon('bell');
$('#theme-btn').innerHTML=icon(currentTheme()==='dark'?'sun':'moon');
$('#menu-btn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
$('#cmdk-btn').addEventListener('click',commandPalette.toggle);
$('#theme-btn').addEventListener('click',()=>{
    const t=toggleTheme();
    $('#theme-btn').innerHTML=icon(t==='dark'?'sun':'moon')});
$('#notif-btn').addEventListener('click',async()=>{
    const items=deriveNotifs(store);
    store.notificationsSeen=items.map(n=>n.id);
    try{localStorage.setItem('Gaposa_db_v2',JSON.stringify(store))}catch{}
    updateNotifDot();
    const { openModal }=await import('./ui/modal.js');
    openModal({title:'Notifications',
        body:items.length?items.map(n=>'<div class="alert-row"><div class="alert-ico '+
            (n.kind==='danger'?'danger':n.kind==='warn'?'warn':'info')+'">'+icon(n.icon)+'</div>'+
            '<div style="flex:1"><div style="font-weight:600">'+n.title+'</div>'+
            '<div class="muted small">'+n.sub+'</div></div></div>').join(''):
            '<div class="empty"><div class="empty-ico">'+icon('check')+'</div><strong>All clear</strong></div>'});
});
(async () => {
  try {
    // First check for a valid existing login.
    const restored = await restore();

    if (restored && currentUser()) {
      // Fetch protected data only after authentication.
      await loadAll();
      showApp();
    } else {
      // No valid login: show the login screen without
      // requesting protected API endpoints.
      showLogin();
    }
  } catch (e) {
    console.error('Gaposa startup failed:', e);
    document.body.innerHTML =
      '<div style="padding:40px;font-family:system-ui">' +
      '<h2>Gaposa startup failed</h2>' +
      '<p>' + String(e.message || e) + '</p>' +
      '<p>Check the Django server and browser console.</p>' +
      '</div>';
  }
})();

