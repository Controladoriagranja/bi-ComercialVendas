# Contrato da nova API Comercial

Configuração em assets/js/config.js. Prefixo exclusivo `/api/comercial-html`; reutiliza Worker e autenticação CENTRAL. Não há chave de banco nem credencial Basic no frontend.

| Consulta | Resposta utilizada |
|---|---|
| GET /health | fontes, ultima_atualizacao/concluido_em |
| GET /filtros | periodo.inicio/fim, unidades[].codigo |
| GET /resumo | contrato=comercial-html-v1, medidas: faturamento,peso,preco_medio,clientes,registros |
| GET /serie?periodo=dia/semana/mes | serie[].data,faturamento,peso |
| GET /ranking?dimensao=vendedor/cliente/produto/uf | dados[].codigo,nome,faturamento,peso; até100grupos |
| GET /dados/{fonte}?pagina=1&tamanho=25 | colunas[].original/coluna, dados[], total,pagina,tamanho |

Filtros dos indicadores e séries: inicio/fim ISO inclusivos, unidade, vendedor, cliente, produto, uf, familia, cfop e cidade. O resumo contém todo o recorte. O ranking limitado não deve ser usado para recalcular totais. Dados de cadastros não recebem filtro de período, pois ainda não há contrato analítico dessas telas.

Para metas, a consulta de cadastro usa `preenchidos=1`: lista apenas linhas com código preenchido, sem excluir linhas do banco nem modificar a consulta padrão. A fotografia original de1175linhas é preservada;959linhas possuem código no modelo conferido em15/10/2026. Esse número é apenas conferência, não constante da interface.

Medidas disponíveis:
- Faturamento: SUM(Valor Produto).
- Peso: SUM(Peso).
- Preço médio: soma de Valor Produto dividida por soma de Peso, apenas em linhas VENDA com valores e pesos positivos.
- Clientes com movimento: clientes distintos do contexto; **não é a medida de clientes positivados**.

O preço médio geral não é obtido de faturamento/peso sem o recorte de vendas. A tabela de agrupamentos não apresenta preço médio por essa aproximação.

Fontes de consulta: metas, clientes_cadastrados, cadastro_de_vendedores, base_cadastro_comercial, redes_compras, grupo_produto. Os valores retornam da versão vigente no banco. O site não lê Parquet e não usa fixtures como fonte operacional.

Erros:401/403 limpam resultados;422 orienta corrigir filtro; falhas de disponibilidade preservam a última consulta confirmada. Controle por AbortController/generation evita que consultas antigas sobrescrevam filtros recentes.
