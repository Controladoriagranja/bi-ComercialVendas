# Contrato da nova API Comercial

Configuração em assets/js/config.js. Prefixo exclusivo `/api/comercial-html`; reutiliza Worker e autenticação CENTRAL. Não há chave de banco nem credencial Basic no frontend.

| Consulta | Resposta utilizada |
|---|---|
| GET /painel?periodo=dia/semana/mes | contrato=comercial-html-painel-v1; medidas,serie,meses,rankings.cliente/produto/vendedor,fontes |
| GET /clientes?pagina=1&tamanho=100&ordenar=produto&direcao=desc | contrato=comercial-html-clientes-v1; medidas,ranking,vendas,pagina,tamanho,mais,fontes |
| GET /metas | contrato=comercial-html-metas-v1; cards,totais,vendedores,carteira,carteira_total,supervisores,mix,produtos,familias |
| GET /metas/carteira?pagina=1&tamanho=100 | contrato=comercial-html-carteira-v1; dados,total,pagina,tamanho; clientes ativos da carteira selecionada |
| GET /positivacao?pagina=1&tamanho=100 | contrato=comercial-html-positivacao-v1; dados,total,pagina,tamanho,produtos,referencia |
| GET /health | fontes, ultima_atualizacao/concluido_em |
| GET /filtros | periodo.inicio/fim, unidades[].codigo/nome, padrao, padrao_clientes, padrao_metas e padrao_positivacao |
| GET /resumo | contrato=comercial-html-v1, medidas: faturamento,peso,preco_medio,cliente_destaque,clientes,registros |
| GET /serie?periodo=dia/semana/mes | serie[].data,faturamento,peso,preco_medio |
| GET /ranking?dimensao=vendedor/cliente/produto/uf | dados[].codigo,nome,faturamento,peso; até100grupos |
| GET /dados/{fonte}?pagina=1&tamanho=25 | colunas[].original/coluna, dados[], total,pagina,tamanho |

Filtros dos indicadores, séries, rankings e opções: inicio/fim ISO inclusivos; ano e mes numéricos; dia como data completa ISO (exibição DD/MM/AAAA); vendedor, cliente, produto, uf, familia, cfop, descricao_cfop, cidade, supervisor, unidade_cadastro, canal, regiao, rede_comercial, rede_financeira e grupo. Valores repetidos são unidos por OU; campos diferentes por E. O sufixo `_exc` exclui valores, preservando a opção Selecionar todos sem carregar todos os clientes/produtos no navegador. `__nenhum__` representa uma seleção explicitamente vazia. Cada campo aceita até100valores; datas invertidas e campos desconhecidos retornam422.

`GET /opcoes?campo=cliente&q=texto` pesquisa por código e descrição, retorna dados[].codigo/nome e mais; até100opções por pesquisa. Aplica os outros filtros e ignora a seleção do próprio campo. A interface informa quando é necessário refinar a busca. Selecionar todos abrange todas as opções, inclusive as que não estão entre as100exibidas.

O contexto inicial do Faturamento usa calendário Todos, canal VAREJO e todas as descrições de CFOP que começam com VENDA. A cada entrada no relatório esse contexto é restaurado, inclusive quando a URL anterior continha mês/ano. Alterações são aplicadas automaticamente após450ms, sem botão Atualizar. Limpar filtros restaura esse contexto, mostrado nos controles. Selecionar todos em um campo remove sua restrição; não há filtro comercial implícito na API. O resumo contém todo o recorte; rankings limitados não recalculam os cartões.

A lista **Unidade** da interface usa as quatro descrições do cadastro de vendedores, como o slicer do PBIX, com vínculo por Uni+Cód.Vendedor (`unidade_cadastro`). O parâmetro legado `unidade` continua significando a unidade da nota e está disponível para consultas técnicas; códigos históricos de notas não viram unidades extras no seletor comercial. Nenhuma linha histórica foi excluída.

Região/canal vêm de Base_Cadastro_Comercial por código de vendedor; supervisor/unidade do cadastro usam Uni+Vendedor; redes comerciais/financeiras usam cliente; grupo usa código de produto. As dimensões são reduzidas a uma linha por chave antes do vínculo, evitando multiplicação de notas. Cadastros de preparação continuam paginados, sem filtros analíticos dessas telas.

Para metas, a consulta de cadastro usa `preenchidos=1`: lista apenas linhas com código preenchido, sem excluir linhas do banco nem modificar a consulta padrão. A fotografia original de1175linhas é preservada;959linhas possuem código no modelo conferido em15/10/2026. Esse número é apenas conferência, não constante da interface.

Medidas disponíveis:
- Faturamento: SUM(Valor Produto).
- Peso: SUM(Peso).
- Preço médio: soma de Valor Produto dividida por soma de Peso, apenas em linhas VENDA com valores e pesos positivos.
- Cliente destaque: maior faturamento positivo por Cliente e Razão Social, com nome de até24caracteres; empates concatenados conforme a medida original.
- Clientes com movimento: clientes distintos do contexto; **não é a medida de clientes positivados**.

O preço médio geral não é obtido de faturamento/peso sem o recorte de vendas. O resumo mensal e o gráfico de preço usam a mesma medida por grupo, nunca uma média de médias.

Fontes de consulta: metas, clientes_cadastrados, cadastro_de_vendedores, base_cadastro_comercial, redes_compras, grupo_produto. Os valores retornam da versão vigente no banco. O site não lê Parquet e não usa fixtures como fonte operacional.

Erros:401/403 limpam resultados;422 orienta corrigir filtro; falhas de disponibilidade preservam a última consulta confirmada. Controle por AbortController/generation evita que consultas antigas sobrescrevam filtros recentes.


Na tela Faturamento, o resumo mensal consulta todos os meses disponíveis do ano selecionado, desconsiderando Mês/Dia e o intervalo de datas desse recorte. Mantém canal, CFOP, unidade e demais filtros comerciais. Cartões, gráficos e rankings continuam seguindo o mês/dia selecionado. Todos os17filtros usam o mesmo seletor compacto com pesquisa, caixas de seleção múltipla e Selecionar todos, inclusive Mês/Ano/Unidade. Não há alternância de comportamento entre os campos. A tabela inferior de vendas foi removida somente dessa tela; os três painéis mantêm clique para filtrar e nomes abreviados com identificação completa ao passar o cursor.


Painéis de ranking exibem identificação na primeira linha e barra/valor na segunda, com largura reservada ao maior valor formatado do painel e espaço próprio para a rolagem. O comprimento das barras usa a mesma escala dentro de cada painel; a apresentação não recalcula totais nem modifica valores da API.


Ordem dos gráficos: Peso, Faturamento e Preço médio. Rótulos de dados mostram o número completo (moeda/quilogramas com duas casas), sem abreviações mil/mi. O espaço por categoria é dimensionado pelo texto; no celular a janela visível se adapta e a barra mantém acesso ao histórico. As escalas dos eixos continuam compactas.


O frontend de Faturamento utiliza `/painel`, uma chamada por atualização. O servidor lê o movimento filtrado uma vez, materializa apenas as colunas usadas e reaproveita o recorte para cartões, séries, resumo mensal e rankings. Contagens distintas reaproveitam agrupamentos completos, antes do limite de100itens. Os endpoints individuais continuam disponíveis para conferência e outros consumidores.

O cache do painel dura no máximo120segundos, é limitado a32contextos e usa parâmetros normalizados + revisão de todas as fontes (carga base, maior ID, soma e quantidade das cargas OK). Uma nova carga ou troca de base muda a chave imediatamente. Consultas simultâneas iguais compartilham o mesmo processamento. Falhas não são armazenadas. A revisão e os cálculos novos usam a mesma transação de leitura consistente. O cache não dispensa autenticação.

O histórico anterior a2023 continua consultável nos cartões quando solicitado explicitamente por data/ano. O resumo mensal mantém o calendário2023+ do relatório. Não houve alteração de dados, carga, fórmulas, Worker ou credenciais. As opções de plano de execução e16MB de work_mem aplicam-se somente à transação do painel; a configuração global do banco permanece igual.


Detalhamento de Vendas por Cliente usa `/clientes`, com contexto inicial `padrao_clientes`: calendário Todos, canal Todos e todos os códigos CFOP cuja descrição começa com VENDA. O filtro de página Unidade_Descricao não vazia é preservado no servidor, inclusive quando Unidade está em Todos. `/opcoes?visao=clientes` aplica esse contexto de página.

Cartões: faturamento soma Valor Total Faturado positivo; pedidos conta Pedido distinto não vazio nas mesmas linhas positivas. Sem registros, pedidos permanece vazio. Última compra exige um único cliente explicitamente selecionado, ignora calendário, mantém filtros comerciais e considera somente vendas positivas até a data atual em São Paulo. Sem cliente único ou compra, exibe Sem compras. Cliente selecionado exibe o nome fantasia quando há um único cliente no contexto; caso contrário mostra Todos os clientes.

Ranking de clientes usa SUM(Valor Produto), conforme o visual original, e não o valor positivo do cartão. Vendas detalhadas agrupam Data, Vendedor, Descrição Produto, Valor Total Faturado, Número_Texto e Preço Praticado, somando Peso_KG. Ordenação inicial: produto decrescente. Parâmetros ordenar: data/vendedor/produto/peso/total/numero/preco; direcao asc/desc; tamanho1..200. Paginação por100linhas no site, com indicador mais, sem total aproximado e sem usar a página para calcular cartões. O cache tem os mesmos limites e revisão do painel; clientes usa32MB de work_mem local à transação.


Metas e Vendedores usa calendário Todos, todos os códigos CFOP cuja descrição começa com VENDA e vendedores ativos da Dim_Vendedor, excluindo o código0. Empresa e Tipo vendedor vêm do cadastro comercial de vendedores. O filtro Supervisor usa a Base_Cadastro_Comercial nesta tela. Metas de vendedor elegíveis incluem apenas ativos que não são supervisores e datas de meta pertencentes ao calendário selecionado. Receita/peso/positivação são somados; preço médio alvo é a média das linhas elegíveis.

A positivação é atribuída ao primeiro vendedor positivo de cada Cliente+Empresa+Mês, ordenando Data, Número como TEXTO e Vendedor. A coluna é materializada no servidor e renovada na mesma transação de cada carga de faturamento; o histórico bruto permanece versionado. Totais contam clientes distintos, não somam contagens de vendedores. Percentuais visuais de atingimento são limitados a100%, como as medidas Barra do PBIX. O numerador da receita de atingimento considera vendedores com meta no calendário.

Os objetivos dos cartões usam mês/ano únicos selecionados ou o mês/ano atual, conforme as medidas Card. Seleção de vendedor tem precedência sobre supervisor nos objetivos. Realizado dos cartões de supervisor remove o filtro do vendedor; mantém os demais filtros. Preço médio realizado dos cartões é receita/peso; a matriz conserva a medida de vendas positivas. Carteira inclui clientes ativos e considera a soma líquida de Valor Produto para positivar. O painel preserva o filtro visual Tem Dados nas folhas da carteira: o vendedor aparece quando há cliente ativo da sua carteira com faturamento no contexto. O painel expande clientes por vendedor e supervisores em Receita/Peso/Positivação/Preço médio. Mix é a média do número de produtos distintos por cliente.

Positivação Efetiva: filtros Família, Vendedor, Cliente e Rede Financeira, com CFOP em Outros filtros. O visual lista clientes positivados no contexto. Última compra considera valores positivos até hoje em São Paulo e ignora calendário. As marcas de compra dos três meses contam qualquer linha de faturamento no mês, ignorando filtros do fato, conforme ALL da medida original; não exigem valor positivo. Status segue a ordem do DAX: Recorrente, Efetivo, Recuperado, Primeira Compra, A Positivar e Inativo. Dias sem comprar usa a última compra positiva.

Produtos referentes à última compra exigem um cliente único; somam Peso e Valor Total Faturado positivos da última data selecionada. Preço médio é a razão dessas somas. Sem seleção única, o painel pede selecionar cliente. Nenhum cartão ou total é calculado sobre os100registros da paginação. O cache de ambos os relatórios usa revisão das fontes e a data atual, para renovar status mesmo sem nova carga.


Interação na interface: clicar no vendedor filtra o relatório e abre automaticamente seus clientes na carteira; clicar de novo no mesmo vendedor limpa somente esse campo. O mesmo comportamento vale para clientes na Positivação e no ranking do Detalhamento. A carteira não exige um botão de expansão separado. Família por peso usa o painel compacto de duas linhas do ranking Produtos, com nome acima, barra arredondada e peso completo abaixo. Valores numéricos das tabelas analíticas e cartões são centralizados.


Padrão comercial solicitado: as quatro telas selecionam, ao entrar e ao limpar, todas as operações cuja descrição começa com VENDA (sem diferenciar maiúsculas e espaços iniciais). A lista vem de todo o histórico disponível, sem limitar ao mês, ano ou unidade atual. Operações que apenas contêm VENDA no meio da descrição ficam fora da seleção inicial. Essa seleção substitui os conjuntos fixos salvos nas páginas originais do PBIX; as fórmulas permanecem iguais. Os padrões são retornados por /filtros em padrao, padrao_clientes, padrao_metas e padrao_positivacao.

Durante a consulta, todas as telas mostram um indicador com spinner e o texto Aplicando filtros..., removido ao concluir ou falhar. A geração da consulta impede que uma resposta antiga esconda o indicador da consulta mais recente.

Gráficos por período usam canvas limitado ao tamanho do painel e uma janela de categorias com dataZoom. Quando o histórico excede a janela, um aviso informa a quantidade e as datas exibidas; a barra abaixo permite navegar por todo o histórico. A janela inicial mostra as datas mais recentes. Isso evita ultrapassar os limites de canvas em períodos diários extensos e mantém os rótulos completos e os totais do contexto.
