import { Outlet, useLocation } from "react-router-dom";
import HeaderHome from "../../pages/home/components/HeaderHome";
import "./AppShell.css";

/** Layout sem sidebar: cabeçalho global nas telas (exceto a home, que tem o próprio). */
export default function AppShell() {
    const { pathname } = useLocation();
    const naHome = pathname === "/home";

    return (
        <div className={`app-shell${naHome ? " app-shell--home" : ""}`}>
            {!naHome && <HeaderHome />}
            <div className="app-shell-content">
                <Outlet />
            </div>
        </div>
    );
}
