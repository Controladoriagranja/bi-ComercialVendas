/**
 * MAPA DE FÓRMULAS: ./FORMULAS.md
 * Navegação, sem fórmulas de indicadores.
 */
(() => {
    const current = document.body.dataset.page || "";

    const items = [
    {
        "id": "faturamento",
        "label": "Faturamento",
        "href": "index.html?relatorio=faturamento"
    },
    {
        "id": "clientes",
        "label": "Detalhamento de Clientes",
        "href": "index.html?relatorio=clientes"
    },
    {
        "id": "positivacao",
        "label": "Positivação Efetiva",
        "href": "index.html?relatorio=positivacao"
    },
    {
        "id": "metas",
        "label": "Vendedores e Metas",
        "href": "index.html?relatorio=metas"
    }
];

    const root = document.createElement("div");
    root.className = "side-nav-root";
    root.innerHTML = `
        <button class="side-nav-rail" type="button" aria-label="Abrir menu" aria-expanded="false">
            <span class="side-nav-hamburger" aria-hidden="true"><i></i><i></i><i></i></span>
        </button>
        <div class="side-nav-overlay" aria-hidden="true"></div>
        <aside class="side-nav-panel" aria-label="Navegação principal" aria-hidden="true">
            <div class="side-nav-brand">
                <div class="side-nav-panel-head">
                    <img src="assets/img/logo-granja-brasilia-branca.png" alt="Granja Brasília" class="side-nav-logo">
                    <button class="side-nav-close" type="button" aria-label="Fechar menu">×</button>
                </div>
                <div class="side-nav-section-title">RELATÓRIO COMERCIAL</div>
            </div>
            <nav class="side-nav-links">
                ${items.map(item => `
                    <a class="side-nav-link ${current === item.id ? "active" : ""}" href="${item.href}" ${current === item.id ? 'aria-current="page"' : ""}>
                        <span>${item.label}</span>
                    </a>
                `).join("")}
            </nav><nav class="pcp-support-nav" aria-label="Suporte Comercial"><a href="ajuda.html">Ajuda</a></nav>
        </aside>
    `;

    document.body.classList.add("has-side-nav");
    document.body.prepend(root);
    // A API existente não possui /pcp-modelo/sessao ou edição administrativa.
    // O menu não tenta consultar rotas inexistentes nem deduz perfil pelo Basic.



    const rail = root.querySelector(".side-nav-rail");
    const panel = root.querySelector(".side-nav-panel");
    const overlay = root.querySelector(".side-nav-overlay");
    const close = root.querySelector(".side-nav-close");

    const setOpen = open => {
        root.classList.toggle("open", open);
        rail.setAttribute("aria-expanded", String(open));
        panel.setAttribute("aria-hidden", String(!open));
        overlay.setAttribute("aria-hidden", String(!open));
        document.body.classList.toggle("side-nav-open", open);
    };

    setOpen(false);

    rail.addEventListener("click", () => setOpen(true));
    close.addEventListener("click", () => setOpen(false));
    overlay.addEventListener("click", () => setOpen(false));

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && root.classList.contains("open")) {
            setOpen(false);
            rail.focus({preventScroll:true});
        }
    });
})();
