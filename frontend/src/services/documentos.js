// Máscaras e validações usadas nos cadastros (perfil e painel do locador)

export const apenasDigitos = (valor = "") => String(valor).replace(/\D/g, "");

export function mascararCep(valor) {
    const d = apenasDigitos(valor).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function mascararTelefone(valor) {
    const d = apenasDigitos(valor).slice(0, 11);
    if (d.length <= 2) return d;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascararCpf(valor) {
    const d = apenasDigitos(valor).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function mascararCnpj(valor) {
    const d = apenasDigitos(valor).slice(0, 14);
    if (d.length <= 2) return d;
    if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// Até 11 dígitos é CPF; passou disso, vira CNPJ
export function mascararCpfOuCnpj(valor) {
    return apenasDigitos(valor).length <= 11 ? mascararCpf(valor) : mascararCnpj(valor);
}

export function cpfValido(valor) {
    const d = apenasDigitos(valor);
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    const digito = (n) => {
        let soma = 0;
        for (let i = 0; i < n; i++) soma += Number(d[i]) * (n + 1 - i);
        const resto = (soma * 10) % 11;
        return resto === 10 ? 0 : resto;
    };
    return digito(9) === Number(d[9]) && digito(10) === Number(d[10]);
}

export function cnpjValido(valor) {
    const d = apenasDigitos(valor);
    if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false;
    const digito = (pesos) => {
        let soma = 0;
        for (let i = 0; i < pesos.length; i++) soma += Number(d[i]) * pesos[i];
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };
    return (
        digito([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[12]) &&
        digito([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === Number(d[13])
    );
}

// Esconde o miolo do CPF para exibir na tela: •••.•••.•••-12
export function cpfOculto(valor) {
    const d = apenasDigitos(valor);
    return d.length === 11 ? `•••.•••.•••-${d.slice(9)}` : "Cadastrado";
}
