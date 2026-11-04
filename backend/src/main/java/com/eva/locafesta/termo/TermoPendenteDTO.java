package com.eva.locafesta.termo;

import java.util.List;

public record TermoPendenteDTO(
        boolean precisaAceitar,
        List<TermoDTO> termosPendentes
) {}
