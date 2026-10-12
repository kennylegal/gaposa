const MAX=500;
export function record(db,{action,target,details,user}){
    if(!db.audit)db.audit=[];
    db.audit.unshift({id:'a_'+Date.now().toString(36),at:new Date().toISOString(),
        action,target:target||'',details:details||'',
        user:user?user.name+' ('+user.role+')':'system'});
    if(db.audit.length>MAX)db.audit.length=MAX;
}
