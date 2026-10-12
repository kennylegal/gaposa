import { todayISO,daysUntil } from './ui/format.js';
export function derive(db){
    const out=[];const today=todayISO();
    (db.medications||[]).forEach(m=>{
        if(m.expiryDate&&daysUntil(m.expiryDate)<0)
            out.push({id:'exp_'+m.id,kind:'danger',icon:'alert',title:m.name+' expired',sub:'Expired '+m.expiryDate});
        else if(m.expiryDate&&daysUntil(m.expiryDate)<=90)
            out.push({id:'soon_'+m.id,kind:'warn',icon:'calendar',title:m.name+' expiring soon',sub:daysUntil(m.expiryDate)+' days left'});
        if(m.quantity<=m.reorderLevel)
            out.push({id:'low_'+m.id,kind:'warn',icon:'box',title:m.name+' low on stock',sub:m.quantity+' '+m.unit+' left'});
    });
    const awaiting=(db.visits||[]).filter(v=>v.status==='awaiting_doctor').length;
    if(awaiting>0)out.push({id:'awaiting',kind:'info',icon:'clipboard',
        title:awaiting+' visit'+(awaiting===1?'':'s')+' awaiting doctor',sub:'Pending consultation'});
    const pending=(db.prescriptions||[]).filter(p=>p.status==='pending').length;
    if(pending>0)out.push({id:'rx_pending',kind:'warn',icon:'pill',
        title:pending+' prescription'+(pending===1?'':'s')+' pending',sub:'Awaiting pharmacist'});
    return out;
}
export const unreadCount=(db,seen)=>derive(db).filter(n=>!seen.has(n.id)).length;
