# Incorporação na CENTRAL

URL inicial:

https://controladoriagranja.github.io/bi-ComercialVendas/

HTML:

```html
<iframe
  title="Comercial Vendas"
  src="https://controladoriagranja.github.io/bi-ComercialVendas/"
  width="100%"
  height="900"
  style="border:0; display:block;"
  allowfullscreen>
</iframe>
```

Links diretos: `?relatorio=faturamento`, `clientes`, `vendedores`, `produtos`, `metas`, `positivacao` ou `supervisao`.

É um relatório HTML, não uma URL reportEmbed do PowerBI. Ao cadastrar na CENTRAL, usar incorporaçãoHTML/URL externa conforme o campo já usado para o PCP. Na mesma origem `https://controladoriagranja.github.io`, a sessão CENTRAL em sessionStorage fica disponível ao relatório incorporado. A validação real continua no Worker e na API; iframe não concede acesso a dados.

Abrir o link fora da sessão pode mostrar orientação para entrar pela CENTRAL. Não passar token na URL nem incluir credenciais no código acima. Incorporação em uma origem diferente requer avaliar o fluxo de sessão existente; não implementar recebimento irrestrito de tokens por postMessage.

A configuração do novo cartão no cadastro da CENTRAL não é feita por este repositório. O código e a URL são os valores a cadastrar.
