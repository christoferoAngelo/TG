package com.eva.locafesta.dashboardAdmin;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardAdminDTO {

    // --- Pilar 1: Usuários ---
    private long totalUsuarios;
    private long usuariosAtivosUltimoMes;
    private long totalLocadores;
    private long novosUsuariosMesAtual;
    private long contasSuspensasInativas;

    // --- Pilar 2: Espaços ---
    private long totalEspacos;
    private long espacosAprovados;
    private long espacosPendentesAprovacao;

    // --- Pilar 3: Reservas (Futuro) ---
    private long totalReservas;
    private BigDecimal faturamentoEstimado;

    
}