import { esc } from '../ui/dom.js';
import { store } from '../store.js';
import { api,API_ENABLED } from '../api.js';

export function studentPickerHTML(selected){
    const chip=selected?'<div class="picker-chip" data-chip><span><strong>'+esc(selected.firstName)+' '+
        esc(selected.lastName)+'</strong> <span class="muted small">· '+esc(selected.studentId)+
        '</span></span><button type="button" data-clear-chip aria-label="Clear">✕</button></div>':'';
    return '<div class="student-picker" data-picker>'+
        '<input type="hidden" name="studentId" value="'+(selected?.id?esc(String(selected.id)):'')+'">'+
        '<div data-chip-slot>'+chip+'</div>'+
        '<input class="input" data-picker-input type="text" autocomplete="off" '+
        'placeholder="Search by name or matric number…" value="" '+(selected?.id?'hidden':'')+'>'+
        '<div class="picker-results" data-results hidden></div></div>';
}

async function searchStudents(q){
    if(API_ENABLED)return api.students.lookup(q);
    const term=q.trim().toLowerCase();
    if(!term)return [];
    return store.students.filter(s=>(s.firstName+' '+s.lastName+' '+s.studentId+' '+(s.department||''))
        .toLowerCase().includes(term)).slice(0,20)
        .map(s=>({id:s.id,studentId:s.studentId,firstName:s.firstName,lastName:s.lastName,
            department:s.department,faculty:s.faculty,level:s.level}));
}

export function bindStudentPicker(root,onPick){
    const wrap=root.querySelector('[data-picker]');
    if(!wrap)return;
    const hidden=wrap.querySelector('input[name="studentId"]');
    const input=wrap.querySelector('[data-picker-input]');
    const chipSlot=wrap.querySelector('[data-chip-slot]');
    const results=wrap.querySelector('[data-results]');
    let timer,currentResults=[];

    function render(list){
        currentResults=list;results.hidden=false;
        if(!list.length){results.innerHTML='<div class="picker-result muted">No matches</div>';return}
        results.innerHTML=list.map(s=>'<div class="picker-result" data-id="'+esc(String(s.id))+'">'+
            '<strong>'+esc(s.firstName)+' '+esc(s.lastName)+'</strong>'+
            '<div class="muted small">'+esc(s.studentId)+' · '+esc(s.department||'')+'</div></div>').join('');
        results.querySelectorAll('[data-id]').forEach(el=>el.addEventListener('mousedown',e=>{
            e.preventDefault();
            const s=currentResults.find(x=>String(x.id)===String(el.dataset.id));
            if(s)pick(s)}));
    }

    async function runSearch(q){
        if(!q.trim()){results.hidden=true;return}
        results.hidden=false;results.innerHTML='<div class="picker-result muted">Searching…</div>';
        try{render(await searchStudents(q))}
        catch(e){results.innerHTML='<div class="picker-result muted">Error: '+esc(e.message)+'</div>'}
    }

    function pick(s){
        hidden.value=String(s.id);
        chipSlot.innerHTML='<div class="picker-chip" data-chip><span><strong>'+esc(s.firstName)+' '+esc(s.lastName)+
            '</strong> <span class="muted small">· '+esc(s.studentId)+'</span></span>'+
            '<button type="button" data-clear-chip aria-label="Clear">✕</button></div>';
        input.value='';input.hidden=true;results.hidden=true;
        chipSlot.querySelector('[data-clear-chip]').addEventListener('click',clear);
        onPick?.(s);
    }

    function clear(){
        hidden.value='';chipSlot.innerHTML='';input.hidden=false;input.value='';input.focus();
        onPick?.(null);
    }

    input.addEventListener('input',e=>{clearTimeout(timer);
        const q=e.target.value;timer=setTimeout(()=>runSearch(q),200)});
    input.addEventListener('focus',()=>{if(input.value.trim().length>=2)runSearch(input.value)});
    document.addEventListener('mousedown',e=>{if(!wrap.contains(e.target))results.hidden=true});
    const chip=chipSlot.querySelector('[data-clear-chip]');
    if(chip)chip.addEventListener('click',clear);
}
