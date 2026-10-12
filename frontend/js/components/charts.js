export function weekChart(visits){
    const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+(i-6));
        return d.toISOString().slice(0,10)});
    const counts=days.map(d=>visits.filter(v=>v.date===d).length);
    const max=Math.max(1,...counts);
    return '<div class="chart-cols">'+days.map((d,i)=>'<div class="chart-col">'+
        '<div class="chart-bar" style="height:'+Math.max(4,counts[i]/max*100)+'%"><span>'+counts[i]+'</span></div>'+
        '<div class="chart-day">'+new Date(d+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short'})+'</div></div>').join('')+'</div>';
}
export function donut(segments,cv,cl){
    const total=Math.max(1,segments.reduce((s,x)=>s+x.value,0));let acc=0;
    const stops=segments.map(s=>{const from=acc/total*360;acc+=s.value;const to=acc/total*360;
        return s.color+' '+from+'deg '+to+'deg'}).join(', ');
    return '<div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap">'+
        '<div class="donut" style="background:conic-gradient('+stops+')"><div class="donut-inner">'+
        '<div style="font-size:19px;font-weight:800;line-height:1">'+cv+'</div>'+
        '<div class="muted" style="font-size:10.5px">'+cl+'</div></div></div>'+
        '<div class="legend">'+segments.map(s=>'<div class="legend-item"><span class="legend-dot" style="background:'+s.color+'"></span>'+
        s.label+'<strong style="margin-left:auto">'+s.value+'</strong></div>').join('')+'</div></div>';
}
export function barList(items,color='#0d9488'){
    if(!items.length)return '<p class="muted small">No data yet.</p>';
    const max=Math.max(...items.map(i=>i.value),1);
    return '<div class="bars">'+items.map(i=>'<div class="bar-row"><div class="bar-label" title="'+i.label+'">'+i.label+'</div>'+
        '<div class="bar-track"><div class="bar-fill" style="width:'+Math.max(2,i.value/max*100)+'%;background:'+color+'"></div></div>'+
        '<div class="bar-value">'+i.value+'</div></div>').join('')+'</div>';
}
