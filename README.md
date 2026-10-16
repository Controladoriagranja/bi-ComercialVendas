# Comercial Vendas

Base HTML do novo Comercial da Granja Brasília, no mesmo padrão visual e mobile do PCP.

**Site:** https://controladoriagranja.github.io/bi-ComercialVendas/

## O que já funciona

- Faturamento, peso, preço médio e cliente destaque: valores retornados pela nova API Comercial.
- Gráficos em barras por dia, semana ou mês; resumo com todos os meses disponíveis do ano, e painéis compactos de clientes, produtos e vendedores.
- Filtros aplicados automaticamente após a seleção, sem botão Atualizar. Abertura sempre com calendário Todos e contexto comercial próprio de cada tela.
- Todos os filtros em listas compactas com pesquisa, seleção múltipla e Selecionar todos, incluindo mês, ano, unidade, canal, supervisor, região, redes e grupo.
- Clique no cliente/vendedor/produto para aplicar o recorte, ordenação das vendas e consultas paginadas de cadastros.
- Menu com Faturamento, Detalhamento de Clientes, Positivação Efetiva e Vendedores e Metas.
- Ajuda (ramal5236, Anderson ou Vitor), tema opcional, mobile sempre claro ao abrir.
- Barras cinzas de toque no celular, gráficos sem balão sobreposto, tabelas com identificação fixa e rolagem interna.
- Atualização analítica consolidada em uma chamada, com reaproveitamento da leitura e cache invalidado pelas cargas de dados.
- Falha de rede mantém a última consulta confirmada. Sessão401/403 limpa os resultados.

## Telas preparadas para continuar

| Tela | Estado |
|---|---|
| Faturamento | Base conectada: indicadores, séries e agrupamentos |
| Detalhamento de Vendas por Cliente | Cliente selecionado, faturamento, pedidos, última compra, ranking e vendas detalhadas paginadas conforme regras do PBIX |
| Detalhamento de Vendedores | Base conectada: recorte e vendas por vendedor |
| Vendas por Produto | Base conectada: recorte e vendas por produto |
| Metas e Vendedores | Objetivos e realizado, atingimento por vendedor, carteira expansível, supervisores, mix, produtos e famílias |
| Positivação Efetiva | Status por cliente, meses de compra, última compra e produtos da compra selecionada |
| Supervisão | Estrutura e consulta da equipe; consolidação ainda em desenvolvimento |

Isso é a base para desenvolver o relatório: **não é uma declaração de equivalência completa às125medidas do PBIX**. As11páginas originais, incluindo duplicatas, estão mapeadas em [docs/mapa-paginas.json](docs/mapa-paginas.json). O inventário de medidas e seus estados está em [docs/medidas.json](docs/medidas.json). Não são exibidos números simulados para análises pendentes.

## Como executar

Sem instalação de pacotes, sem build:

```text
python tools/preview.py
```

Abrir http://127.0.0.1:8129/. Esse preview mostra o HTML e o tratamento de sessão; as consultas autenticadas de produção são abertas pela CENTRAL, no domínio GitHubPages já autorizado. Não inventar token nem colocar credenciais no navegador para testar. A validação interna com API real e proxy transitório fica fora deste repositório público.

```text
python -m unittest discover -s tests -v
```

A CI também verifica sintaxe dos arquivos JavaScript. Em navegador, conferir320px/390px e desktop1366px, incluindo filtros, barras, menus, estado sem sessão e falhas401/503.

## Organização

- `index.html`: estrutura única, página selecionada por `?relatorio=`.
- `assets/js/app.js`: telas, estados e apresentação.
- `assets/js/analysis.js`: apresentação de metas e positivação; cálculos retornados pela API.
- `assets/js/clients.js`: apresentação dos quatro cartões e das vendas detalhadas por cliente.
- `assets/js/filters.js`: filtros com pesquisa, seleção múltipla e contexto inicial do PBIX.
- `assets/js/api.js`: cliente autenticado e erros; sem fórmulas financeiras.
- `assets/js/config.js`: endereço do Worker e prefixo `/api/comercial-html`.
- `assets/js/mobile-scroll.js`: controle de rolagem reaproveitado do PCP.
- `assets/css/app.css` e `pcp.css`: padrão visual do PCP; `comercial.css`: adaptação Comercial.
- `docs/`: contratos, incorporação, mapa das telas e inventário para desenvolvimento.

## Dados e segurança

Fluxo de produção: CENTRAL → Bearer → Worker existente → API8010 → PostgreSQL `comercial_html`. O navegador usa a sessão `granjabi_auth_token`, como o PCP. O repositório contém apenas código e recursos visuais. Parquets, PBIX, planilhas, respostas da API, nomes de clientes e credenciais não são versionados.

Este é **outro** Comercial. Não usar endpoints `/api/bi/faturamento-nf` nem as views do faturamento anterior. Não calcular uma métrica sobre uma página de25registros e apresentá-la como total. A API agrega todo o contexto. Não herdar D−1 do PCP: o novo Comercial usa seu próprio período e pode incluir o dia corrente.

O módulo está carregado no banco e disponível na API. O código deste site não ativa tarefas automáticas de robôs. Cadastros auxiliares/metas são a fotografia importada do PBIX; sua atualização automática é uma etapa distinta.
