package com.eva.locafesta.documento;

public class DocumentoDTO {
    
    private String cpfCnpj;
    private String telefone;

    public DocumentoDTO() {}

    public DocumentoDTO(String cpfCnpj, String telefone) {
        this.cpfCnpj = cpfCnpj;
        this.telefone = telefone;
    }

    // Getters e Setters
    public String getCpfCnpj() {
        return cpfCnpj;
    }

    public void setCpfCnpj(String cpfCnpj) {
        this.cpfCnpj = cpfCnpj;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }
}