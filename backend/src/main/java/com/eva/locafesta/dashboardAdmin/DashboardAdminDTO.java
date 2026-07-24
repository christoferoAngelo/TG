package com.eva.locafesta.dashboardAdmin;

import java.math.BigDecimal;

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

    public DashboardAdminDTO() {}

    public DashboardAdminDTO(long totalUsuarios, long usuariosAtivosUltimoMes, long totalLocadores,
                               long novosUsuariosMesAtual, long contasSuspensasInativas, long totalEspacos,
                               long espacosAprovados, long espacosPendentesAprovacao, long totalReservas,
                               BigDecimal faturamentoEstimado) {
        this.totalUsuarios = totalUsuarios;
        this.usuariosAtivosUltimoMes = usuariosAtivosUltimoMes;
        this.totalLocadores = totalLocadores;
        this.novosUsuariosMesAtual = novosUsuariosMesAtual;
        this.contasSuspensasInativas = contasSuspensasInativas;
        this.totalEspacos = totalEspacos;
        this.espacosAprovados = espacosAprovados;
        this.espacosPendentesAprovacao = espacosPendentesAprovacao;
        this.totalReservas = totalReservas;
        this.faturamentoEstimado = faturamentoEstimado;
    }

    // Getters e Setters
    public long getTotalUsuarios() { return totalUsuarios; }
    public void setTotalUsuarios(long totalUsuarios) { this.totalUsuarios = totalUsuarios; }

    public long getUsuariosAtivosUltimoMes() { return usuariosAtivosUltimoMes; }
    public void setUsuariosAtivosUltimoMes(long usuariosAtivosUltimoMes) { this.usuariosAtivosUltimoMes = usuariosAtivosUltimoMes; }

    public long getTotalLocadores() { return totalLocadores; }
    public void setTotalLocadores(long totalLocadores) { this.totalLocadores = totalLocadores; }

    public long getNovosUsuariosMesAtual() { return novosUsuariosMesAtual; }
    public void setNovosUsuariosMesAtual(long novosUsuariosMesAtual) { this.novosUsuariosMesAtual = novosUsuariosMesAtual; }

    public long getContasSuspensasInativas() { return contasSuspensasInativas; }
    public void setContasSuspensasInativas(long contasSuspensasInativas) { this.contasSuspensasInativas = contasSuspensasInativas; }

    public long getTotalEspacos() { return totalEspacos; }
    public void setTotalEspacos(long totalEspacos) { this.totalEspacos = totalEspacos; }

    public long getEspacosAprovados() { return espacosAprovados; }
    public void setEspacosAprovados(long espacosAprovados) { this.espacosAprovados = espacosAprovados; }

    public long getEspacosPendentesAprovacao() { return espacosPendentesAprovacao; }
    public void setEspacosPendentesAprovacao(long espacosPendentesAprovacao) { this.espacosPendentesAprovacao = espacosPendentesAprovacao; }

    public long getTotalReservas() { return totalReservas; }
    public void setTotalReservas(long totalReservas) { this.totalReservas = totalReservas; }

    public BigDecimal getFaturamentoEstimado() { return faturamentoEstimado; }
    public void setFaturamentoEstimado(BigDecimal faturamentoEstimado) { this.faturamentoEstimado = faturamentoEstimado; }
}