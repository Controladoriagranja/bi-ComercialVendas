/**
 * MAPA DE FÓRMULAS: ./FORMULAS.md
 * Tema visual, sem fórmulas de indicadores.
 */
(() => {
    const STORAGE_KEY = "bi-comercial-theme";

    function temaInicial() {
        if (window.matchMedia("(max-width:767px)").matches) return "light";
        let salvo = null;
        try { salvo = localStorage.getItem(STORAGE_KEY); } catch (_) {}

        if (salvo === "light" || salvo === "dark") {
            return salvo;
        }

        return window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches
            ? "dark"
            : "light";
    }

    function aplicarTema(tema) {
        document.documentElement.dataset.theme = tema;

        document
            .querySelectorAll("[data-theme-icon]")
            .forEach(el => {
                el.textContent =
                    tema === "dark"
                        ? "☀"
                        : "☾";
            });

        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            const label = tema === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro';
            button.setAttribute('aria-label', label);
            button.setAttribute('title', label);
            button.setAttribute('aria-pressed', String(tema === 'dark'));
        });

        document.dispatchEvent(
            new CustomEvent(
                "dashboard:theme-changed",
                { detail: { theme: tema } }
            )
        );
    }

    window.ThemeManager = {
        get() {
            return document.documentElement.dataset.theme || temaInicial();
        },

        refresh() { aplicarTema(this.get()); },

        toggle() {
            const novo =
                this.get() === "dark"
                    ? "light"
                    : "dark";

            try { localStorage.setItem(STORAGE_KEY, novo); } catch (_) {}

            aplicarTema(novo);
        },

        init() {
            aplicarTema(temaInicial());
            window.addEventListener("pageshow", () => {
                if (window.matchMedia("(max-width:767px)").matches) aplicarTema("light");
            });

            document.addEventListener(
                "click",
                event => {
                    const button =
                        event.target.closest(
                            "[data-theme-toggle]"
                        );

                    if (button) {
                        this.toggle();
                    }
                }
            );
        }
    };

    ThemeManager.init();
})();
