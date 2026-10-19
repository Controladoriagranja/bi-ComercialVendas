"use strict";
window.ComercialFilters=class {
 constructor(host,options,query,onApply){
  this.host=host;this.options=options;this.onApply=onApply;this.states={};this.labels={};this.requests={};this.timers={};
  this.fields=[['supervisor','Supervisor'],['vendedor','Vendedor'],['dia','Dia'],['mes','Mês'],['ano','Ano'],['regiao','Região de atendimento'],['descricao_cfop','Descrição CFOP'],['cliente','Cliente'],['uf','UF'],['cidade','Cidade'],['familia','Família'],['produto','Descrição Produto'],['unidade_cadastro','Unidade'],['canal','Canal Comercial'],['rede_comercial','Rede Comercial'],['rede_financeira','Rede Financeira'],['grupo','Grupo'],['ramo_atividade','Ramo de atividade']];
  if(options.visao==='clientes'){const first=[['cliente','Cliente'],['vendedor','Vendedor'],['dia','Dia'],['mes','Mês'],['ano','Ano'],['regiao','Região de atendimento']];this.fields=[...first,['cfop','CFOP'],...this.fields.filter(([k])=>!first.some(([f])=>f===k)&&k!=='descricao_cfop')];}
  this.primaryCount=6;
  if(options.visao==='metas'){const first=[['vendedor','Vendedor'],['supervisor','Supervisor'],['empresa','Empresa'],['dia','Dia'],['mes','Mês'],['ano','Ano'],['regiao','Região de atendimento']];this.fields=[...first,['cfop','CFOP'],...this.fields.filter(([k])=>!first.some(([f])=>f===k)&&k!=='descricao_cfop'),['tipo_vendedor','Tipo vendedor']];this.primaryCount=7;}
  if(options.visao==='positivacao'){this.fields=[['familia','Família'],['vendedor','Vendedor'],['cliente','Cliente'],['rede_financeira','Redes financeiras'],['cfop','CFOP'],['ramo_atividade','Ramo de atividade']];this.primaryCount=4;}
  this.fixedCfop=options.acesso?.cfop_vendas_fixo===true||['seller','supervisor'].includes(options.acesso?.modo);
  this.months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  this.defaults={...options.padrao,ano:[],mes:[]};
  host.innerHTML='<form id="formFiltros"><div class="com-filter-head"><h2>Filtros</h2><div class="com-actions"><button type="button" class="button secondary" id="limpar">Limpar filtros</button></div></div><div class="com-filter-grid com-main-filters">'+this.fields.slice(0,this.primaryCount).map(([k,label])=>this.field(k,label)).join('')+'</div><details class="com-more" id="outrosFiltros"><summary>Outros filtros <span id="outrosAtivos"></span></summary><div class="com-filter-grid">'+this.fields.slice(this.primaryCount).map(([k,label])=>this.field(k,label)).join('')+'<label>Data inicial<input type="date" name="inicio"></label><label>Data final<input type="date" name="fim"></label></div></details><p class="com-filter-note">Os filtros são aplicados automaticamente.</p></form>';
  this.form=host.querySelector('form');const end=options.periodo.fim,begin=options.periodo.inicio&&options.periodo.inicio>'2023-01-01'?options.periodo.inicio:'2023-01-01';
  this.form.elements.inicio.value=query.get('inicio')||begin;this.form.elements.fim.value=query.get('fim')||end;
  for(const k of ['inicio','fim']){this.form.elements[k].min=options.periodo.inicio;this.form.elements[k].max=end;}
  for(const [k] of this.fields){
   this.states[k]={values:query.has(k)?query.getAll(k).filter(Boolean):query.has(k+'_exc')?[]:[...(this.defaults[k]||[])],excluded:query.getAll(k+'_exc').filter(Boolean)};
   if(this.fixedCfop&&['cfop','descricao_cfop'].includes(k))this.states[k]={values:[...(this.defaults[k]||[])],excluded:[]};
   this.labels[k]=new Map();this.refresh(k);
   const detail=host.querySelector('[data-filter="'+k+'"]');
   if(this.fixedCfop&&['cfop','descricao_cfop'].includes(k)){const summary=detail.querySelector('summary');summary.setAttribute('aria-disabled','true');summary.title='Todas as descrições iniciadas por VENDA. Regra fixa para este acesso.';summary.onclick=e=>e.preventDefault();detail.querySelectorAll('input').forEach(input=>input.disabled=true);detail.addEventListener('toggle',()=>{detail.open=false;});continue;}
   detail.addEventListener('toggle',()=>{if(detail.open){host.querySelectorAll('.com-picker[open]').forEach(x=>{if(x!==detail)x.open=false;});this.search(k);}});
   detail.querySelector('input[type=search]').addEventListener('input',()=>{clearTimeout(this.timers[k]);this.requests[k]?.abort();this.timers[k]=setTimeout(()=>this.search(k),250);});
   detail.querySelector('[data-all]').onchange=e=>{this.states[k]={values:e.target.checked?[]:['__nenhum__'],excluded:[]};this.refresh(k);this.draw(k);this.scheduleApply();};
  }
  this.form.onsubmit=e=>{e.preventDefault();if(this.read()){host.querySelectorAll('.com-picker[open]').forEach(x=>x.open=false);this.applyNow();}};
  host.querySelector('#limpar').onclick=()=>{this.periodSelection=null;for(const[k]of this.fields){this.states[k]={values:[...(this.defaults[k]||[])],excluded:[]};this.refresh(k);}this.form.elements.inicio.value=begin;this.form.elements.fim.value=end;this.applyNow();};
  for(const field of ['inicio','fim'])this.form.elements[field].addEventListener('change',()=>this.scheduleApply());
  document.addEventListener('click',e=>{if(!e.target.closest('.com-picker'))host.querySelectorAll('.com-picker[open]').forEach(x=>x.open=false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')host.querySelectorAll('.com-picker[open]').forEach(x=>x.open=false);});
 }
 calendarState(){return {inicio:this.form.elements.inicio.value,fim:this.form.elements.fim.value,...Object.fromEntries(['ano','mes','dia'].filter(k=>this.states[k]).map(k=>[k,{values:[...this.states[k].values],excluded:[...this.states[k].excluded]}]))};}
 restoreCalendar(state){for(const k of ['inicio','fim'])this.form.elements[k].value=state[k];for(const k of ['ano','mes','dia'])if(state[k]){this.states[k]=state[k];this.refresh(k);}}
 clearPeriodSelection(){if(!this.periodSelection)return false;const selection=this.periodSelection;this.periodSelection=null;if(JSON.stringify(this.calendarState())!==selection.applied)return false;this.restoreCalendar(selection.before);return true;}
 selectPeriod(period,value){
  if(!['mes','semana','dia'].includes(period)||!/^\d{4}-\d{2}-\d{2}$/.test(value))return;
  const key=period+':'+value;if(this.periodSelection?.key===key){this.clearPeriodSelection();return;}
  this.clearPeriodSelection();const before=this.calendarState(),start=new Date(value+'T12:00:00Z'),end=new Date(start);
  for(const k of ['ano','mes','dia'])this.set(k,'');
  if(period==='mes'){this.set('ano',value.slice(0,4));this.set('mes',String(Number(value.slice(5,7))));}
  else if(period==='dia')this.set('dia',value);
  else{end.setUTCDate(end.getUTCDate()+6);this.form.elements.inicio.value=before.inicio&&before.inicio>value?before.inicio:value;const last=end.toISOString().slice(0,10);this.form.elements.fim.value=before.fim&&before.fim<last?before.fim:last;}
  this.periodSelection={key,before,applied:JSON.stringify(this.calendarState()),label:period==='mes'?this.months[Number(value.slice(5,7))-1]+'/'+value.slice(0,4):period==='dia'?value.split('-').reverse().join('/'):'Semana de '+value.split('-').reverse().join('/')};
 }
 scheduleApply(){clearTimeout(this.applyTimer);this.applyTimer=setTimeout(()=>this.applyNow(),450);}
 applyNow(){clearTimeout(this.applyTimer);if(this.read())this.onApply();}
 esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 field(k,label){return '<div class="com-filter-field"><span id="label_'+k+'">'+label+'</span><details class="com-picker" data-filter="'+k+'"><summary aria-labelledby="label_'+k+' picked_'+k+'"><span id="picked_'+k+'">Todos</span><span aria-hidden="true">⌄</span></summary><div class="com-picker-panel"><input type="search" placeholder="Pesquisar ou digitar código/nome" aria-label="Pesquisar '+label+'" autocomplete="off"><label class="com-pick-all"><input type="checkbox" data-all> Selecionar todos</label><div class="com-options" role="group" aria-label="Opções de '+label+'"></div><small class="com-picker-status" aria-live="polite"></small></div></details></div>';}
 label(k,v){if(v==='__nenhum__')return 'Nenhum';if(k==='dia')return this.labels[k].get(v)||String(v).split('-').reverse().join('/');if(k==='mes')return this.months[Number(v)-1]||v;if(k==='unidade_cadastro')return this.unitLabel(this.options.unidades.find(x=>x.nome===v)||{nome:v});return this.labels[k].get(v)||v;}
 refresh(k){const s=this.states[k],e=this.host.querySelector('[data-filter="'+k+'"]');e.querySelector('[id^=picked_]').textContent=this.fixedCfop&&['cfop','descricao_cfop'].includes(k)?'VENDA · seleção fixa':s.excluded.length?'Todos, exceto '+s.excluded.length:s.values.length===1?this.label(k,s.values[0]):s.values.length?s.values.length+' selecionados':'Todos';e.querySelector('[data-all]').checked=!s.values.length&&!s.excluded.length;e.querySelector('[data-all]').indeterminate=!!s.excluded.length;const count=this.fields.slice(this.primaryCount).filter(([f])=>this.states[f]&&(this.states[f].values.length||this.states[f].excluded.length)).length;this.host.querySelector('#outrosAtivos').textContent=count?'('+count+(count===1?' ativo)':' ativos)'):'';}
 read(){if(this.periodSelection&&JSON.stringify(this.calendarState())!==this.periodSelection.applied)this.periodSelection=null;if(!this.form.reportValidity())return null;const a=this.form.elements.inicio.value,b=this.form.elements.fim.value;if(a&&b&&a>b){this.form.elements.fim.setCustomValidity('A data final deve ser igual ou posterior à inicial.');this.form.elements.fim.reportValidity();this.form.elements.fim.setCustomValidity('');return null;}const result={inicio:a,fim:b};for(const[k]of this.fields){result[k]=this.states[k].values;result[k+'_exc']=this.states[k].excluded;}return result;}
 set(k,value,label){if(!this.states[k]||(this.fixedCfop&&['cfop','descricao_cfop'].includes(k)))return;this.states[k]={values:value?[String(value)]:[],excluded:[]};if(label)this.labels[k].set(String(value),label);this.refresh(k);}
 unitLabel(row){return ({'10':'Ave Nova','102':'CD Januária','111':'Real Alimentos','180':'CD Ribeirão das Neves'})[row.codigo]||String(row.nome).replace(/^0?\d+\s*[-·]\s*/, '');}
 async search(k){
  this.requests[k]?.abort();const request=new AbortController();this.requests[k]=request;const e=this.host.querySelector('[data-filter="'+k+'"]'),q=e.querySelector('input[type=search]').value.trim(),info=e.querySelector('.com-picker-status');info.textContent='Carregando opções…';
  try{
   let data;
   if(['ano','mes','unidade_cadastro'].includes(k)){
    const end=this.options.periodo.fim;let rows=k==='mes'?this.months.map((nome,i)=>({codigo:String(i+1),nome})):k==='ano'?Array.from({length:Number(end.slice(0,4))-2023+1},(_,i)=>({codigo:String(2023+i),nome:String(2023+i)})):this.options.unidades.map(x=>({codigo:x.nome,nome:this.unitLabel(x)}));
    data={dados:rows.filter(r=>(r.nome+' '+r.codigo).toLocaleLowerCase().includes(q.toLocaleLowerCase())),mais:false};
   }else data=await ComercialApi.get('opcoes',{...this.read(),campo:k,q,visao:this.options.visao||'faturamento'},request.signal);
   if(this.requests[k]!==request)return;this.rows??={};this.rows[k]=data.dados;for(const row of data.dados)this.labels[k].set(String(row.codigo),row.nome);this.refresh(k);this.draw(k);info.textContent=data.mais?'Exibindo 100 opções. Digite para localizar outras. Selecionar todos inclui todas as opções.':data.dados.length+' opções';
  }catch(error){if(error.name!=='AbortError'&&this.requests[k]===request){this.rows??={};this.rows[k]=[];this.draw(k);info.textContent=error.message;}}
 }
 draw(k){const e=this.host.querySelector('[data-filter="'+k+'"]'),s=this.states[k],box=e.querySelector('.com-options');box.innerHTML=(this.rows?.[k]||[]).map(r=>{const v=String(r.codigo),checked=s.values.length?s.values.includes(v):!s.excluded.includes(v);return '<label><input type="checkbox" value="'+this.esc(v)+'" '+(checked?'checked':'')+'><span>'+this.esc(this.label(k,v))+'</span></label>';}).join('')||'<p>Nenhuma opção para esta pesquisa.</p>';box.querySelectorAll('input').forEach(input=>input.onchange=()=>{const v=input.value,previous={values:[...s.values],excluded:[...s.excluded]};if(s.values.length){s.values=s.values.filter(x=>x!=='__nenhum__'&&x!==v);if(input.checked)s.values.push(v);if(!s.values.length)s.values=['__nenhum__'];}else{if(input.checked)s.excluded=s.excluded.filter(x=>x!==v);else if(!s.excluded.includes(v))s.excluded.push(v);}if(s.values.length>100||s.excluded.length>100){s.values=previous.values;s.excluded=previous.excluded;input.checked=!input.checked;e.querySelector('.com-picker-status').textContent='Limite de 100 seleções. Refine os outros filtros.';return;}this.refresh(k);this.scheduleApply();});}
};
