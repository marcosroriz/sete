// custo-resultado-aqua-ctrl.js
// Este arquivo contém o script de controle da tela custo-resultado-aqua-view. 
// A ferramenta ilustra o resultado da operação de cálculo de custo ]
// de uma rota aquaviária do sistema

var idRota = "";
if (action == "calcularRotaAquaviária") {
    idRota = estadoRota["ID"];
}

// Flag que indica se o custo é válido ou não
var rotaValida = true;

// Parâmetros do custo
var rotaParams = {};

// Detalhes da rota
var rotaDados = {};

// Parâmetros detalhados do cálculos
var det = {};

// Wizard
$('.card-wizard').bootstrapWizard(configWizardBasico("", usarValidador = false))

restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}`)
    .then((rota) => preencheDadosBasicos(rota))
    .then((rota) => pegarParametros(rota))
    .then(() => calcularCustoFixo())
    .then((custoFixoValido) => calcularCustoVariavel(custoFixoValido))
    .then((custoFinalValido) => calcularCustoFinal(custoFinalValido))
    .then(() => MathJax.typeset())
    .then(() => mostraInformacoesCusto())
    .then(() => dataTableDadosRota.draw())
    .then(() => Swal2.close())
    .catch(() => Swal2.close())

var dataTableDadosRota = $("#dataTableDadosRota").DataTable({
    columns: [
        { width: "20%", className: "text-right detalheChave" },
        { width: "60%", className: "text-left detalheValor" },
    ],
    autoWidth: false,
    paging: false,
    searching: false,
    ordering: false,
    dom: 't<"detalheToolBar">'
});

function preencheDadosBasicos(rota) {
    let rotaJSON = parseRotaDBREST(rota);

    loadingFn("Calculando o custo da rota..." + rotaJSON.nome);

    $("#nomeRota").text(rotaJSON.nome);
    dataTableDadosRota.row.add(["Nome da Rota", rotaJSON.nome]);

    if (rotaJSON.tempo) { dataTableDadosRota.row.add(["Tempo da Rota", rotaJSON.tempo + " minutos"]); }
    if (rotaJSON.TURNOSTR) { dataTableDadosRota.row.add(["Turno de operação", rotaJSON.TURNOSTR]); }

    return rotaJSON;
}

async function pegarParametros(rota) {
    // Pegar parâmetros motorista
    let [motoristaValido, paramMotoristas, motoristas] = await pegarParametrosMotoristas();

    // Pegar parâmetros monitor
    let [monitorValido, paramMonitor, monitores] = await pegarParametrosMonitores();

    // Pegar parâmetros do veículo
    let [veiculoValido, paramVeiculos, veiculos] = await pegarParametrosVeiculos();

    // Pegar parâmetros gerais
    let [paramValido, paramGerais] = await pegarParametrosGerais();

    // Pega parâmetros restantes
    let [restanteValido, paramRestantes, alunos] = await pegarParametrosAlunos(rota);

    rotaValida = motoristaValido && monitorValido && veiculoValido && paramValido && restanteValido;
    rotaParams = { ...paramMotoristas, ...paramMonitor, ...paramVeiculos, ...paramGerais, ...paramRestantes };
    Object.assign(det, rotaParams)

    if (restanteValido) { dataTableDadosRota.row.add(["Número de Alunos", rotaParams.NUM_ALUNOS.valor]); }
    if (veiculoValido) { dataTableDadosRota.row.add(["Número de Veículos", rotaParams.NUM_VEICULOS.valor]); }
    if (motoristaValido) { dataTableDadosRota.row.add(["Número de Motoristas", rotaParams.NUM_MOTORISTAS.valor]); }
    if (monitorValido) { dataTableDadosRota.row.add(["Número de Monitores", rotaParams.NUM_MONITORES.valor]); }

    rotaDados = {
        rota,
        motoristas,
        monitores,
        veiculos,
        alunos
    }

    return rota;
}

function guardaParametroDetalhado(nomeParametro, valorParametro) {
    det[nomeParametro] = {
        "codigo_parametro": nomeParametro,
        "result": true,
        "valor": valorParametro
    }
}

function calcularCustoFixo() {
    let custoDepreciacaoValido = calcularCustoDepreciacao();
    let custoRemuneracaoValido = calcularCustoRemuneracao();
    let custoSeguroValido = calcularCustoSeguro();
    let custoComPessoalValido = calcularCustoComPessoal();
    let custoManutencaoValido = calcularCustoManutencao();

    let custoFixoValido = (custoDepreciacaoValido && custoRemuneracaoValido &&
        custoComPessoalValido && custoSeguroValido && custoManutencaoValido)

    // Calcula custo fixo
    let CUSTO_FIXO = 0;
    if (custoFixoValido) {
        CUSTO_FIXO = det.CUSTO_DEPRECIACAO_FROTA.valor + det.CUSTO_REMUNERACAO_FROTA.valor + 
                     det.CUSTO_SEGURO.valor +  det.CUSTO_COM_PESSOAL.valor + det.CUSTO_MANUTENCAO_EMBARCACAO.valor;

        guardaParametroDetalhado("CUSTO_FIXO", CUSTO_FIXO);
    }

    detalharCustoFixo(custoDepreciacaoValido, custoRemuneracaoValido, 
        custoSeguroValido, custoComPessoalValido, custoManutencaoValido);

    if (DEBUG) { console.debug("CUSTO_FIXO", CUSTO_FIXO) }

    return custoFixoValido;
}

function calcularCustoVariavel(custoFixoValido) {
    let custoComCombustivelValido = calcularCustoComCombustivel();
    let custoComOleoLubrificantesValido = calcularCustoComOleoLubrificantes();
    let custoVariavelValido = (custoComCombustivelValido && custoComOleoLubrificantesValido);

    // Calcula custo variável
    let CUSTO_VARIAVEL = 0;
    if (custoVariavelValido) {
        CUSTO_VARIAVEL = det.CUSTO_COM_COMBUSTIVEL.valor + det.CUSTO_OLEO_LUBRIFICANTES.valor;

        guardaParametroDetalhado("CUSTO_VARIAVEL", CUSTO_VARIAVEL);
    }

    detalharCustoVariavel(custoComCombustivelValido, custoComOleoLubrificantesValido);
    if (DEBUG) { console.debug("CUSTO_VARIAVEL", CUSTO_VARIAVEL) }

    // Retorna se custo final é válido, fazendo a junção lógica com o custofixo
    return (custoFixoValido && custoVariavelValido);
}

function calcularCustoFinal(custoFinalValido) {
    let CUSTO_FINAL = 0;
    let CUSTO_HORA = 0;
    let CUSTO_ALUNO = 0;

    if (custoFinalValido) {
        CUSTO_FINAL = (12 * det.CUSTO_FIXO.valor) + (10 * det.CUSTO_VARIAVEL.valor);
        CUSTO_HORA = CUSTO_FINAL / (det.TEMPO_HORA_MENSAL_ROTA.valor);

        guardaParametroDetalhado("CUSTO_FINAL", CUSTO_FINAL);
        guardaParametroDetalhado("CUSTO_FINAL_POR_MES", CUSTO_FINAL / 12);
        guardaParametroDetalhado("CUSTO_FINAL_POR_DIA", CUSTO_FINAL / 365);

        guardaParametroDetalhado("CUSTO_HORA", CUSTO_HORA);
        guardaParametroDetalhado("CUSTO_HORA_POR_MES", CUSTO_HORA / 12);
        guardaParametroDetalhado("CUSTO_HORA_POR_DIA", CUSTO_HORA / 365);

        if (det.NUM_ALUNOS.valor > 0) {
            CUSTO_ALUNO = CUSTO_FINAL / (det.NUM_ALUNOS.valor);

            guardaParametroDetalhado("CUSTO_ALUNO", CUSTO_ALUNO);
            guardaParametroDetalhado("CUSTO_ALUNO_POR_MES", CUSTO_ALUNO / 12);
            guardaParametroDetalhado("CUSTO_ALUNO_POR_DIA", CUSTO_ALUNO / 365);
        }
    }

    detalharCustoFinal(custoFinalValido);

    if (DEBUG) { 
        console.debug("CUSTO_FINAL", CUSTO_FINAL);
        console.debug("CUSTO_HORA", CUSTO_HORA);
        console.debug("CUSTO_ALUNO", CUSTO_ALUNO);
    }

    rotaValida = custoFinalValido;
    return custoFinalValido;
}

function formataMoeda(nomeParametro, casasDecimais = 2) {
    let num = Number(det[nomeParametro].valor).toFixed(2);
    return Intl.NumberFormat("pt-BR").format(num)
}

function formataModelaComCifrao(nomeParametro) {
    console.log(nomeParametro, det[nomeParametro]?.valor);

    let num = Number(det[nomeParametro].valor).toFixed(2);
    return Intl.NumberFormat("pt-BR", { style: 'currency', currency: 'BRL' }).format(num);
}

function formataOutputParametro(nomeParametro, casasDecimais = 2) {
    if (!(nomeParametro in det)) {
        return "\\textrm{ERRO}";
    }

    if (det[nomeParametro].result) {
        if (!isNaN(det[nomeParametro].result)) {
            // return Math.round(det[nomeParametro].valor * Math.pow(10, casasDecimais)) / Math.pow(10, casasDecimais);
            return det[nomeParametro].valor.toFixed(casasDecimais);
        } else {
            return det[nomeParametro].valor;
        }
    } else {
        return "\\textrm{NÃO INFORMADO}"
    }
}

function detalharCustoFixo(custoDepreciacaoValido, custoRemuneracaoValido, 
    custoSeguroValido, custoComPessoalValido, custoManutencaoValido) {
    // Indica erro se custo está inválido
    if (!custoDepreciacaoValido) { $("#CustoDepreciacaoCard").addClass("erroCusto"); }
    if (!custoRemuneracaoValido) { $("#CustoRemuneracaoCapitalCard").addClass("erroCusto"); }
    if (!custoSeguroValido)      { $("#CustoSeguroCard").addClass("erroCusto"); }
    if (!custoComPessoalValido)  { $("#CustoPessoalCard").addClass("erroCusto"); }
    if (!custoManutencaoValido)  { $("#CustoManutencaoReparoCard").addClass("erroCusto"); }

    // Depreciação
    $(".VIDA_UTIL_AQUA").replaceWith(formataOutputParametro("VIDA_UTIL_AQUA", 0));
    $(".VALOR_RESIDUAL").replaceWith(formataOutputParametro("VALOR_RESIDUAL"));
    $(".PRECO_MEDIO_VEICULOS").replaceWith(formataOutputParametro("PRECO_MEDIO_VEICULOS"));
    $(".COEFICIENTE_DEPRECIACAO_VEICULO").replaceWith(formataOutputParametro("COEFICIENTE_DEPRECIACAO_VEICULO", 8));
    $(".CUSTO_DEPRECIACAO_FROTA").replaceWith(formataOutputParametro("CUSTO_DEPRECIACAO_FROTA"));

    // Remuneração do capital
    $(".VALOR_TRC").replaceWith(formataOutputParametro("VALOR_TRC", 4));
    $(".VIDA_UTIL_AQUA").replaceWith(formataOutputParametro("VIDA_UTIL_AQUA", 0));
    $(".FATOR_REMUNERACAO_FROTA_NUMERADOR").replaceWith(formataOutputParametro("FATOR_REMUNERACAO_FROTA_NUMERADOR", 6));
    $(".FATOR_REMUNERACAO_FROTA_DENOMINADOR").replaceWith(formataOutputParametro("FATOR_REMUNERACAO_FROTA_DENOMINADOR", 6));
    $(".FATOR_REMUNERACAO_FROTA").replaceWith(formataOutputParametro("FATOR_REMUNERACAO_FROTA", 6));
    $(".CUSTO_REMUNERACAO_FROTA").replaceWith(formataOutputParametro("CUSTO_REMUNERACAO_FROTA"));

    // Seguro
    $(".VALOR_SEGURO").replaceWith(formataOutputParametro("VALOR_SEGURO", 4));
    $(".CUSTO_SEGURO").replaceWith(formataOutputParametro("CUSTO_SEGURO"));

    // Custo com tripulação (pessoal)
    $(".COEFICIENTE_UTILIZACAO_MOTORISTA").replaceWith(formataOutputParametro("COEFICIENTE_UTILIZACAO_MOTORISTA"));
    $(".SALARIO_MEDIO_MOTORISTA").replaceWith(formataOutputParametro("SALARIO_MEDIO_MOTORISTA"));
    $(".ENCARGOS_SOCIAIS").replaceWith(formataOutputParametro("ENCARGOS_SOCIAIS"));
    $(".CUSTO_COM_MOTORISTA").replaceWith(formataOutputParametro("CUSTO_COM_MOTORISTA"));

    $(".COEFICIENTE_UTILIZACAO_MONITOR").replaceWith(formataOutputParametro("COEFICIENTE_UTILIZACAO_MONITOR"));
    $(".SALARIO_MEDIO_MONITORES").replaceWith(formataOutputParametro("SALARIO_MEDIO_MONITORES"));
    $(".CUSTO_COM_MONITOR").replaceWith(formataOutputParametro("CUSTO_COM_MONITOR"));

    $(".CFT_CUSTO_MANUTENCAO_AQUA").replaceWith(formataOutputParametro("CFT_CUSTO_MANUTENCAO_AQUA"));
    $(".CUSTO_COM_MANUTENCAO").replaceWith(formataOutputParametro("CUSTO_COM_MANUTENCAO"));

    $(".CUSTO_COM_PESSOAL").replaceWith(formataOutputParametro("CUSTO_COM_PESSOAL"));

    // Custo com manutenção
    $(".VALOR_MANUTENCAO_EMBARCACAO").replaceWith(formataOutputParametro("VALOR_MANUTENCAO_EMBARCACAO", 4));
    $(".CUSTO_MANUTENCAO_EMBARCACAO").replaceWith(formataOutputParametro("CUSTO_MANUTENCAO_EMBARCACAO"));

    // Valor final do custo fixo
    $(".CUSTO_FIXO").replaceWith(formataOutputParametro("CUSTO_FIXO"));
}

function detalharCustoVariavel(custoCombustivelValido, custoOleoLubrificanteValido) {
    if (!custoCombustivelValido) { $("#CustoCombustivelCard").addClass("erroCusto"); }
    if (!custoOleoLubrificanteValido) { $("#CustoOleoLubrificantesCard").addClass("erroCusto"); }
    
    // Custo com combustível
    $(".POTENCIA_DO_MOTOR").replaceWith(formataOutputParametro("POTENCIA_DO_MOTOR", 0));
    $(".VALOR_CONSUMO_COMBUSTIVEL").replaceWith(formataOutputParametro("VALOR_CONSUMO_COMBUSTIVEL", 4));
    $(".CFT_CONSUMO_COMBUSTIVEL").replaceWith(formataOutputParametro("CFT_CONSUMO_COMBUSTIVEL", 4));
    $(".DENSIDADE_COMBUSTIVEL").replaceWith(formataOutputParametro("DENSIDADE_COMBUSTIVEL", 4));
    $(".PRECO_MEDIO_COMBUSTIVEIS").replaceWith(formataOutputParametro("PRECO_MEDIO_COMBUSTIVEIS"));
    $(".TEMPO_HORA_ROTA").replaceWith(formataOutputParametro("TEMPO_HORA_ROTA", 4));
    $(".CUSTO_COM_COMBUSTIVEL").replaceWith(formataOutputParametro("CUSTO_COM_COMBUSTIVEL", 2));

    // Custo com lubrificantes
    $(".CONSUMO_LUBRIFICANTE").replaceWith(formataOutputParametro("CONSUMO_LUBRIFICANTE", 4));
    $(".DENSIDADE_LUBRIFICANTE").replaceWith(formataOutputParametro("DENSIDADE_LUBRIFICANTE", 4));
    $(".PRECO_MEDIO_LUBRIFICANTE").replaceWith(formataOutputParametro("PRECO_MEDIO_LUBRIFICANTE"));
    $(".CUSTO_OLEO_LUBRIFICANTES").replaceWith(formataOutputParametro("CUSTO_OLEO_LUBRIFICANTES"));


    $(".CUSTO_VARIAVEL").replaceWith(formataOutputParametro("CUSTO_VARIAVEL"));
}

function detalharCustoFinal(custoFinalValido) {
    $(".CUSTO_FINAL").replaceWith(formataOutputParametro("CUSTO_FINAL"));
}

function mostraInformacoesCusto() {
    if (rotaValida) {
        $("#precoCustoGrandePorAno").text(formataModelaComCifrao("CUSTO_FINAL"));
        $("#precoCustoGrandePorMes").text(formataModelaComCifrao("CUSTO_FINAL_POR_MES"));
        $("#precoCustoGrandePorDia").text(formataModelaComCifrao("CUSTO_FINAL_POR_DIA"));

        $("#custoPorHoraPorAno").text(formataModelaComCifrao("CUSTO_HORA"));
        $("#custoPorHoraPorMes").text(formataModelaComCifrao("CUSTO_HORA_POR_MES"));
        $("#custoPorHoraPorDia").text(formataModelaComCifrao("CUSTO_HORA_POR_DIA"));

        if (det["CUSTO_ALUNO"] && det["CUSTO_ALUNO"].result) {
            $("#custoPorAlunoPorAno").text(formataModelaComCifrao("CUSTO_ALUNO"));
            $("#custoPorAlunoPorMes").text(formataModelaComCifrao("CUSTO_ALUNO_POR_MES"));
            $("#custoPorAlunoPorDia").text(formataModelaComCifrao("CUSTO_ALUNO_POR_DIA"));
        }

        // Grafico custo fixo
        let CUSTO_ANUAL_COM_MOTORISTA   = Number(Number(12 * det.CUSTO_COM_MOTORISTA.valor).toFixed(2));
        let CUSTO_ANUAL_COM_MONITOR     = Number(12 * det.CUSTO_COM_MONITOR.valor);
        let CUSTO_ANUAL_COM_MANUTENCAO  = Number(Number(12 * det.CUSTO_COM_MANUTENCAO.valor).toFixed(2));
        let CUSTO_ANUAL_COM_SEGURO      = Number(Number(12 * det.CUSTO_SEGURO.valor).toFixed(2));
        let CUSTO_ANUAL_COM_DEPRECIACAO = Number(Number(12 * det.CUSTO_DEPRECIACAO_FROTA.valor).toFixed(2));
        let CUSTO_ANUAL_COM_REMUNERACAO = Number(Number(12 * det.CUSTO_REMUNERACAO_FROTA.valor).toFixed(2));
        let CUSTO_ANUAL_COM_REPARO      = Number(Number(12 * det.CUSTO_MANUTENCAO_EMBARCACAO.valor).toFixed(2));

        let CUSTO_VARIAVEL_ANUAL_COM_COMBUSTIVEL = Number(Number(10 * det.CUSTO_COM_COMBUSTIVEL.valor).toFixed(2));
        let CUSTO_VARIAVEL_ANUAL_COM_OLEOLUBRIFICANTES = Number(Number(10 * det.CUSTO_OLEO_LUBRIFICANTES.valor).toFixed(2));

        var options = {
            series: [
                CUSTO_ANUAL_COM_MOTORISTA, 
                CUSTO_ANUAL_COM_MONITOR,
                CUSTO_ANUAL_COM_MANUTENCAO, 
                CUSTO_ANUAL_COM_SEGURO, 
                CUSTO_ANUAL_COM_DEPRECIACAO, 
                CUSTO_ANUAL_COM_REMUNERACAO,
                CUSTO_ANUAL_COM_REPARO, 
                CUSTO_VARIAVEL_ANUAL_COM_COMBUSTIVEL, 
                CUSTO_VARIAVEL_ANUAL_COM_OLEOLUBRIFICANTES
            ],
            chart: {
                type: 'pie',
            },
            labels: [
                'Motoristas', 
                'Monitores', 
                'Pessoal de Manutenção', 
                'Seguro',
                'Depreciação',
                'Remuneração do Capital',
                'Reparo da Embarcação', 
                'Combustível',
                'Lubrificantes'],
            tooltip: {
                y: {
                    formatter: function (value) {
                        return Intl.NumberFormat("pt-BR", { style: 'currency', currency: 'BRL' }).format(value)
                    }
                }
            }
        };

        var chart = new ApexCharts(document.querySelector("#graficoCusto"), options);
        chart.render();
        Swal2.fire({
            title: "Custo calculado com sucesso",
            icon: "success",
            button: "Fechar",
        });

        $(".custoCorreto").removeClass('d-none');
    } else {
        $(".custoErro").removeClass('d-none');
        errorFn("Erro ao calcular o custo da rota. Alguns parâmetros não foram informados. Veja quais na aba detalhar cálculo.")
    }
}

function calcularCustoComPessoal() {
    let custoValido = true;

    let CUSTO_COM_PESSOAL = 0; // CUSTO MOTORISTA + CUSTO MONITOR + CUSTO MANUTENÇÃO
    let CUSTO_COM_MOTORISTA = 0;
    let CUSTO_COM_MONITOR = 0;
    let CUSTO_COM_MANUTENCAO = 0;

    // Primeiro calcularemos o custo com motorista
    // Custo Com Motorista = Coef Utilização * Salário Médio * Encargos Sociais
    let COEFICIENTE_UTILIZACAO_MOTORISTA = 0;
    let SALARIO_MEDIO_MOTORISTA = 0;
    let ENCARGOS_SOCIAIS = 0;

    // Coeficiente de utilização do motorista (|motoristas| / |veiculos|)
    if (rotaParams.NUM_MOTORISTAS.result && rotaParams.NUM_VEICULOS.result) {
        COEFICIENTE_UTILIZACAO_MOTORISTA = Number(rotaParams.NUM_MOTORISTAS.valor / rotaParams.NUM_VEICULOS.valor);
        guardaParametroDetalhado("COEFICIENTE_UTILIZACAO_MOTORISTA", COEFICIENTE_UTILIZACAO_MOTORISTA)
    }

    // Salário médio do motorista
    if (rotaParams.SALARIO_MEDIO_MOTORISTA.result) {
        SALARIO_MEDIO_MOTORISTA = Number(rotaParams.SALARIO_MEDIO_MOTORISTA.valor);
    }

    // Encargos sociais
    if (rotaParams.PERC_ENCARGO_SOCIAIS.result) {
        ENCARGOS_SOCIAIS = Number(1 + (rotaParams.PERC_ENCARGO_SOCIAIS.valor / 100));
        guardaParametroDetalhado("ENCARGOS_SOCIAIS", ENCARGOS_SOCIAIS)
    }

    if (COEFICIENTE_UTILIZACAO_MOTORISTA > 0 && SALARIO_MEDIO_MOTORISTA > 0 && ENCARGOS_SOCIAIS > 0) {
        CUSTO_COM_MOTORISTA = Number(COEFICIENTE_UTILIZACAO_MOTORISTA * SALARIO_MEDIO_MOTORISTA * ENCARGOS_SOCIAIS);
        guardaParametroDetalhado("CUSTO_COM_MOTORISTA", CUSTO_COM_MOTORISTA)
    }

    // Agora calcularemos o custo com monitores (idêntico ao do motorista)
    // Custo Com Monitores = Coef Utilização * Salário Médio * Encargos Sociais
    let COEFICIENTE_UTILIZACAO_MONITOR = 0;
    let SALARIO_MEDIO_MONITORES = 0;

    // Coeficiente de utilização do motorista (|monitores| / |veiculos|)
    if (rotaParams.NUM_MONITORES.result && rotaParams.NUM_MONITORES.valor > 0) {
        COEFICIENTE_UTILIZACAO_MONITOR = Number(rotaParams.NUM_MONITORES.valor / rotaParams.NUM_VEICULOS.valor);
        guardaParametroDetalhado("COEFICIENTE_UTILIZACAO_MONITOR", COEFICIENTE_UTILIZACAO_MONITOR)
    } else if (rotaParams.NUM_MONITORES.result && rotaParams.NUM_MONITORES.valor == 0) {
        guardaParametroDetalhado("COEFICIENTE_UTILIZACAO_MONITOR", 0)
    }

    // Salário médio dos monitores
    if (rotaParams.SALARIO_MEDIO_MONITORES.result) {
        SALARIO_MEDIO_MONITORES = Number(rotaParams.SALARIO_MEDIO_MONITORES.valor);
    }

    if (rotaParams.NUM_MONITORES.valor > 0 && COEFICIENTE_UTILIZACAO_MONITOR > 0 && SALARIO_MEDIO_MONITORES > 0 && ENCARGOS_SOCIAIS > 0) {
        CUSTO_COM_MONITOR = Number(COEFICIENTE_UTILIZACAO_MONITOR * SALARIO_MEDIO_MONITORES * ENCARGOS_SOCIAIS);
        guardaParametroDetalhado("CUSTO_COM_MONITOR", CUSTO_COM_MONITOR)
    } else {
        guardaParametroDetalhado("CUSTO_COM_MONITOR", 0)
    }

    // Custo com pessoal de manutenção (depende do custo com motorista)
    let CFT_CUSTO_MANUTENCAO_AQUA = 0;
    if (CUSTO_COM_MOTORISTA > 0 && rotaParams.PERC_CFT_CUSTO_MANUTENCAO_AQUA.result) {
        CFT_CUSTO_MANUTENCAO_AQUA = Number(rotaParams.PERC_CFT_CUSTO_MANUTENCAO_AQUA.valor / 100);
        CUSTO_COM_MANUTENCAO = Number(CUSTO_COM_MOTORISTA * CFT_CUSTO_MANUTENCAO_AQUA);

        guardaParametroDetalhado("CFT_CUSTO_MANUTENCAO_AQUA", CFT_CUSTO_MANUTENCAO_AQUA)
        guardaParametroDetalhado("CUSTO_COM_MANUTENCAO", CUSTO_COM_MANUTENCAO)
    }

    // Valor final
    if ((CUSTO_COM_MOTORISTA > 0 && CUSTO_COM_MANUTENCAO > 0 && CUSTO_COM_MONITOR == 0 && rotaParams.NUM_MONITORES.valor == 0) ||
        (CUSTO_COM_MOTORISTA > 0 && CUSTO_COM_MANUTENCAO > 0 && CUSTO_COM_MONITOR > 0)) {
        CUSTO_COM_PESSOAL = Number(CUSTO_COM_MOTORISTA + CUSTO_COM_MANUTENCAO + CUSTO_COM_MONITOR);

        guardaParametroDetalhado("CUSTO_COM_PESSOAL", CUSTO_COM_PESSOAL)
    } else {
        custoValido = false
    }
    
    if (DEBUG) {
        console.debug("COEFICIENTE_UTILIZACAO_MOTORISTA", COEFICIENTE_UTILIZACAO_MOTORISTA);
        console.debug("SALARIO_MEDIO_MOTORISTA", SALARIO_MEDIO_MONITORES);
        console.debug("ENCARGOS_SOCIAIS", ENCARGOS_SOCIAIS);
        console.debug("CUSTO_COM_MOTORISTA", CUSTO_COM_MOTORISTA);
        console.debug("COEFICIENTE_UTILIZACAO_MONITOR", COEFICIENTE_UTILIZACAO_MONITOR);
        console.debug("SALARIO_MEDIO_MONITORES", SALARIO_MEDIO_MONITORES);
        console.debug("CUSTO_COM_MONITOR", CUSTO_COM_MONITOR);
        console.debug("CFT_CUSTO_MANUTENCAO_AQUA", CFT_CUSTO_MANUTENCAO_AQUA);
        console.debug("CUSTO_COM_MANUTENCAO", CUSTO_COM_MANUTENCAO);
        console.debug("CUSTO_COM_PESSOAL", CUSTO_COM_MOTORISTA + CUSTO_COM_MANUTENCAO + CUSTO_COM_MONITOR);
    }

    return custoValido;
}

function calcularCustoSeguro() {
    let custoValido = true;

    let CUSTO_SEGURO = 0; 
    let VALOR_SEGURO = 0;
    if (rotaParams.PRECO_MEDIO_VEICULOS.result && rotaParams.PERC_SEGURO_AQUA.result) {
        VALOR_SEGURO = Number(rotaParams.PERC_SEGURO_AQUA.valor) / 100;
        CUSTO_SEGURO = rotaParams.PRECO_MEDIO_VEICULOS.valor * VALOR_SEGURO;

        guardaParametroDetalhado("VALOR_SEGURO", VALOR_SEGURO);
        guardaParametroDetalhado("CUSTO_SEGURO", CUSTO_SEGURO);
    } else {
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoManutencao() {
    let custoValido = true;

    let CUSTO_MANUTENCAO_EMBARCACAO = 0; 
    let VALOR_MANUTENCAO_EMBARCACAO = 0;
    if (rotaParams.PRECO_MEDIO_VEICULOS.result && rotaParams.PERC_MANUTENCAO_EMBARCACAO.result) {
        VALOR_MANUTENCAO_EMBARCACAO = Number(rotaParams.PERC_MANUTENCAO_EMBARCACAO.valor) / 100;
        CUSTO_MANUTENCAO_EMBARCACAO = rotaParams.PRECO_MEDIO_VEICULOS.valor * VALOR_MANUTENCAO_EMBARCACAO;

        guardaParametroDetalhado("VALOR_MANUTENCAO_EMBARCACAO", VALOR_MANUTENCAO_EMBARCACAO);
        guardaParametroDetalhado("CUSTO_MANUTENCAO_EMBARCACAO", CUSTO_MANUTENCAO_EMBARCACAO);
    } else {
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoDepreciacao() {
    let custoValido = true;

    let CUSTO_DEPRECIACAO_FROTA = 0;
    let COEFICIENTE_DEPRECIACAO_VEICULO = 0;

    if (det.PERC_RESIDUAL_AQUA.result) {
        VALOR_RESIDUAL = Number(rotaParams.PERC_RESIDUAL_AQUA.valor / 100);
        guardaParametroDetalhado("VALOR_RESIDUAL", VALOR_RESIDUAL);
    }

    if (rotaParams.VIDA_UTIL_AQUA.result && 
        rotaParams.PERC_RESIDUAL_AQUA.result && 
        rotaParams.PRECO_MEDIO_VEICULOS.result) {
        
        COEFICIENTE_DEPRECIACAO_VEICULO = ((1 - VALOR_RESIDUAL) / (rotaParams.VIDA_UTIL_AQUA.valor * 12));
        CUSTO_DEPRECIACAO_FROTA = rotaParams.PRECO_MEDIO_VEICULOS.valor * COEFICIENTE_DEPRECIACAO_VEICULO;
        
        guardaParametroDetalhado("COEFICIENTE_DEPRECIACAO_VEICULO", COEFICIENTE_DEPRECIACAO_VEICULO);
        guardaParametroDetalhado("CUSTO_DEPRECIACAO_FROTA", CUSTO_DEPRECIACAO_FROTA);
    } else {
        custoValido = false;
    }

    if (DEBUG) { 
        console.debug("VALOR RESIDUAL", VALOR_RESIDUAL);
        console.debug("COEFICIENTE_DEPRECIACAO_VEICULO", COEFICIENTE_DEPRECIACAO_VEICULO);
        console.debug("CUSTO_DEPRECIACAO_FROTA", CUSTO_DEPRECIACAO_FROTA);
    }

    return custoValido;
}

function calcularCustoRemuneracao() {
    let custoValido = true;

    let CUSTO_REMUNERACAO_FROTA = 0; 
    let FATOR_REMUNERACAO_FROTA = 0;
    let FATOR_REMUNERACAO_FROTA_NUMERADOR = 0;
    let FATOR_REMUNERACAO_FROTA_DENOMINADOR = 0;
    let VALOR_TRC = 0;

    if (rotaParams.PERC_TRC.result) {
        VALOR_TRC = Number(rotaParams.PERC_TRC.valor / 100);

        guardaParametroDetalhado("VALOR_TRC", VALOR_TRC);
    }

    if (rotaParams.VIDA_UTIL_AQUA.result && 
        rotaParams.PERC_TRC.result &&
        rotaParams.PRECO_MEDIO_VEICULOS.result) {

        FATOR_REMUNERACAO_FROTA_NUMERADOR = VALOR_TRC * Math.pow((1 + VALOR_TRC), rotaParams.VIDA_UTIL_AQUA.valor);
        FATOR_REMUNERACAO_FROTA_DENOMINADOR = Math.pow((1 + VALOR_TRC), rotaParams.VIDA_UTIL_AQUA.valor) - 1;
        FATOR_REMUNERACAO_FROTA = FATOR_REMUNERACAO_FROTA_NUMERADOR / FATOR_REMUNERACAO_FROTA_DENOMINADOR;
        CUSTO_REMUNERACAO_FROTA = rotaParams.PRECO_MEDIO_VEICULOS.valor * FATOR_REMUNERACAO_FROTA;

        guardaParametroDetalhado("FATOR_REMUNERACAO_FROTA_NUMERADOR", FATOR_REMUNERACAO_FROTA_NUMERADOR);
        guardaParametroDetalhado("FATOR_REMUNERACAO_FROTA_DENOMINADOR", FATOR_REMUNERACAO_FROTA_DENOMINADOR);
        guardaParametroDetalhado("FATOR_REMUNERACAO_FROTA", FATOR_REMUNERACAO_FROTA);
        guardaParametroDetalhado("CUSTO_REMUNERACAO_FROTA", CUSTO_REMUNERACAO_FROTA);
    } else {
        custoValido = false;
    }

    if (DEBUG) {
        console.debug("FATOR_REMUNERACAO_FROTA_NUMERADOR", FATOR_REMUNERACAO_FROTA_NUMERADOR)
        console.debug("FATOR_REMUNERACAO_FROTA_DENOMINADOR", FATOR_REMUNERACAO_FROTA_DENOMINADOR)
        console.debug("FATOR_REMUNERACAO_FROTA", FATOR_REMUNERACAO_FROTA)
        console.debug("CUSTO_REMUNERACAO_FROTA", CUSTO_REMUNERACAO_FROTA)
    }

    return custoValido;
}

function calcularCustoComCombustivel() {
    let custoValido = true;

    let CUSTO_COM_COMBUSTIVEL = 0;
    let VALOR_CONSUMO_COMBUSTIVEL = 0;
    if (rotaParams.POTENCIA_DO_MOTOR.result &&
        rotaParams.CFT_CONSUMO_COMBUSTIVEL.result && 
        rotaParams.DENSIDADE_COMBUSTIVEL.result &&
        rotaParams.TEMPO_HORA_ROTA.result &&
        rotaParams.PRECO_MEDIO_COMBUSTIVEIS.result) {

        VALOR_CONSUMO_COMBUSTIVEL = 1 / rotaParams.CFT_CONSUMO_COMBUSTIVEL.valor;
        CUSTO_COM_COMBUSTIVEL = (
            rotaParams.POTENCIA_DO_MOTOR.valor
            *
            (VALOR_CONSUMO_COMBUSTIVEL / rotaParams.DENSIDADE_COMBUSTIVEL.valor)
            *
            rotaParams.PRECO_MEDIO_COMBUSTIVEIS.valor
            *
            rotaParams.TEMPO_HORA_ROTA.valor
            * 
            20
        )

        guardaParametroDetalhado("VALOR_CONSUMO_COMBUSTIVEL", VALOR_CONSUMO_COMBUSTIVEL);
        guardaParametroDetalhado("CUSTO_COM_COMBUSTIVEL", CUSTO_COM_COMBUSTIVEL);
    } else {
        custoValido = false;
    }

    if (DEBUG) { console.debug("CUSTO_COM_COMBUSTIVEL", CUSTO_COM_COMBUSTIVEL) }
    return custoValido;
}

function calcularCustoComOleoLubrificantes() {
    let custoValido = true;

    let CUSTO_OLEO_LUBRIFICANTES = 0;

    if (rotaParams.POTENCIA_DO_MOTOR.result &&
        rotaParams.CONSUMO_LUBRIFICANTE.result && 
        rotaParams.DENSIDADE_LUBRIFICANTE.result &&
        rotaParams.TEMPO_HORA_ROTA.result &&
        rotaParams.PRECO_MEDIO_LUBRIFICANTE.result) {

        CUSTO_OLEO_LUBRIFICANTES = (
            rotaParams.POTENCIA_DO_MOTOR.valor
            *
            (rotaParams.CONSUMO_LUBRIFICANTE.valor / rotaParams.DENSIDADE_LUBRIFICANTE.valor)
            *
            rotaParams.PRECO_MEDIO_LUBRIFICANTE.valor
            *
            rotaParams.TEMPO_HORA_ROTA.valor
            *
            20
        )
        
        guardaParametroDetalhado("CUSTO_OLEO_LUBRIFICANTES", CUSTO_OLEO_LUBRIFICANTES);
    } else {
        custoValido = false;
    }

    if (DEBUG) { console.debug("CUSTO_OLEO_LUBRIFICANTES", CUSTO_OLEO_LUBRIFICANTES) }

    return custoValido;
}

async function pegarParametrosMotoristas() {
    let custoValido = true;

    let params = {
        NUM_MOTORISTAS: {
            "codigo_parametro": "NUM_MOTORISTAS",
            "modulo": "Rotas",
            "result": false,
            "valor": 0
        },
        SALARIO_MEDIO_MOTORISTA: {
            "codigo_parametro": "SALARIO_MEDIO_MOTORISTA",
            "modulo": "Motoristas",
            "result": false,
            "valor": 0
        }
    };

    let motoristas = [];
    try {
        motoristas = await restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/motoristas`);
    } catch (err) {
        motoristas = [];
    }

    if (motoristas.length == 0) {
        if (DEBUG) { console.debug("NUM_MOTORISTAS", 0) }
        if (DEBUG) { console.debug("SALARIO_MEDIO_MOTORISTA", 0) }

        custoValido = false;
    } else {
        if (DEBUG) { console.debug("NUM_MOTORISTAS", motoristas.length) }

        params.NUM_MOTORISTAS.result = true;
        params.NUM_MOTORISTAS.valor = motoristas.length;

        let salarioMedioMotorista = 0;
        let salarioValido = true;

        for (let motorista of motoristas) {
            try {
                let motoristaDetalhe = await restImpl.dbGETEntidade(DB_TABLE_MOTORISTA, `/${motorista.cpf}`);

                if (DEBUG) { console.debug("SALARIO_MOTORISTA", motoristaDetalhe?.nome, motoristaDetalhe?.salario) }

                if (motoristaDetalhe.salario && !(isNaN(motoristaDetalhe.salario)) && Number(motoristaDetalhe.salario) > 0) {
                    salarioMedioMotorista = salarioMedioMotorista + Number(motoristaDetalhe.salario);
                } else {
                    if (DEBUG) { console.debug("SALARIO_MEDIO_MOTORISTA", 0) }

                    custoValido = false;
                    salarioValido = false;
                    break;
                }
            } catch (err) {
                if (DEBUG) { console.debug("SALARIO_MEDIO_MOTORISTA", 0) }

                custoValido = false;
                salarioValido = false;
                break;
            }
        }

        if (salarioValido) {
            if (DEBUG) { console.debug("SALARIO_MEDIO_MOTORISTA", salarioMedioMotorista / params.NUM_MOTORISTAS.valor) }

            params.SALARIO_MEDIO_MOTORISTA.result = true;
            params.SALARIO_MEDIO_MOTORISTA.valor = salarioMedioMotorista / params.NUM_MOTORISTAS.valor;
        }
    }

    return [custoValido, params, motoristas];
}

async function pegarParametrosMonitores() {
    let custoValido = true;

    let params = {
        NUM_MONITORES: {
            "codigo_parametro": "NUM_MONITORES",
            "modulo": "Monitores",
            "result": false,
            "valor": 0
        },
        SALARIO_MEDIO_MONITORES: {
            "codigo_parametro": "SALARIO_MEDIO_MONITORES",
            "modulo": "Monitores",
            "result": false,
            "valor": 0
        }
    };

    let monitores = [];
    try {
        monitores = await restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/monitores`);
    } catch (err) {
        monitores = [];
    }

    if (monitores.length == 0) {
        if (DEBUG) { console.debug("NUM_MONITORES", 0) }
        if (DEBUG) { console.debug("SALARIO_MEDIO_MONITORES", 0) }

        params.NUM_MONITORES.result = true;
        params.SALARIO_MEDIO_MONITORES.result = true;
    } else {
        if (DEBUG) { console.debug("NUM_MONITORES", monitores.length) }

        params.NUM_MONITORES.result = true;
        params.NUM_MONITORES.valor = monitores.length;

        let salarioMedioMonitores = 0;
        let salarioValido = true;

        for (let monitor of monitores) {
            try {
                let monitorDetalhe = await restImpl.dbGETEntidade(DB_TABLE_MONITOR, `/${monitor.cpf}`);

                if (DEBUG) { console.debug("SALARIO_MONITOR", monitorDetalhe?.nome, monitorDetalhe?.salario) }

                if (monitorDetalhe.salario && !(isNaN(monitorDetalhe.salario)) && Number(monitorDetalhe.salario) > 0) {
                    salarioMedioMonitores = salarioMedioMonitores + Number(monitorDetalhe.salario);
                } else {
                    if (DEBUG) { console.debug("SALARIO_MEDIO_MONITORES", 0) }

                    custoValido = false;
                    salarioValido = false;
                    break;
                }
            } catch (err) {
                if (DEBUG) { console.debug("SALARIO_MEDIO_MONITORES", 0) }

                custoValido = false;
                salarioValido = false;
                break;
            }
        }

        if (salarioValido) {
            if (DEBUG) { console.debug("SALARIO_MEDIO_MONITORES", salarioMedioMonitores / params.NUM_MONITORES.valor) }

            params.SALARIO_MEDIO_MONITORES.result = true;
            params.SALARIO_MEDIO_MONITORES.valor = salarioMedioMonitores / params.NUM_MONITORES.valor;
        }
    }

    return [custoValido, params, monitores];
}

async function pegarParametrosGerais() {
    let custoValido = true;
    let params = {}

    let paramNomes = [
        "CFT_CONSUMO_OLEO_LUBRIFICANTE",
        "CONSUMO_LUBRIFICANTE",
        "PERC_SEGURO_AQUA",
        "PERC_ENCARGO_SOCIAIS",
        "PERC_CFT_CUSTO_MANUTENCAO_AQUA",
        "PERC_RESIDUAL_AQUA",
        "PERC_MANUTENCAO_EMBARCACAO",
        "PERC_TRC",
        "DENSIDADE_COMBUSTIVEL",
        "DENSIDADE_LUBRIFICANTE",
        "PRECO_MEDIO_COMBUSTIVEIS",
        "PRECO_MEDIO_LUBRIFICANTE",
        "VIDA_UTIL_AQUA"
    ]

    for (let p of paramNomes) {
        params[p] = {
            "codigo_parametro": p,
            "modulo": "Parâmetros",
            "result": false,
            "valor": 0
        }
    }

    try {
        let paramGerais = await restImpl.dbGETColecao(DB_TABLE_PARAMETROS);

        for (let p of paramGerais) {
            if (DEBUG) { console.debug(p?.codigo_parametro, p?.valor) }

            if (p.codigo_parametro in params) {
                if (p.valor && !(isNaN(p.valor)) && Number(p.valor) > 0) {
                    params[p.codigo_parametro].result = true;
                    params[p.codigo_parametro].valor = Number(p.valor);
                } else {
                    custoValido = false;

                    params[p.codigo_parametro].result = false;
                    params[p.codigo_parametro].valor = p?.valor;
                }
            }
        }
    } catch (err) {
        custoValido = false;
    }

    return [custoValido, params];
}

function processaParametroVeiculo(veiculo, nomeParametro, paramDict) {
    let custoValido = true;
    if (DEBUG) { console.debug(nomeParametro, veiculo?.placa, veiculo?.nomeParametro) }

    if (veiculo.nomeParametro && !(isNaN(veiculo.nomeParametro)) && Number(veiculo.nomeParametro) > 0) {
        paramDict.valor = paramDict.valor + Number(veiculoDetalhe.nomeParametro);
    } else {
        paramDict.result = false;
        custoValido = false;
    }

    return [custoValido, paramDict];
}

async function pegarParametrosVeiculos() {
    let custoValido = true;
    let params = {}

    let paramNomes = [
        "NUM_VEICULOS",
        "POTENCIA_DO_MOTOR",
        "SRC_FROTA",
        "CFT_CONSUMO_COMBUSTIVEL",
        "PRECO_MEDIO_VEICULOS",
        "ANO_ATUAL",
        "ANO_VEICULO",
        "IDADE_VEICULO",
    ]

    for (let p of paramNomes) {
        params[p] = {
            "codigo_parametro": p,
            "modulo": "Frota",
            "result": false,
            "valor": 0
        }
    }

    let veiculos = [];
    try {
        veiculos = await restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}/veiculos`);
    } catch (err) {
        veiculos = [];
    }

    if (!veiculos || veiculos.length == 0) {
        if (DEBUG) { 
            console.debug("NUM_VEICULOS", 0)
            console.debug("POTENCIA_DO_MOTOR", 0) 
            console.debug("SRC_FROTA", 0) 
            console.debug("CFT_CONSUMO_COMBUSTIVEL", 0) 
            console.debug("PRECO_MEDIO_VEICULOS", 0) 
            console.debug("ANO_ATUAL", 0) 
            console.debug("ANO_VEICULO", 0) 
            console.debug("IDADE_VEICULO", 0) 
        }

        custoValido = false;
    } else {
        // if (DEBUG) { console.debug("NUM_VEICULOS", veiculos.length) }
        if (DEBUG) { console.debug("NUM_VEICULOS", 1) }

        params.NUM_VEICULOS.result = true;
        params.NUM_VEICULOS.valor = 1; //veiculos.length;

        // for (let veiculo of veiculos) {
        let veiculo = veiculos;
        try {
            let veiculoDetalhe = await restImpl.dbGETEntidade(DB_TABLE_VEICULO, `/${veiculo.id_veiculo}`);

            // TODO: Modularizar e colocar o código repetido em uma função só
            if (DEBUG) { console.debug("POTENCIA_DO_MOTOR", veiculoDetalhe?.placa, veiculoDetalhe?.potencia_do_motor) }
            if (veiculoDetalhe.potencia_do_motor && !(isNaN(veiculoDetalhe.potencia_do_motor)) && Number(veiculoDetalhe.potencia_do_motor) > 0) {
                params.POTENCIA_DO_MOTOR.valor = params.POTENCIA_DO_MOTOR.valor + Number(veiculoDetalhe.potencia_do_motor);
                params.POTENCIA_DO_MOTOR.result = true;
            } else {
                custoValido = false;
            }

            if (DEBUG) { console.debug("SRC_FROTA", veiculoDetalhe?.placa, veiculoDetalhe?.seguro_anual) }
            if (veiculoDetalhe.seguro_anual && !(isNaN(veiculoDetalhe.seguro_anual)) && Number(veiculoDetalhe.seguro_anual) > 0) {
                params.SRC_FROTA.valor = params.SRC_FROTA.valor + Number(veiculoDetalhe.seguro_anual);
                params.SRC_FROTA.result = true;
            } else {
                custoValido = false;
            }

            if (DEBUG) { console.debug("CFT_CONSUMO_VEICULO", veiculoDetalhe?.placa, veiculoDetalhe?.consumo) }
            if (veiculoDetalhe.consumo && !(isNaN(veiculoDetalhe.consumo)) && Number(veiculoDetalhe.consumo) > 0) {
                params.CFT_CONSUMO_COMBUSTIVEL.valor = params.PRECO_MEDIO_VEICULOS.valor + Number(veiculoDetalhe.consumo);
                params.CFT_CONSUMO_COMBUSTIVEL.result = true;
            } else {
                custoValido = false;
            }

            if (DEBUG) { console.debug("PRECO_VEICULO", veiculoDetalhe?.placa, veiculoDetalhe?.preco) }
            if (veiculoDetalhe.preco && !(isNaN(veiculoDetalhe.preco)) && Number(veiculoDetalhe.preco) > 0) {
                params.PRECO_MEDIO_VEICULOS.valor = params.PRECO_MEDIO_VEICULOS.valor + Number(veiculoDetalhe.preco);
                params.PRECO_MEDIO_VEICULOS.result = true;
            } else {
                custoValido = false;
            }

            if (veiculoDetalhe.ano && !(isNaN(veiculoDetalhe.ano)) && Number(veiculoDetalhe.ano) > 0) {
                params.ANO_VEICULO.valor = params.ANO_VEICULO.valor + Number(veiculoDetalhe.ano);
                params.ANO_ATUAL.valor = new Date().getFullYear();
                params.IDADE_VEICULO.valor = params.IDADE_VEICULO.valor + (new Date().getFullYear() - Number(veiculoDetalhe.ano));

                params.ANO_VEICULO.result = true;
                params.ANO_ATUAL.result = true;
                params.IDADE_VEICULO.result = true;
            } else {
                custoValido = false;
            }
        } catch (err) {
            custoValido = false;
        }
        // }

        if (params.PRECO_MEDIO_VEICULOS.result) {
            if (DEBUG) { console.debug("PRECO_MEDIO_VEICULOS", params.PRECO_MEDIO_VEICULOS.valor / params.NUM_VEICULOS.valor) }
            params.PRECO_MEDIO_VEICULOS.valor = params.PRECO_MEDIO_VEICULOS.valor / params.NUM_VEICULOS.valor;
        }

        if (params.CFT_CONSUMO_COMBUSTIVEL.result) {
            if (DEBUG) { console.debug("CFT_CONSUMO_COMBUSTIVEL", params.CFT_CONSUMO_COMBUSTIVEL.valor / params.NUM_VEICULOS.valor) }
            params.CFT_CONSUMO_COMBUSTIVEL.valor = params.CFT_CONSUMO_COMBUSTIVEL.valor / params.NUM_VEICULOS.valor;
        }
    }

    return [custoValido, params, veiculos];

}

async function pegarParametrosAlunos(rota) {
    let custoValido = true;

    let params = {
        TEMPO_MIN_ROTA:         { "codigo_parametro": "TEMPO_MIN_ROTA",         "modulo": "Frota",     "result": false, "valor": 0 },
        TEMPO_MIN_MENSAL_ROTA:  { "codigo_parametro": "TEMPO_MIN_MENSAL_ROTA",  "modulo": "Frota",     "result": false, "valor": 0 },
        TEMPO_HORA_ROTA:        { "codigo_parametro": "TEMPO_HORA_ROTA",        "modulo": "Frota",     "result": false, "valor": 0 },
        TEMPO_HORA_MENSAL_ROTA: { "codigo_parametro": "TEMPO_HORA_MENSAL_ROTA", "modulo": "Frota",     "result": false, "valor": 0 },
        NUM_ALUNOS:             { "codigo_parametro": "NUM_ALUNOS",             "modulo": "Monitores", "result": false, "valor": 0 }
    };

    if (rota.tempo && !(isNaN(rota.tempo)) && Number(rota.tempo) > 0) {
        params.TEMPO_MIN_ROTA.valor = Number(rota.tempo);
        params.TEMPO_MIN_ROTA.result = true;
        
        params.TEMPO_MIN_MENSAL_ROTA.valor = Number(rota.tempo) * 20;
        params.TEMPO_MIN_MENSAL_ROTA.result = true;
        
        params.TEMPO_HORA_ROTA.valor = Number(rota.tempo) / 60;
        params.TEMPO_HORA_ROTA.result = true;

        params.TEMPO_HORA_MENSAL_ROTA.valor = (Number(rota.tempo) / 60) * 20;
        params.TEMPO_HORA_MENSAL_ROTA.result = true;
    } else {
        custoValido = false;
    }

    let rotaAlunos = [];

    try {
        rotaAlunos = await restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/alunos`);
        params.NUM_ALUNOS.valor = Number(rotaAlunos.length);
        params.NUM_ALUNOS.result = true;
    } catch (err) {
        console.log(err);
    }
    return [custoValido, params, rotaAlunos];
}
