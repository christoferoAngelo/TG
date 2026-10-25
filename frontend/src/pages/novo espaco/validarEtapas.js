import { calcularTurnos } from "./turnos";

export function validarEtapa1(form, ambientes) {
    const e = {};
    const end = form.endereco;

    if (!form.titulo.trim()) e.titulo = "Dê um nome ao espaço.";
    if (!form.descricao.trim()) e.descricao = "Descreva o espaço para quem vai alugar.";
    if (!form.tiposEvento.length) e.tiposEvento = "Escolha pelo menos um tipo de evento.";
    if (!(Number(form.valorDiaria) > 0)) e.valorDiaria = "Informe o valor base.";
    if (!(parseInt(form.capacidadePessoas, 10) > 0)) e.capacidadePessoas = "Informe a capacidade (mínimo 1).";

    if (end.cep.replace(/\D/g, "").length !== 8) e.end_cep = "Informe um CEP com 8 dígitos.";
    if (!end.logradouro.trim()) e.end_logradouro = "Informe a rua ou avenida.";
    if (!end.numero.trim()) e.end_numero = "Informe o número.";
    if (!end.bairro.trim()) e.end_bairro = "Informe o bairro.";
    if (!end.cidade.trim()) e.end_cidade = "Informe a cidade.";
    if (end.estado.trim().length !== 2) e.end_estado = "Use a sigla com 2 letras.";

    const preenchidos = ambientes.filter((a) => a.titulo.trim() || a.descricao.trim() || a.fotos.length > 0);
    if (preenchidos.length === 0) {
        e.ambientes = "Adicione pelo menos um cômodo com fotos.";
    } else if (preenchidos.reduce((soma, a) => soma + a.fotos.length, 0) > 24) {
        e.ambientes = "O anúncio aceita no máximo 24 fotos.";
    } else {
        const amb = {};
        preenchidos.forEach((a) => {
            const erroAmb = {};
            if (!a.titulo.trim()) erroAmb.titulo = "Dê um nome ao cômodo.";
            if (a.fotos.length === 0) erroAmb.fotos = "Adicione pelo menos uma foto.";
            if (a.fotos.length > 8) erroAmb.fotos = "Cada cômodo aceita no máximo 8 fotos.";
            if (Object.keys(erroAmb).length) amb[a.id] = erroAmb;
        });
        if (Object.keys(amb).length) e.amb = amb;
    }

    return e;
}

export function validarEtapa2(form) {
    const e = {};

    if (!form.horarioAbertura) e.horarioAbertura = "Informe o horário de abertura.";
    if (!form.horarioFechamento) {
        e.horarioFechamento = "Informe o horário de fechamento.";
    } else if (!form.fechaNoDiaSeguinte && form.horarioAbertura && form.horarioFechamento <= form.horarioAbertura) {
        e.horarioFechamento = "O fechamento precisa ser depois da abertura, ou marque que fecha no dia seguinte.";
    }

    const antecedencia = form.antecedenciaMinimaDias === "" ? 0 : Number(form.antecedenciaMinimaDias);
    if (!Number.isInteger(antecedencia) || antecedencia < 0 || antecedencia > 365) {
        e.antecedenciaMinimaDias = "Informe um número inteiro de 0 a 365.";
    }

    const prazoCancelamento = form.prazoCancelamentoDias === "" ? 2 : Number(form.prazoCancelamentoDias);
    if (!Number.isInteger(prazoCancelamento) || prazoCancelamento < 0 || prazoCancelamento > 30) {
        e.prazoCancelamentoDias = "Informe um número inteiro de 0 a 30.";
    }

    if (!form.aceitaIntegral && !form.aceitaFracionado) {
        e.formas = "Escolha diária, fracionada ou as duas.";
    }

    if (!form.aceitaFracionado) return e;

    const duracao = Number(form.duracaoMaxHoras);
    if (!(duracao > 0) || duracao > 99.99) {
        e.duracaoMaxHoras = "Informe a duração do evento, entre 0,01 e 99,99 horas.";
    }

    const limpeza = Number(form.intervaloLimpezaMin);
    if (form.intervaloLimpezaMin === "" || !Number.isInteger(limpeza) || limpeza < 0) {
        e.intervaloLimpezaMin = "Informe o tempo de limpeza em minutos (0 ou mais).";
    }

    if (!e.horarioAbertura && !e.horarioFechamento && !e.duracaoMaxHoras && !e.intervaloLimpezaMin) {
        const { turnos } = calcularTurnos({
            abertura: form.horarioAbertura,
            fechamento: form.horarioFechamento,
            duracaoHoras: form.duracaoMaxHoras,
            limpezaMin: limpeza,
        });
        if (turnos.length === 0) {
            e.duracaoMaxHoras = "Essa duração não cabe entre a abertura e o fechamento.";
        }
    }

    return e;
}

export function validarEtapa4({ editando, documento, seguranca, segurancaAberta, contratoLido, termosAceitos }) {
    const e = {};
    if (editando) return e;

    if (!documento.tipo) e.documentoTipo = "Escolha qual comprovante você está enviando.";
    if (!documento.arquivo) e.documentoArquivo = "Anexe o arquivo do comprovante.";

    if (segurancaAberta && (seguranca.tipo || seguranca.arquivo)) {
        if (!seguranca.tipo) e.segurancaTipo = "Escolha se o arquivo é alvará ou AVCB.";
        if (!seguranca.arquivo) e.segurancaArquivo = "Anexe o documento de segurança.";
    }

    if (!contratoLido) e.contrato = "Role o contrato até o final para continuar.";
    else if (!termosAceitos) e.termos = "Aceite os termos para concluir o cadastro.";

    return e;
}
