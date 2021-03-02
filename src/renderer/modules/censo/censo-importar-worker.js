var Papa = require("papaparse")
var baseDados = {};

// Dados de Cadastro da Escola
function parseRegistro00(registro) {
    // Campos default
    var escola = {
        PESSOAS: {},
        ALUNOS: {},
        TURMAS: {},
        CONTATO_RESPONSAVEL: "",
        CONTATO_TELEFONE: "",
        MEC_IN_REGULAR: false,
        MEC_IN_EJA: false,
        MEC_IN_PROFISSIONALIZANTE: false,
        MEC_IN_ESPECIAL_EXCLUSIVA: false,
        HORARIO_MATUTINO: false,
        HORARIO_VESPERTINO: false,
        HORARIO_NOTURNO: false,
        ENSINO_PRE_ESCOLA: false,
        ENSINO_FUNDAMENTAL: false,
        ENSINO_MEDIO: false,
        ENSINO_SUPERIOR: false
    }

    // Campos Obrigatórios
    escola["ID_ESCOLA"] = Number(registro.data[1]);
    escola["MEC_CO_ENTIDADE"] = Number(registro.data[1]);
    escola["SITUACAO"] = Number(registro.data[2]);
    escola["NOME"] = registro.data[5];
    escola["MEC_NO_ENTIDADE"] = registro.data[5];
    escola["LOC_CEP"] = registro.data[6];
    escola["MEC_CO_MUNICIPIO"] = Number(registro.data[7]);
    escola["DISTRITO"] = registro.data[8];
    escola["LOC_ENDERECO"] = registro.data[9];

    // Campos opcionais referentes a localização e contato
    if (registro.data[10] != null && registro.data[10] != "") {
        escola["LOC_ENDERECO"] = escola["LOC_ENDERECO"] + " - NUM " + registro.data[10]
    }
    if (registro.data[11] != null && registro.data[11] != "") {
        escola["LOC_ENDERECO"] = escola["LOC_ENDERECO"] + " - " + registro.data[11]
    }
    if (registro.data[12] != null && registro.data[12] != "") {
        escola["LOC_ENDERECO"] = escola["LOC_ENDERECO"] + " - BAIRRO: " + registro.data[12]
    }
    if (registro.data[13] != null && registro.data[13] != "") {
        escola["CONTATO_TELEFONE"] = "(" + registro.data[13] + ")"
    }
    if (registro.data[14] != null && registro.data[15] != "") {
        escola["CONTATO_TELEFONE"] = escola["CONTATO_TELEFONE"] + " " + registro.data[14]
    }

    // Campos obrigatórios restantes (localização da escola)
    escola["MEC_TP_LOCALIZACAO"] = Number(registro.data[18]);
    escola["MEC_TP_LOCALIZACAO_DIFERENCIADA"] = Number(registro.data[19]);
    escola["MEC_TP_DEPENDENCIA"] = Number(registro.data[20]);

    return escola;
}

// Dados de Cadastro das Turmas da Escola
function parseRegistro20(registro) {
    var turma = {
        MEC_IN_REGULAR: false,
        MEC_IN_EJA: false,
        MEC_IN_PROFISSIONALIZANTE: false,
        MEC_IN_ESPECIAL_EXCLUSIVA: false,
        HORARIO_MATUTINO: false,
        HORARIO_VESPERTINO: false,
        HORARIO_INTEGRAL: false,
        HORARIO_NOTURNO: false,
        ENSINO_PRE_ESCOLA: false,
        ENSINO_FUNDAMENTAL: false,
        ENSINO_MEDIO: false,
        ENSINO_SUPERIOR: false
    }

    // Turma regular (1) ou é de atividade complementar (0) ?
    if (Number(registro.data[17]) == 1) {
        // Modalidade de ensino da turma
        var modalidade = Number(registro.data[27]);
        switch (modalidade) {
            case 1:
                turma["MEC_IN_REGULAR"] = true;
                break;
            case 2:
                turma["MEC_IN_ESPECIAL_EXCLUSIVA"] = true;
                break;
            case 3:
                turma["MEC_IN_EJA"] = true;
                break;
            case 4:
                turma["MEC_IN_PROFISSIONALIZANTE"] = true;
                break;
            default:
                turma["MEC_IN_REGULAR"] = true;
        }

        // Etapa (série) de ensino da turma
        var etapa = Number(registro.data[28]);
        if ([1, 2, 3, 56].includes(etapa)) {
            turma["ENSINO_PRE_ESCOLA"] = true;
        } else if ((4 <= etapa && etapa <= 24) ||
            ((etapa == 65) || (etapa == 69) || (etapa == 70) || (etapa == 72) || (etapa == 73))) {
            turma["ENSINO_FUNDAMENTAL"] = true;
        } else {
            turma["ENSINO_MEDIO"] = true;
        }

        // Horário de inicío da turma
        if (registro.data[6] != null && registro.data[6] != "") {
            var horaInicial = Number(registro.data[6]);
            var horaFinal = Number(registro.data[8]);

            if (horaInicial >= 18) {
                turma["HORARIO_NOTURNO"] = true;
            } else if (horaInicial >= 12) {
                turma["HORARIO_VESPERTINO"] = true;
            } else if (horaInicial >= 5 && horaFinal >= 15) {
                turma["HORARIO_INTEGRAL"] = true;
            } else {
                turma["HORARIO_MATUTINO"] = true;
            }
        }
    }

    return turma;
}

function parseRegistro30(registro) {
    // Valores padrão
    var dadoPessoa = {
        DEF_CAMINHAR: false,
        DEF_OUVIR: false,
        DEF_ENXERGAR: false,
        DEF_MENTAL: false
    }

    if (registro.data[4] != null && registro.data[4] != "") {
        dadoPessoa["CPF"] = registro.data[4];
    }

    dadoPessoa["NOME"] = registro.data[5];
    dadoPessoa["DATA_NASCIMENTO"] = registro.data[6];

    // Possui informações dos responsáveis?
    if (Number(registro.data[7]) == 1) {
        if (registro.data[8] != null && registro.data[8] != "") {
            dadoPessoa["NOME_RESPONSAVEL"] = registro.data[8];
        } else {
            dadoPessoa["NOME_RESPONSAVEL"] = registro.data[9];
        }
    }

    dadoPessoa["SEXO"] = Number(registro.data[10]);
    dadoPessoa["COR"] = Number(registro.data[11]);

    // Possui deficiência?
    if (Number(registro.data[15]) == 1) {
        if (Number(registro.data[16]) == 1) dadoPessoa["DEF_CAMINHAR"] = true;
        if (Number(registro.data[17]) == 1) dadoPessoa["DEF_ENXERGAR"] = true;
        if (Number(registro.data[18]) == 1) dadoPessoa["DEF_OUVIR"] = true;
        if (Number(registro.data[19]) == 1) dadoPessoa["DEF_OUVIR"] = true;
        if (Number(registro.data[20]) == 1) {
            dadoPessoa["DEF_ENXERGAR"] = true;
            dadoPessoa["DEF_OUVIR"] = true;
        }
        if (Number(registro.data[21]) == 1) dadoPessoa["DEF_CAMINHAR"] = true;
        if (Number(registro.data[22]) == 1) dadoPessoa["DEF_MENTAL"] = true;
        if (Number(registro.data[24]) == 1) dadoPessoa["DEF_MENTAL"] = true;
    }

    // Localização
    if (registro.data[41] != null && registro.data[41] != "") {
        dadoPessoa["LOC_CEP"] = registro.data[41];
    }

    if (registro.data[43] != null && registro.data[43] != "") {
        dadoPessoa["MEC_TP_LOCALIZACAO"] = Number(registro.data[43]);
    }

    // Contato Email
    if (registro.data[80] != null && registro.data[80] != "") {
        dadoPessoa["EMAIL"] = registro.data[80];
    }

    return dadoPessoa;
}

function processRegistro00(registro) {
    var escola = parseRegistro00(registro);
    var codEscola = Number(registro.data[1]);

    // Verifica se o cod da escola já está na base de dados
    if (!(codEscola in baseDados)) {
        baseDados[codEscola] = escola;
    } else {
        Object.assign(baseDados[codEscola], baseDados[codEscola], escola)
    }
}

function processRegistro20(registro) {
    var turma = parseRegistro20(registro);
    var codEscola = Number(registro.data[1]);
    var codTurma = registro.data[2];

    // TODO: colocar isso em um laço    
    baseDados[codEscola]["MEC_IN_REGULAR"] = baseDados[codEscola]["MEC_IN_REGULAR"] || turma["MEC_IN_REGULAR"];
    baseDados[codEscola]["MEC_IN_EJA"] = baseDados[codEscola]["MEC_IN_EJA"] || turma["MEC_IN_EJA"];
    baseDados[codEscola]["MEC_IN_PROFISSIONALIZANTE"] = baseDados[codEscola]["MEC_IN_PROFISSIONALIZANTE"] || turma["MEC_IN_PROFISSIONALIZANTE"];
    baseDados[codEscola]["MEC_IN_ESPECIAL_EXCLUSIVA"] = baseDados[codEscola]["MEC_IN_ESPECIAL_EXCLUSIVA"] || turma["MEC_IN_ESPECIAL_EXCLUSIVA"];

    baseDados[codEscola]["HORARIO_MATUTINO"] = baseDados[codEscola]["HORARIO_MATUTINO"] || turma["HORARIO_MATUTINO"];
    baseDados[codEscola]["HORARIO_VESPERTINO"] = baseDados[codEscola]["HORARIO_VESPERTINO"] || turma["HORARIO_VESPERTINO"];
    baseDados[codEscola]["HORARIO_NOTURNO"] = baseDados[codEscola]["HORARIO_NOTURNO"] || turma["HORARIO_NOTURNO"];

    baseDados[codEscola]["ENSINO_PRE_ESCOLA"] = baseDados[codEscola]["ENSINO_PRE_ESCOLA"] || turma["ENSINO_PRE_ESCOLA"];
    baseDados[codEscola]["ENSINO_FUNDAMENTAL"] = baseDados[codEscola]["ENSINO_FUNDAMENTAL"] || turma["ENSINO_FUNDAMENTAL"];
    baseDados[codEscola]["ENSINO_MEDIO"] = baseDados[codEscola]["ENSINO_MEDIO"] || turma["ENSINO_MEDIO"];

    baseDados[codEscola]["TURMAS"][codTurma] = turma;
}

function processRegistro30(registro) {
    var pessoa = parseRegistro30(registro);
    var codEscola = Number(registro.data[1]);
    var codPessoa = registro.data[2];

    if (codPessoa == "") {
        codPessoa = registro.data[3];
    }
    
    baseDados[codEscola]["PESSOAS"][codPessoa] = pessoa;
}

function processRegistro40(registro) {
    var codEscola = Number(registro.data[1]);
    var codGestor = registro.data[2];

    if (codGestor == "") {
        codGestor = registro.data[3];
    }

    if (codGestor in baseDados[codEscola]["PESSOAS"]) {
        gestor = baseDados[codEscola]["PESSOAS"][codGestor];
        gestorNome = gestor["NOME"];
        gestorEmail = gestor["EMAIL"];

        baseDados[codEscola]["CONTATO_RESPONSAVEL"] = gestorNome;
        baseDados[codEscola]["CONTATO_EMAIL"] = gestorEmail;
    }
}

function processRegistro60(registro) {
    // Vamos verificar se o aluno (registro tipo 60) utiliza transporte escolar
    // Isto se encontra no registro 20
    if (registro.data[20] != null && registro.data[20] != "") {
        if (Number(registro.data[20]) == 1) {
            // aluno utiliza transporte escolar
            // adicionar ao campo de aluno da escola
            var codEscola = registro.data[1];
            var codAluno = registro.data[2];

            if (codAluno == "") {
                codAluno = registro.data[3];
            }

            var codTurma = registro.data[4];

            if (codAluno in baseDados[codEscola]["PESSOAS"]) {
                var aluno = baseDados[codEscola]["PESSOAS"][codAluno];
                var turma = baseDados[codEscola]["TURMAS"][codTurma];

                if (turma["ENSINO_PRE_ESCOLA"]) {
                    aluno["NIVEL"] = 1;
                } else if (turma["ENSINO_FUNDAMENTAL"]) {
                    aluno["NIVEL"] = 2;
                } else if (turma["ENSINO_MEDIO"]) {
                    aluno["NIVEL"] = 3;
                } else {
                    aluno["NIVEL"] = 5;
                }

                if (turma["HORARIO_MATUTINO"]) {
                    aluno["TURNO"] = 1;
                } else if (turma["HORARIO_VESPERTINO"]) {
                    aluno["TURNO"] = 2;
                } else if (turma["HORARIO_INTEGRAL"]) {
                    aluno["TURNO"] = 3;
                } else {
                    aluno["TURNO"] = 4; // Noite
                }

                baseDados[codEscola]["ALUNOS"][codAluno] = aluno
                delete baseDados[codEscola]["PESSOAS"][codAluno]
            }
        }
    }
}

function parseBaseCenso(arq, cb) {
    baseDados = {};
    Papa.parse(arq, {
        delimiter: "|",
        encoding: "ISO-8859-1",
        worker: true,
        step: (registro) => {
            let tipoDeRegistroAtual = registro.data[0];

            switch (tipoDeRegistroAtual) {
                case "00":
                    processRegistro00(registro)
                    break;
                case "20":
                    processRegistro20(registro)
                    break;
                case "30":
                    processRegistro30(registro)
                    break;
                case "40":
                    processRegistro40(registro);
                    break;
                case "60":
                    processRegistro60(registro)
                    break;
                default:
                    break;
            }
        },
        error: (err) => {
            cb(err)
        },
        complete: () => {
            Object.keys(baseDados).forEach((escolaID) => {
                delete baseDados[escolaID]["PESSOAS"];
                delete baseDados[escolaID]["TURMAS"];
                delete baseDados[escolaID]["DISTRITO"];
                delete baseDados[escolaID]["SITUACAO"];
                baseDados[escolaID]["MEC_CO_UF"] = Number(String(baseDados[escolaID]["MEC_CO_MUNICIPIO"]).substr(0,2))
            })
            cb(false, arq, baseDados)
        }
    });
}