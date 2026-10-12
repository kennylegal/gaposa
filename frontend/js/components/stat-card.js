import { icon } from '../ui/icons.js';
export const statCard=({tone,icon:ic,label,value,sub})=>'<div class="stat"><div class="stat-ico '+tone+'">'+icon(ic)+'</div><div>'+
    '<div class="stat-val">'+value+'</div><div class="stat-label">'+label+'</div>'+
    (sub?'<div class="small muted" style="margin-top:2px">'+sub+'</div>':'')+'</div></div>';
