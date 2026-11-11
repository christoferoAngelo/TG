import { Link, Outlet, useLocation } from "react-router-dom";
import HeaderHome from "../../pages/home/components/HeaderHome";
import "./AppShell.css";

/** Layout sem sidebar: header com busca em todas as telas; categorias só na Home. */
export default function AppShell() {
    const { pathname } = useLocation();
    const naHome = pathname === "/home";

    return (
        <div className={`app-shell${naHome ? " app-shell--home" : ""}`}>
            <HeaderHome />
            <div className={`app-shell-content${!naHome ? " app-shell-content--com-voltar" : ""}`}>
                {!naHome && (
                    <nav className="app-shell-voltar" aria-label="Navegação">
                        <Link className="app-shell-voltar-link" to="/home">
                            ‹ Voltar
                        </Link>
                    </nav>
                )}
                <Outlet />
            </div>
        </div>
    );
}
