"use strict";
(()=>{
 const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=(v,d=0)=>v==null?'—':Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d,maximumFractionDigits:d}),money=v=>v==null?'—':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}),date=v=>v?String(v).slice(0,10).split('-').reverse().join('/'):'—';
 const screens={faturamento:{title:'Faturamento',dimension:'vendedor'},clientes:{title:'Detalhamento de Clientes',dimension:'cliente'},vendedores:{title:'Detalhamento de Vendedores',dimension:'vendedor'},produtos:{title:'Vendas por Produto',dimension:'produto'},metas:{title:'Vendedores e Metas',source:'metas'},positivacao:{title:'Positivação Efetiva',source:'clientes_cadastrados'},supervisao:{title:'Supervisão',source:'base_cadastro_comercial'}};
 const query=new URLSearchParams(location.search),key=screens[query.get('relatorio')]?query.get('relatorio'):'faturamento',screen=screens[key],mobile=()=>PcpMobileScroll.active();
 document.body.dataset.page=key;$('titulo').textContent=screen.title;document.title=screen.title+' | Comercial Vendas';
 let filters={},period='dia',dimension=screen.dimension,controller=null,generation=0,loading=false,confirmed=false,charts=[],sources=[],page=1,source=screen.source,sort={key:'faturamento',desc:true};
 const unitLabels={'10':'10 · Ave Nova','111':'111 · Real Alimentos','102':'102 · CD Januária','180':'180 · CD Ribeirão das Neves'};
 function status(message){$('estado').textContent=message;}
 function error(e){
  if(e.name==='AbortError')return;
  $('erro').textContent=e.message+(confirmed&&!([401,403].includes(e.status))?' O relatório mantém a última consulta confirmada; os novos filtros ainda não foram aplicados.':'');$('erro').hidden=false;
  if([401,403].includes(e.status)){confirmed=false;charts.forEach(c=>c.dispose());charts=[];$('conteudo').innerHTML='<section class="card com-development"><h2>Acesse pela CENTRAL</h2><p>Entre na CENTRAL e abra o Comercial Vendas para consultar os relatórios com sua sessão.</p></section>';status('Sessão necessária para consultar os dados.');}
  else if(!confirmed)status('Consulta não concluída.');
 }
 function updateHealth(data){
  const values=data.fontes.map(f=>f.ultima_atualizacao||f.concluido_em).filter(Boolean).map(v=>new Date(v)).filter(d=>!Number.isNaN(d.getTime()));
  $('ultimaAtualizacao').textContent=values.length?new Date(Math.max(...values)).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo',hour12:false}):'—';
 }
 function renderFilters(options){
  const end=options.periodo.fim||'',start=end?end.slice(0,7)+'-01':'';
  $('filtros').innerHTML='<form id="formFiltros"><div class="com-filter-head"><h2>Filtros</h2><div class="com-actions"><button type="submit" class="button">Atualizar</button><button type="button" class="button secondary" id="limpar">Limpar filtros</button></div></div><div class="com-filter-grid"><label>Data inicial<input type="date" name="inicio" required></label><label>Data final<input type="date" name="fim" required></label><label>Unidade<select name="unidade"><option value="">Todas as unidades</option>'+options.unidades.filter(v=>v.codigo!=null).map(v=>'<option value="'+esc(v.codigo)+'">'+esc(unitLabels[v.codigo]||'Unidade '+v.codigo)+'</option>').join('')+'</select></label><label>UF<input name="uf" placeholder="Todas" maxlength="2" pattern="[A-Za-z]{2}|" aria-label="UF, sigla de duas letras"></label></div><details class="com-more"><summary>Mais filtros</summary><div class="com-filter-grid">'+[['vendedor','Código do vendedor'],['cliente','Código do cliente'],['produto','Código do produto'],['familia','Família'],['cfop','CFOP'],['cidade','Cidade']].map(([id,label])=>'<label>'+label+'<input name="'+id+'" '+(['vendedor','cliente','produto'].includes(id)?'inputmode="numeric" pattern="[0-9]*"':'')+' maxlength="200" placeholder="Todos"></label>').join('')+'</div></details></form>';
  const form=$('formFiltros');form.elements.inicio.min=form.elements.fim.min=options.periodo.inicio||'';form.elements.inicio.max=form.elements.fim.max=end;
  for(const name of ['inicio','fim','unidade','uf','vendedor','cliente','produto','familia','cfop','cidade'])form.elements[name].value=query.get(name)||(name==='inicio'?start:name==='fim'?end:'');
  form.onsubmit=e=>{e.preventDefault();if(readFilters())load();};$('limpar').onclick=()=>{form.reset();form.elements.inicio.value=start;form.elements.fim.value=end;readFilters();load();};
  form.elements.unidade.onchange=()=>{if(readFilters())load();};readFilters();
 }
 function readFilters(){
  const form=$('formFiltros');if(!form.reportValidity())return false;const next=Object.fromEntries(new FormData(form));next.uf=next.uf.trim().toUpperCase();
  if(next.inicio>next.fim){error(new ComercialApiError('A data inicial deve ser anterior ou igual à data final.',422));return false;}
  filters=Object.fromEntries(Object.entries(next).map(([k,v])=>[k,v.trim()]));const params=new URLSearchParams();params.set('relatorio',key);for(const [k,v] of Object.entries(filters))if(v)params.set(k,v);history.replaceState(null,'',location.pathname+'?'+params+location.hash);return true;
 }
 function mountReport(){
  $('conteudo').innerHTML='<div id="selecao" hidden class="com-selection"></div><section class="com-kpis" aria-label="Indicadores do período">'+[['faturamento','Faturamento','Valor dos produtos'],['peso','Peso','Quilogramas no período'],['preco_medio','Preço médio','Vendas com peso e valor positivos'],['clientes','Clientes com movimento','Clientes distintos no período']].map(([id,label,hint])=>'<article class="card com-kpi"><span>'+label+'</span><strong id="valor_'+id+'">—</strong><small>'+hint+'</small></article>').join('')+'</section>'+[['Faturamento por período','fat','Evolução do valor dos produtos'],['Peso por período','peso','Evolução do peso em quilogramas']].map(([title,id,subtitle],i)=>'<article class="card com-panel"><header><div><h2>'+title+'</h2><p>'+subtitle+'</p></div>'+(i===0?'<div class="com-period" role="group" aria-label="Período dos dois gráficos">'+[['dia','Dia'],['semana','Semana'],['mes','Mês']].map(([value,label])=>'<button type="button" data-period="'+value+'" aria-pressed="'+(value===period)+'">'+label+'</button>').join('')+'</div>':'')+'</header><div class="com-chart-viewport pcp-comparativo-chart-scroll"><div id="grafico_'+id+'" class="com-chart" role="img" aria-label="'+title+'"></div></div></article>').join('')+'<article class="card com-panel"><header><div><h2 id="rankingTitulo">Vendas por '+({cliente:'cliente',vendedor:'vendedor',produto:'produto'}[dimension])+'</h2><p>Até 100 resultados de maior faturamento no recorte. Os indicadores acima consideram todos os registros.</p></div>'+(key==='faturamento'?'<div class="com-tabs" aria-label="Agrupar vendas">'+[['vendedor','Vendedores'],['cliente','Clientes'],['produto','Produtos'],['uf','UF']].map(([dim,label])=>'<button type="button" data-dimension="'+dim+'" aria-pressed="'+(dim===dimension)+'">'+label+'</button>').join('')+'</div>':'')+'</header><div id="rankingTabela" class="com-table-scroll"><p class="com-skeleton">Carregando vendas…</p></div></article>';
  for(const id of ['fat','peso'])charts.push(echarts.init($('grafico_'+id)));
  document.querySelectorAll('[data-period]').forEach(b=>b.onclick=()=>{period=b.dataset.period;document.querySelectorAll('[data-period]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));load();});
  document.querySelectorAll('[data-dimension]').forEach(b=>b.onclick=()=>{dimension=b.dataset.dimension;document.querySelectorAll('[data-dimension]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));load();});
 }
 let lastChartSignature='',chartRows=[];
 function renderCharts(rows){
  chartRows=rows;const signature=period+'|'+rows.map(r=>r.data).join('|'),changed=signature!==lastChartSignature;lastChartSignature=signature;
  charts.forEach((chart,index)=>{
   const metric=index?'peso':'faturamento',color=index?'#168cff':'#7a1726',element=chart.getDom(),host=element.parentElement,width=mobile()?host.clientWidth:Math.max(host.clientWidth,rows.length*70+80);
   element.style.width=width+'px';chart.resize({width,height:290});
   const zoom=mobile()?PcpMobileScroll.config(chart,rows.length,changed,{left:58,right:26,filterMode:'filter'}):[];
   const fmt=v=>index?number(v,0)+' kg':money(v),labels=rows.map(r=>r.data);
   chart.setOption({animation:false,grid:{left:58,right:26,top:32,bottom:35},tooltip:{show:!mobile(),trigger:'axis',triggerOn:mobile()?'none':'mousemove|click',valueFormatter:fmt},xAxis:{type:'category',data:labels,axisTick:{show:false},axisLine:{show:false},axisLabel:{fontSize:10,color:'#776f69',formatter:v=>period==='mes'?v.slice(5,7)+'/'+v.slice(0,4):date(v).slice(0,5)}},yAxis:{type:'value',scale:true,axisLabel:{fontSize:10,color:'#776f69',formatter:v=>index?number(v/1000,0)+' mil':Math.abs(v)>=1e6?'R$ '+number(v/1e6,1)+' mi':'R$ '+number(v/1000,0)+' mil'},splitLine:{lineStyle:{type:'dotted',color:'#ddd5ce'}}},series:[{id:metric,name:index?'Peso':'Faturamento',type:'line',data:rows.map(r=>r[metric]),symbol:'circle',symbolSize:6,lineStyle:{color,width:2.5},itemStyle:{color},connectNulls:false,label:{show:true,position:'top',distance:8,fontSize:10,color:'#000',backgroundColor:index?'#e4f2ff':'#f8e8e9',padding:[3,4],borderRadius:3,formatter:p=>Math.abs(p.value)>=1e6?number(p.value/1e6,2)+' mi':Math.abs(p.value)>=1000?number(p.value/1000,1)+' mil':number(p.value,0)},labelLayout:{hideOverlap:true}}],dataZoom:zoom,graphic:rows.length?[]:[{type:'text',left:'center',top:'middle',style:{text:'Nenhum movimento no período selecionado.',fill:'#82766e',fontSize:11}}]},true);
  });
 }
 let rankingRows=[];
 function renderRanking(rows){
  rankingRows=rows;const box=$('rankingTabela'),title=({vendedor:'Vendedor',cliente:'Cliente',produto:'Produto',uf:'UF'})[dimension]||dimension;
  $('rankingTitulo').textContent='Vendas por '+title.toLowerCase();const data=[...rows].sort((a,b)=>{const av=a[sort.key],bv=b[sort.key];if(av==null)return bv==null?0:1;if(bv==null)return -1;return (sort.desc?-1:1)*(typeof av==='number'?av-bv:String(av).localeCompare(String(bv),'pt-BR'));});
  box.innerHTML='<table class="com-table"><thead><tr><th scope="col">'+title+'</th>'+[['faturamento','Faturamento (R$)'],['peso','Peso (kg)']].map(([k,label])=>'<th scope="col"><button type="button" class="com-row-link" data-sort="'+k+'">'+label+(sort.key===k?(sort.desc?' ↓':' ↑'):'')+'</button></th>').join('')+'</tr></thead><tbody>'+data.map(r=>'<tr><th scope="row"><button type="button" class="com-row-link" data-code="'+esc(r.codigo)+'">'+esc(r.nome||'Sem identificação')+'<small>'+esc(r.codigo==null?'Sem código':'Código '+r.codigo)+'</small></button></th><td>'+money(r.faturamento)+'</td><td>'+number(r.peso,2)+'</td></tr>').join('')+(data.length?'':'<tr><td colspan="3" class="com-empty">Nenhuma venda disponível para os filtros selecionados.</td></tr>')+'</tbody></table>';
  box.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{sort.desc=sort.key===b.dataset.sort?!sort.desc:true;sort.key=b.dataset.sort;renderRanking(rankingRows);});
  box.querySelectorAll('[data-code]').forEach(b=>b.onclick=()=>{if(!b.dataset.code||b.dataset.code==='null')return;const field=$('formFiltros').elements[dimension];if(field){field.value=b.dataset.code;if(readFilters())load();}});PcpMobileScroll.table(box);
 }
 async function load(){
  if(!charts.length||charts.some(c=>c.isDisposed()))mountReport();const id=++generation;controller?.abort();controller=new AbortController();loading=true;$('erro').hidden=true;status('Atualizando o relatório…');
  try{
   const signal=controller.signal,[summary,series,ranking,health]=await Promise.all([ComercialApi.get('resumo',filters,signal),ComercialApi.get('serie',{...filters,periodo:period},signal),ComercialApi.get('ranking',{...filters,dimensao:dimension},signal),ComercialApi.get('health',{},signal)]);
   if(id!==generation)return;if(summary.contrato!=='comercial-html-v1'||!summary.medidas||!Array.isArray(series.serie)||!Array.isArray(ranking.dados))throw new ComercialApiError('Resposta incompatível com o relatório.');
   const m=summary.medidas;$('valor_faturamento').textContent=money(m.faturamento);$('valor_peso').textContent=number(m.peso,2)+' kg';$('valor_preco_medio').textContent=money(m.preco_medio);$('valor_clientes').textContent=number(m.clientes);
   renderCharts(series.serie);renderRanking(ranking.dados);updateHealth(health);confirmed=true;
   const selected=['vendedor','cliente','produto'].filter(k=>filters[k]);$('selecao').hidden=!selected.length;
   if(selected.length){$('selecao').innerHTML='<span>'+selected.map(k=>({vendedor:'Vendedor',cliente:'Cliente',produto:'Produto'})[k]+' '+esc(filters[k])).join(' · ')+'</span><button type="button" id="limparSelecao">Limpar seleção</button>';$('limparSelecao').onclick=()=>{for(const k of selected)$('formFiltros').elements[k].value='';readFilters();load();};}
   status('Dados reais · '+date(filters.inicio)+' a '+date(filters.fim)+' · '+(unitLabels[filters.unidade]||(!filters.unidade?'Todas as unidades':'Unidade '+filters.unidade))+' · '+number(m.registros)+' registros no período');
  }catch(e){if(id===generation)error(e);}finally{if(id===generation)loading=false;}
 }
 const sourceLabels={metas:'Metas cadastradas',clientes_cadastrados:'Carteira de clientes',cadastro_de_vendedores:'Cadastro de vendedores',base_cadastro_comercial:'Equipe comercial',redes_compras:'Redes de compras',grupo_produto:'Grupos de produtos'};
 const sourceColumns={metas:['mes_meta','nome_vendedores','cod','receita_meta','peso_faturado_meta','preco_medio_meta','positivacao_meta'],clientes_cadastrados:['codigo_cliente_normalizado','razao_social','nome_fantasia','vendedor','cidade','uf','situacao'],cadastro_de_vendedores:['codigo','nome','situacao','nome_supervisor','nome_vendedor_pai'],base_cadastro_comercial:['codigo','nome','ativo_destativado','supervisor','regiao_de_atendimento','atacado_varejo'],redes_compras:['rede_comercial','cod_loja','razao'],grupo_produto:['codigo','descricao','grupo']};
 function mountPreparation(){
  const descriptions={metas:'A consulta às metas cadastradas já está disponível. As comparações entre meta e realizado serão desenvolvidas e conferidas nesta tela.',positivacao:'A carteira de clientes já pode ser consultada abaixo. As análises de positivação, clientes sem compra e evolução mensal serão desenvolvidas nesta tela.',supervisao:'A equipe comercial e os cadastros de apoio já estão disponíveis. As análises consolidadas por supervisor serão desenvolvidas nesta tela.'};
  $('filtros').innerHTML='<div class="com-filter-head"><h2>Filtros</h2><button type="button" class="button" id="atualizarBase">Atualizar</button></div><label class="com-base-field">Visualizar<select id="fonteConsulta">'+Object.entries(sourceLabels).map(([k,v])=>'<option value="'+k+'" '+(k===source?'selected':'')+'>'+v+'</option>').join('')+'</select></label>';
  $('conteudo').innerHTML='<section class="card com-development"><span class="com-badge">Em desenvolvimento</span><h2>'+screen.title+'</h2><p>'+descriptions[key]+'</p></section><article class="card com-panel"><header><div><h2 id="tituloBase">'+sourceLabels[source]+'</h2><p>Cadastro disponível para consulta. Esta lista não representa indicadores de meta ou positivação.</p></div></header><div id="baseTabela" class="com-table-scroll"><p class="com-skeleton">Carregando cadastro…</p></div><nav class="com-pager" aria-label="Páginas do cadastro"><button type="button" class="button secondary" id="anterior">← Anterior</button><span id="paginaBase">—</span><button type="button" class="button secondary" id="proxima">Próxima →</button></nav></article>';
  $('fonteConsulta').onchange=()=>{source=$('fonteConsulta').value;page=1;loadBase();};$('atualizarBase').onclick=loadBase;$('anterior').onclick=()=>{if(page>1){page--;loadBase();}};$('proxima').onclick=()=>{page++;loadBase();};
 }
 async function loadBase(){
  if(!$('baseTabela'))mountPreparation();const id=++generation;controller?.abort();controller=new AbortController();loading=true;$('erro').hidden=true;status('Atualizando cadastro…');
  try{
   const [data,health]=await Promise.all([ComercialApi.get('dados/'+source,{pagina:page,tamanho:25,...(source==='metas'?{preenchidos:1}:{})},controller.signal),ComercialApi.get('health',{},controller.signal)]);if(id!==generation)return;
   if(!Array.isArray(data.colunas)||!Array.isArray(data.dados)||!Number.isFinite(data.total))throw new ComercialApiError('Resposta incompatível com o cadastro.');
   const cols=sourceColumns[source].map(name=>data.colunas.find(c=>c.coluna===name)).filter(Boolean);if(!cols.length)throw new ComercialApiError('As colunas deste cadastro precisam ser configuradas.');
   const format=(v,key)=>v==null?'—':key.includes('mes_meta')?date(v):['cod','codigo','vendedor','cliente'].includes(key)?String(v):typeof v==='number'?key.includes('receita')||key.includes('preco')?money(v):number(v,key.includes('peso')?2:0):String(v);
   $('tituloBase').textContent=sourceLabels[source];$('baseTabela').innerHTML='<table class="com-table"><thead><tr>'+cols.map(c=>'<th scope="col">'+esc(c.original)+'</th>').join('')+'</tr></thead><tbody>'+data.dados.map(r=>'<tr>'+cols.map((c,i)=>'<'+(i?'td':'th scope="row"')+'>'+esc(format(r[c.coluna],c.coluna))+'</'+(i?'td':'th')+'>').join('')+'</tr>').join('')+(data.dados.length?'':'<tr><td colspan="'+cols.length+'" class="com-empty">Nenhum registro disponível.</td></tr>')+'</tbody></table>';
   $('paginaBase').textContent='Página '+page+' de '+Math.max(1,Math.ceil(data.total/25));$('anterior').disabled=page===1;$('proxima').disabled=page*25>=data.total;PcpMobileScroll.table($('baseTabela'));updateHealth(health);confirmed=true;status('Dados reais · '+sourceLabels[source]+' · '+number(data.total)+' registros cadastrados');
  }catch(e){if(id===generation)error(e);}finally{if(id===generation)loading=false;}
 }
 async function initialize(){
  try{
   if(screen.source){mountPreparation();await loadBase();}
   else{const data=await ComercialApi.get('filtros');if(!data.periodo||!Array.isArray(data.unidades))throw new ComercialApiError('Não foi possível carregar os filtros.');renderFilters(data);mountReport();await load();}
  }catch(e){error(e);}
 }
 let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(charts.length&&chartRows.length)renderCharts(chartRows);},120);});
 setInterval(()=>{if(!document.hidden&&!loading&&confirmed)screen.source?loadBase():load();},COMERCIAL_CONFIG.refreshMs);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!loading&&confirmed)screen.source?loadBase():load();});
 initialize();
})();
