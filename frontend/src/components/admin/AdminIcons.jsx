export function IconeAdmin({ nome }) {
    const traco = {
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.75,
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    const desenhos = {
        visao: (
            <>
                <path {...traco} d="M4 19.5h16" />
                <path {...traco} d="M7 16V10" />
                <path {...traco} d="M12 16V6" />
                <path {...traco} d="M17 16v-4" />
            </>
        ),
        usuarios: (
            <>
                <circle {...traco} cx="9" cy="8" r="3" />
                <circle {...traco} cx="16.5" cy="9" r="2.2" />
                <path {...traco} d="M3.5 19c.7-2.7 2.8-4.2 5.5-4.2s4.8 1.5 5.5 4.2" />
                <path {...traco} d="M14.2 15c1.3-.4 2.5-.5 3.7-.2 1.6.4 2.7 1.5 3.2 3.2" />
            </>
        ),
        usuario: (
            <>
                <circle {...traco} cx="12" cy="8" r="3.2" />
                <path {...traco} d="M5 19.2c.9-3 3.4-4.6 7-4.6s6.1 1.6 7 4.6" />
            </>
        ),
        espacos: (
            <path
                {...traco}
                d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H5.5A1.5 1.5 0 0 1 4 19v-8.5Z"
            />
        ),
        documentos: (
            <>
                <path {...traco} d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5h-9.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5Z" />
                <path {...traco} d="M14 3.5V8h4.5" />
                <path {...traco} d="M8.5 12.5h7M8.5 16h4.5" />
            </>
        ),
        caracteristicas: (
            <>
                <path {...traco} d="M8 7h11" />
                <path {...traco} d="M8 12h11" />
                <path {...traco} d="M8 17h7" />
                <circle cx="4.5" cy="7" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="4.5" cy="12" r="1.1" fill="currentColor" stroke="none" />
                <circle cx="4.5" cy="17" r="1.1" fill="currentColor" stroke="none" />
            </>
        ),
        admin: (
            <path
                {...traco}
                d="M12 3.5 19 6.2v5.6c0 4.2-2.8 7-7 8.2-4.2-1.2-7-4-7-8.2V6.2L12 3.5Z"
            />
        ),
        sair: (
            <>
                <path {...traco} d="M9 6H6.5A1.5 1.5 0 0 0 5 7.5v9A1.5 1.5 0 0 0 6.5 18H9" />
                <path {...traco} d="M10 12h9" />
                <path {...traco} d="m16 8 4 4-4 4" />
            </>
        ),
        menu: (
            <>
                <path {...traco} d="M4 7h16" />
                <path {...traco} d="M4 12h16" />
                <path {...traco} d="M4 17h16" />
            </>
        ),
        busca: (
            <>
                <circle {...traco} cx="11" cy="11" r="6" />
                <path {...traco} d="m20 20-3.5-3.5" />
            </>
        ),
        novos: (
            <>
                <circle {...traco} cx="10" cy="8" r="3" />
                <path {...traco} d="M4 19c.7-2.8 2.8-4.3 6-4.3 1.2 0 2.3.3 3.2.8" />
                <path {...traco} d="M17 11v6M14 14h6" />
            </>
        ),
        ativos: (
            <path {...traco} d="M3 12h4l2.2-6 4.2 12L16 12h5" />
        ),
    };

    return (
        <svg
            className="adm-ico"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            aria-hidden="true"
            focusable="false"
        >
            {desenhos[nome] || null}
        </svg>
    );
}
