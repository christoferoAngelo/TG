import { Navigate } from "react-router-dom";

/** Redireciona a rota legada /perfil_locador para a área /locador. */
export default function DashboardLocador() {
    return <Navigate to="/locador" replace />;
}
