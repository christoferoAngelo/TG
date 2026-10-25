export const TERMOS = [
    {
        titulo: "1. Objeto e papel da plataforma",
        itens: [
            "1.1. Estes Termos regulam o uso do LocaFesta, plataforma web que aproxima LOCADORES, que anunciam espaços para eventos, e LOCATÁRIOS, que os reservam. O LocaFesta atua exclusivamente como intermediador tecnológico: não é proprietário, administrador nem possuidor dos espaços anunciados e não mantém vínculo empregatício ou societário com os usuários.",
            "1.2. A locação de cada espaço é um acordo entre locador e locatário, nas condições do Termo de Reserva (Apêndice C). O LocaFesta não se responsabiliza por danos físicos ou patrimoniais, incidentes ou acidentes ocorridos no espaço durante o período locado, sem prejuízo das responsabilidades previstas em lei."
        ]
    },
    {
        titulo: "2. Cadastro e conta",
        itens: [
            "2.1. Qualquer pessoa pode pesquisar espaços e simular valores sem entrar na conta. O login é exigido apenas para fechar uma reserva.",
            "2.2. O cadastro é feito com e-mail e senha ou com a conta Google, e exige a confirmação do e-mail. O usuário deve informar dados verdadeiros e manter a conta de uso pessoal e intransferível.",
            "2.3. Para fechar reservas, o locatário deve completar o cadastro com CPF, telefone, endereço, documento de identidade (RG ou CNH, frente e verso) e comprovante de residência. Para anunciar espaços, o locador deve habilitar o perfil de locador e enviar os documentos do espaço (como matrícula ou escritura, ou contrato de locação, ou autorização do proprietário).",
            "2.4. O administrador da plataforma analisa os documentos e pode aprová-los ou rejeitá-los, informando o motivo. A aprovação indica apenas que os documentos foram conferidos e não garante a qualidade do espaço ou do usuário."
        ]
    },
    {
        titulo: "3. Responsabilidades gerais dos usuários",
        itens: [
            "3.1. Os usuários devem agir com boa-fé, tratar os demais com respeito, manter seus dados atualizados e escrever avaliações verdadeiras, feitas somente após o evento.",
            "3.2. É proibido usar a plataforma para atividades ilícitas, fraudes, anúncios falsos ou conteúdo ofensivo."
        ]
    },
    {
        titulo: "4. Disposições específicas do locador (aceitas ao habilitar o perfil de locador)",
        itens: [
            "4.1. O locador declara ter legitimidade para alugar o espaço e que ele reúne as condições de segurança exigidas pela legislação aplicável.",
            "4.2. O locador deve manter o anúncio fiel à realidade, com fotos e descrições atuais, entregar o espaço limpo e funcional, garantir o acesso do locatário no horário de início e fornecer as orientações de uso.",
            "4.3. O locador define, para cada espaço, as regras do anúncio, os horários, os valores, a antecedência mínima e se as reservas exigem a sua aprovação. A cada reserva paga, o LocaFesta retém comissão de 10% do valor da reserva, que é descontada do repasse ao locador; o locatário não paga acréscimo por essa comissão."
        ]
    },
    {
        titulo: "5. Pagamentos e repasse",
        itens: [
            "5.1. Todos os pagamentos devem ser feitos exclusivamente pela plataforma, por Pix, por meio do Mercado Pago. Pagamentos ou negociações por fora da plataforma são infração grave e sujeitam os envolvidos à suspensão ou ao bloqueio da conta, após análise.",
            "5.2. O evento é encerrado automaticamente ao fim do horário da reserva. Sete dias depois, se o locatário não tiver relatado problema, o valor é repassado automaticamente ao locador, descontada a comissão.",
            "5.3. As regras de cancelamento e reembolso constam do Termo de Reserva (Apêndice C)."
        ]
    },
    {
        titulo: "6. Problemas e suporte",
        itens: [
            "6.1. Se houver algum problema com a reserva, o locatário pode descrevê-lo pela plataforma em até sete dias após o encerramento. O relato é enviado ao suporte, que responde em até dois dias úteis, e o repasse fica suspenso até a análise.",
            "6.2. Em caso de fraude, dano ou infração, o LocaFesta pode reter valores, suspender ou bloquear perfis e fornecer dados cadastrais às autoridades competentes mediante ordem judicial."
        ]
    },
    {
        titulo: "7. Privacidade e proteção de dados (LGPD)",
        itens: [
            "7.1. O LocaFesta trata dados pessoais conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018). Os dados coletados são nome, e-mail, telefone, CPF, endereço, documentos enviados, dados do espaço e das reservas e dados do pagamento.",
            "7.2. Os dados são usados para criar e manter a conta, verificar identidade, prevenir fraudes, realizar reservas e pagamentos e comunicar-se com o usuário. A base legal é o consentimento, dado no aceite destes Termos, e a execução do serviço contratado.",
            "7.3. Os dados são compartilhados somente com os serviços necessários ao funcionamento (autenticação, armazenamento de arquivos e pagamentos) e, na medida necessária para a reserva, entre locador e locatário. O acesso aos documentos é restrito aos perfis autorizados. As senhas não são guardadas pelo LocaFesta, pois a autenticação é feita pelo Firebase Authentication.",
            "7.4. O usuário pode, a qualquer momento, pedir confirmação do tratamento, acesso, correção e eliminação de seus dados, ou revogar o consentimento, pelo e-mail do suporte. Alguns dados podem ser mantidos pelo prazo exigido por lei ou para a defesa de direitos."
        ]
    },
    {
        titulo: "8. Disposições finais",
        itens: [
            "8.1. Estes Termos podem ser atualizados, e mudanças relevantes serão comunicadas. O sistema registra a data, a hora e a versão do aceite de cada usuário.",
            "8.2. Aplica-se a legislação brasileira, e as disputas serão resolvidas no foro previsto em lei."
        ]
    }
];

export const EMAIL_SUPORTE = "locafesta.suporte@gmail.com";

export const CHAVE_TERMOS = "hasAcceptedTerms";
export const CHAVE_JORNADA = "hasSeenOnboarding";
