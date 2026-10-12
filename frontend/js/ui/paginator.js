export function renderPaginator(host,meta,onPage){
    if(!meta||meta.count===0){host.innerHTML='';return}
    const {count,page,pages,page_size}=meta;
    const from=(page-1)*(page_size||25)+1;
    const to=Math.min(count,from+(page_size||25)-1);
    const win=5;let start=Math.max(1,page-Math.floor(win/2));let end=Math.min(pages,start+win-1);
    start=Math.max(1,end-win+1);
    const nums=[];
    for(let i=start;i<=end;i++)nums.push('<button class="btn sm '+(i===page?'primary':'ghost')+'" data-page="'+i+'">'+i+'</button>');
    host.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;border-top:1px solid var(--border);flex-wrap:wrap">'+
        '<span class="muted small">Showing '+from+'–'+to+' of '+count+'</span>'+
        '<div style="display:flex;gap:4px;align-items:center">'+
        '<button class="btn sm ghost" data-page="'+(page-1)+'" '+(page<=1?'disabled':'')+'>‹</button>'+
        nums.join('')+'<button class="btn sm ghost" data-page="'+(page+1)+'" '+(page>=pages?'disabled':'')+'>›</button>'+
        '</div></div>';
    host.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>{
        if(b.disabled)return;const p=parseInt(b.dataset.page,10);if(p>=1&&p<=pages)onPage(p)}));
}
