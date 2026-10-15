# Contrato da nova API Comercial

Configuração em assets/js/config.js. Prefixo exclusivo `/api/comercial-html`; reutiliza Worker e autenticação CENTRAL. Não há chave de banco nem credencial Basic no frontend.

| Consulta | Resposta utilizada |
|---|---|
| GET /health | fontes, ultima_atualizacao/concluido_em |
| GET /filtros | periodo.inicio/fim, unidades[].codigo/nome, padrao.ano/canal/descricao_cfop |
| GET /resumo | contrato=comercial-html-v1, medidas: faturamento,peso,preco_medio,cliente_destaque,clientes,registros |
| GET /serie?periodo=dia/semana/mes | serie[].data,faturamento,peso,preco_medio |
| GET /ranking?dimensao=vendedor/cliente/produto/uf | dados[].codigo,nome,faturamento,peso; até100grupos |
| GET /dados/{fonte}?pagina=1&tamanho=25 | colunas[].original/coluna, dados[], total,pagina,tamanho |

Filtros dos indicadores, séries, rankings e opções: inicio/fim ISO inclusivos; ano e mes numéricos; dia como data completa ISO (exibição DD/MM/AAAA); vendedor, cliente, produto, uf, familia, cfop, descricao_cfop, cidade, supervisor, unidade_cadastro, canal, regiao, rede_comercial, rede_financeira e grupo. Valores repetidos são unidos por OU; campos diferentes por E. O sufixo `_exc` exclui valores, preservando a opção Selecionar todos sem carregar todos os clientes/produtos no navegador. `__nenhum__` representa uma seleção explicitamente vazia. Cada campo aceita até100valores; datas invertidas e campos desconhecidos retornam422.

`GET /opcoes?campo=cliente&q=texto` pesquisa por código e descrição, retorna dados[].codigo/nome e mais; até100opções por pesquisa. Aplica os outros filtros e ignora a seleção do próprio campo. A interface informa quando é necessário refinar a busca. Selecionar todos abrange todas as opções, inclusive as que não estão entre as100exibidas.

O contexto inicial usa mês mais recente, ano correspondente, canal VAREJO e as nove descrições de CFOP selecionadas no PBIX. Limpar filtros restaura esse contexto, mostrado nos controles. Selecionar todos em um campo remove sua restrição; não há filtro comercial implícito na API. O resumo contém todo o recorte; rankings limitados não recalculam os cartões.

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
