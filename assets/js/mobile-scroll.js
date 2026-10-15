"use strict";
(()=>{
 window.PcpMobileScroll={
  active(){return matchMedia('(max-width:767px)').matches;},
  table(box,{latest=false,snap=0}={}){
   if(!this.active())return;
   let control=box.__pcpMobileTable;
   if(!control){
    const shell=document.createElement('div');shell.className='pcp-mobile-table-shell';box.before(shell);shell.append(box);const range=document.createElement('input');range.type='range';range.min=0;range.step=1;range.className='pcp-mobile-scroll-range';range.setAttribute('aria-label','Rolar tabela horizontalmente');shell.append(range);
    control=box.__pcpMobileTable={range,options:{},signature:null};
    control.sync=(reset=false)=>{const max=Math.max(0,box.scrollWidth-box.clientWidth);range.max=max;range.disabled=max<1;if(reset)box.scrollLeft=control.options.latest?max:0;range.value=box.scrollLeft;range.style.setProperty('--pcp-scroll-thumb',Math.max(36,Math.min(100,box.clientWidth*box.clientWidth/Math.max(1,box.scrollWidth)))+'px');};
    range.oninput=()=>box.scrollLeft=Number(range.value);range.onchange=()=>{const step=control.options.snap;if(step>0)box.scrollLeft=Math.round(box.scrollLeft/step)*step;control.sync();};box.addEventListener('scroll',()=>range.value=box.scrollLeft,{passive:true});const observer=new ResizeObserver(()=>control.sync());observer.observe(box);control.observer=observer;
   }
   control.options={latest,snap};const signature=box.querySelector('thead')?.textContent||'';control.sync(control.signature!==signature);control.signature=signature;
  },
  config(chart,count,changed,{left=48,right=22,filterMode='none'}={}){
   let control=chart.__pcpMobileScroll;
   if(!control){
    const element=chart.getDom();let host=element.parentElement;
    if(!host.classList.contains('pcp-comparativo-chart-scroll')){host=document.createElement('div');element.before(host);host.append(element);}
    host.classList.add('pcp-mobile-scroll-host');const range=document.createElement('input');range.type='range';range.min=0;range.step=1;range.className='pcp-mobile-scroll-range';range.setAttribute('aria-label','Arrastar período do gráfico para consultar o histórico');host.append(range);control=chart.__pcpMobileScroll={range,count:0};
    range.oninput=()=>{if(!chart.getOption()?.series?.length)return;const start=Number(range.value);chart.dispatchAction({type:'dataZoom',dataZoomIndex:0,startValue:start,endValue:Math.min(control.count-1,start+3)});};
    chart.on('datazoom',()=>{const start=chart.getOption()?.dataZoom?.[0]?.startValue;if(Number.isFinite(start))range.value=start;});
   }
   const maximum=Math.max(0,count-4),previous=chart.getOption()?.dataZoom?.[0]?.startValue,start=changed?maximum:Math.min(maximum,Number.isFinite(previous)?previous:maximum),range=control.range;
   control.count=count;range.max=maximum;range.value=start;range.disabled=maximum===0;range.style.left=left+'px';range.style.right=right+'px';range.style.width='calc(100% - '+(left+right)+'px)';range.style.setProperty('--pcp-scroll-thumb',Math.max(32,Math.min(90,(chart.getDom().clientWidth-left-right)*Math.min(1,4/Math.max(1,count))))+'px');
   return [{id:'mobile-period-scroll',type:'slider',show:false,xAxisIndex:0,filterMode,startValue:start,endValue:Math.max(0,Math.min(count-1,start+3)),zoomLock:true}];
  }
 };

})();
