"use strict";
class ComercialApiError extends Error{
 constructor(message,status=0){super(message);this.name='ComercialApiError';this.status=status;}
}
window.ComercialApi={
 async get(resource,params={},signal){
  let token='';try{token=sessionStorage.getItem(COMERCIAL_CONFIG.sessionKey)||'';}catch(_){}
  if(!token)throw new ComercialApiError('Abra este relatório pela CENTRAL para utilizar sua sessão.',401);
  const base=new URL(COMERCIAL_CONFIG.apiUrl),url=new URL(COMERCIAL_CONFIG.apiPrefix+'/'+resource,base);
  if(url.origin!==base.origin||!url.pathname.startsWith(COMERCIAL_CONFIG.apiPrefix+'/'))throw new ComercialApiError('Consulta não configurada.');
  for(const [key,value] of Object.entries(params)){
   for(const item of Array.isArray(value)?value:[value])if(item!==''&&item!=null)url.searchParams.append(key,item);
  }
  let response;
  for(let attempt=0;attempt<3;attempt++){
   if(signal?.aborted)throw new DOMException('Consulta cancelada.','AbortError');
   try{response=await fetch(url,{headers:{Accept:'application/json',Authorization:'Bearer '+token},signal,cache:'no-store',credentials:'omit'});}catch(e){if(e.name==='AbortError')throw e;if(attempt===2)throw new ComercialApiError('Não foi possível conectar ao serviço. Tente atualizar novamente.');}
   if(response&&(![502,503,504].includes(response.status)||attempt===2))break;
   response=undefined;
   await new Promise((resolve,reject)=>{const abort=()=>{clearTimeout(timer);reject(new DOMException('Consulta cancelada.','AbortError'));},timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},600*(attempt+1));signal?.addEventListener('abort',abort,{once:true});if(signal?.aborted)abort();});
  }
  if(!response.ok)throw new ComercialApiError(({401:'Sua sessão expirou. Entre novamente pela CENTRAL.',403:'Sua sessão não tem acesso a esta consulta.',404:'Esta consulta ainda não está disponível no serviço publicado.',422:'Confira as datas e os filtros selecionados.',500:'Não foi possível concluir a consulta.',502:'O serviço de dados está indisponível.',503:'O serviço de dados está temporariamente indisponível.'})[response.status]||'Não foi possível concluir a consulta.',response.status);
  let data;try{data=await response.json();}catch(_){throw new ComercialApiError('O serviço retornou uma resposta inválida.');}
  if(data?.ok!==true)throw new ComercialApiError('Resposta incompatível com o Comercial.');return data;
 }
};
