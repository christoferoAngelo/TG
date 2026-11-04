package com.eva.locafesta.termo;

import java.util.List;

/** Aceita um ou mais termos vigentes (por id). Usuário vem da autenticação Firebase. */
public record AceiteRequestDTO(List<Long> termoIds) {}
