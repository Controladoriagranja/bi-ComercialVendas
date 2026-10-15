# Instruções de desenvolvimento

- Manter o padrão visual do PCP e tratar mudanças de mobile exclusivamente na media query de até767px quando não solicitadas para desktop.
- Não alterar outro repositório, o PCP ou o faturamento-nf anterior para implementar telas aqui.
- Usar somente `/api/comercial-html`. Agregações e regras de negócio pertencem ao backend, nunca a totais calculados sobre uma página ou um ranking limitado.
- Nenhum dado operacional, token, senha, Parquet, PBIX, planilha ou resposta autenticada entra neste repositório público.
- Não inventar metas, positivar clientes por aproximação, somar preços médios ou copiar valores das imagens para o site.
- Relatórios ainda não portados devem ser identificados como em desenvolvimento. Manter o estado em docs/medidas.json e docs/mapa-paginas.json atualizado.
- Preservar datas do Comercial; não aplicar automaticamente D−1. A unidade da nota é Uni, não o contexto de extração. O filtro visual Unidade reproduz o cadastro comercial do PBIX por Uni+Vendedor (unidade_cadastro), separado do parâmetro técnico unidade.
- Preservar login CENTRAL/Worker; nunca colocar Basic no JavaScript nem criar outro login.
- Mobile sempre inicia claro; controles de período e barras permitem consultar o histórico; limitar deslocamento horizontal ao componente.
- Verificar `python -m unittest discover -s tests -v`, sintaxeJS e navegador nas larguras320/390/1366 antes de publicar alterações relevantes.
- Atualizar hashes de recursos nosHTMLs com `python tools/version_assets.py` quando alterar CSS ou JS.
