"use strict";
window.ComercialFilters=class {
 constructor(host,options,query,onApply){
  this.host=host;this.options=options;this.onApply=onApply;this.states={};this.labels={};this.requests={};this.timers={};
  this.fields=[['supervisor','Supervisor'],['vendedor','Vendedor'],['dia','Dia'],['mes','Mês'],['ano','Ano'],['regiao','Região de atendimento'],['descricao_cfop','Descrição CFOP'],['cliente','Cliente'],['uf','UF'],['cidade','Cidade'],['familia','Família'],['produto','Descrição Produto'],['unidade_cadastro','Unidade'],['canal','Canal Comercial'],['rede_comercial','Rede Comercial'],['rede_financeira','Rede Financeira'],['grupo','Grupo']];
  this.months=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  this.defaults={...options.padrao,mes:[String(Number(options.periodo.fim.slice(5,7)))]};
  const esc=this.esc;
  host.innerHTML='<form id="formFiltros"><div class="com-filter-head"><h2>Filtros</h2><div class="com-actions"><button type="submit" class="button">Atualizar</button><button type="button" class="button secondary" id="limpar">Limpar filtros</button></div></div><div class="com-filter-grid com-main-filters">'+this.fields.slice(0,6).map(([k,label])=>this.field(k,label)).join('')+'</div><details class="com-more" id="outrosFiltros"><summary>Outros filtros <span id="outrosAtivos"></span></summary><div class="com-filter-grid">'+this.fields.slice(6).map(([k,label])=>this.field(k,label)).join('')+'<label>Data inicial<input type="date" name="inicio"></label><label>Data final<input type="date" name="fim"></label></div></details><p class="com-filter-note">Selecione os filtros e clique em Atualizar. As seleções ativas aparecem em cada campo.</p></form>';
  this.form=host.querySelector('form');const end=options.periodo.fim;
  this.form.elements.inicio.value=query.get('inicio')||'2023-01-01';this.form.elements.fim.value=query.get('fim')||end;
  for(const k of ['inicio','fim']){this.form.elements[k].min=options.periodo.inicio;this.form.elements[k].max=end;}
  for(const [k] of this.fields){
   this.states[k]={values:query.has(k)?query.getAll(k).filter(Boolean):query.has(k+'_exc')?[]:[...(this.defaults[k]||[])],excluded:query.getAll(k+'_exc').filter(Boolean)};
   this.labels[k]=new Map();this.refresh(k);
   const detail=host.querySelector('[data-filter="'+k+'"]');
   if(detail.tagName==='SELECT'){detail.onchange=()=>{if(detail.value==='__multiple__')return;this.states[k]={values:detail.value?[detail.value]:[],excluded:[]};this.refresh(k);onApply();};continue;}
   detail.addEventListener('toggle',()=>{if(detail.open){host.querySelectorAll('.com-picker[open]').forEach(x=>{if(x!==detail)x.open=false;});this.search(k);}});
   detail.querySelector('input[type=search]').addEventListener('input',()=>{clearTimeout(this.timers[k]);this.requests[k]?.abort();this.timers[k]=setTimeout(()=>this.search(k),250);});
   detail.querySelector('[data-all]').onchange=e=>{this.states[k]={values:e.target.checked?[]:['__nenhum__'],excluded:[]};this.refresh(k);this.draw(k);};
  }
  this.form.onsubmit=e=>{e.preventDefault();if(this.read()){host.querySelectorAll('.com-picker[open]').forEach(x=>x.open=false);onApply();}};
  host.querySelector('#limpar').onclick=()=>{for(const[k]of this.fields){this.states[k]={values:[...(this.defaults[k]||[])],excluded:[]};this.refresh(k);}this.form.elements.inicio.value='2023-01-01';this.form.elements.fim.value=end;onApply();};
  document.addEventListener('click',e=>{if(!e.target.closest('.com-picker'))host.querySelectorAll('.com-picker[open]').forEach(x=>x.open=false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape')host.querySelectorAll('.com-picker[open]').forEach(x=>x.open=false);});
 }
 esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
 field(k,label){if(['mes','ano','unidade_cadastro'].includes(k))return '<label class="com-filter-field"><span>'+label+'</span><select data-filter="'+k+'" aria-label="'+label+'"></select></label>';return '<div class="com-filter-field"><span id="label_'+k+'">'+label+'</span><details class="com-picker" data-filter="'+k+'"><summary aria-labelledby="label_'+k+' picked_'+k+'"><span id="picked_'+k+'">Todos</span><span aria-hidden="true">⌄</span></summary><div class="com-picker-panel"><input type="search" placeholder="Pesquisar ou digitar código/nome" aria-label="Pesquisar '+label+'" autocomplete="off"><label class="com-pick-all"><input type="checkbox" data-all> Selecionar todos</label><div class="com-options" role="group" aria-label="Opções de '+label+'"></div><small class="com-picker-status" aria-live="polite"></small></div></details></div>';}
 label(k,v){if(v==='__nenhum__')return 'Nenhum';if(k==='dia')return this.labels[k].get(v)||String(v).split('-').reverse().join('/');if(k==='mes')return this.months[Number(v)-1]||v;return this.labels[k].get(v)||v;}
 refresh(k){const s=this.states[k],e=this.host.querySelector('[data-filter="'+k+'"]');if(e.tagName==='SELECT'){this.refreshNative(k,e,s);}else{e.querySelector('[id^=picked_]').textContent=s.excluded.length?'Todos, exceto '+s.excluded.length:s.values.length===1?this.label(k,s.values[0]):s.values.length?s.values.length+' selecionados':'Todos';e.querySelector('[data-all]').checked=!s.values.length&&!s.excluded.length;e.querySelector('[data-all]').indeterminate=!!s.excluded.length;}const count=this.fields.slice(6).filter(([f])=>this.states[f]&&(this.states[f].values.length||this.states[f].excluded.length)).length;this.host.querySelector('#outrosAtivos').textContent=count?'('+count+' ativos)':'';}
 refreshNative(k,e,s){
  const end=this.options.periodo.fim,rows=k==='mes'?this.months.map((nome,i)=>({codigo:String(i+1),nome:nome.toLocaleLowerCase()})):k==='ano'?Array.from({length:Number(end.slice(0,4))-2023+1},(_,i)=>({codigo:String(2023+i),nome:String(2023+i)})):this.options.unidades.map(x=>({codigo:x.nome,nome:({'10':'Ave Nova','102':'CD Januária','111':'Real Alimentos','180':'CD Ribeirão das Neves'})[x.codigo]||x.nome.replace(/^0?\d+\s*[-·]\s*/, '')}));
  for(const r of rows)this.labels[k].set(r.codigo,r.nome);
  const multi=s.excluded.length||s.values.length>1,selected=multi?'__multiple__':s.values[0]||'';
  e.innerHTML='<option value="">'+(k==='unidade_cadastro'?'Todas':'Todos')+'</option>'+rows.map(r=>'<option value="'+this.esc(r.codigo)+'">'+this.esc(r.nome)+'</option>').join('')+(multi?'<option value="__multiple__">'+this.esc(s.excluded.length?'Todos, exceto '+s.excluded.length:s.values.length+' selecionados')+'</option>':'')+(selected==='__nenhum__'?'<option value="__nenhum__">Nenhum</option>':'');e.value=selected;
 }
 read(){if(!this.form.reportValidity())return null;const a=this.form.elements.inicio.value,b=this.form.elements.fim.value;if(a&&b&&a>b){this.form.elements.fim.setCustomValidity('A data final deve ser igual ou posterior à inicial.');this.form.elements.fim.reportValidity();this.form.elements.fim.setCustomValidity('');return null;}const result={inicio:a,fim:b};for(const[k]of this.fields){result[k]=this.states[k].values;result[k+'_exc']=this.states[k].excluded;}return result;}
 set(k,value,label){if(!this.states[k])return;this.states[k]={values:value?[String(value)]:[],excluded:[]};if(label)this.labels[k].set(String(value),label);this.refresh(k);}
 async search(k){
  this.requests[k]?.abort();const request=new AbortController();this.requests[k]=request;const e=this.host.querySelector('[data-filter="'+k+'"]'),q=e.querySelector('input[type=search]').value.trim(),info=e.querySelector('.com-picker-status');info.textContent='Carregando opções…';
  try{
   let data;
   if(['ano','mes','unidade_cadastro'].includes(k)){
    const end=this.options.periodo.fim;let rows=k==='mes'?this.months.map((nome,i)=>({codigo:String(i+1),nome})):k==='ano'?Array.from({length:Number(end.slice(0,4))-2023+1},(_,i)=>({codigo:String(2023+i),nome:String(2023+i)})):this.options.unidades.map(x=>({codigo:x.nome,nome:x.nome}));
    data={dados:rows.filter(r=>(r.nome+' '+r.codigo).toLocaleLowerCase().includes(q.toLocaleLowerCase())),mais:false};
   }else data=await ComercialApi.get('opcoes',{...this.read(),campo:k,q},request.signal);
   if(this.requests[k]!==request)return;this.rows??={};this.rows[k]=data.dados;for(const row of data.dados)this.labels[k].set(String(row.codigo),row.nome);this.refresh(k);this.draw(k);info.textContent=data.mais?'Exibindo 100 opções. Digite para localizar outras. Selecionar todos inclui todas as opções.':data.dados.length+' opções';
  }catch(error){if(error.name!=='AbortError'&&this.requests[k]===request){this.rows??={};this.rows[k]=[];this.draw(k);info.textContent=error.message;}}
 }
 draw(k){const e=this.host.querySelector('[data-filter="'+k+'"]'),s=this.states[k],box=e.querySelector('.com-options');box.innerHTML=(this.rows?.[k]||[]).map(r=>{const v=String(r.codigo),checked=s.values.length?s.values.includes(v):!s.excluded.includes(v);return '<label><input type="checkbox" value="'+this.esc(v)+'" '+(checked?'checked':'')+'><span>'+this.esc(this.label(k,v))+'</span></label>';}).join('')||'<p>Nenhuma opção para esta pesquisa.</p>';box.querySelectorAll('input').forEach(input=>input.onchange=()=>{const v=input.value,previous={values:[...s.values],excluded:[...s.excluded]};if(s.values.length){s.values=s.values.filter(x=>x!=='__nenhum__'&&x!==v);if(input.checked)s.values.push(v);if(!s.values.length)s.values=['__nenhum__'];}else{if(input.checked)s.excluded=s.excluded.filter(x=>x!==v);else if(!s.excluded.includes(v))s.excluded.push(v);}if(s.values.length>100||s.excluded.length>100){s.values=previous.values;s.excluded=previous.excluded;input.checked=!input.checked;e.querySelector('.com-picker-status').textContent='Limite de 100 seleções. Refine os outros filtros.';return;}this.refresh(k);});}
};
