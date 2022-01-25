// custo-resultado-rodo-ctrl.js
// Este arquivo contém o script de controle da tela custo-resultado-rodo-view. 
// A ferramenta ilustra o resultado da operação de cálculo de custo de uma rota rodoviária do sistema

var idRota = "";
if (action == "calcularRota") {
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

function preencheDadosBasicos(rota) {
    loadingFn("Calculando o custo da rota..." + rota.nome);

    $("#nomeRota").text(rota.nome);

    return rota;
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

    rotaDados = {
        rota,
        motoristas,
        monitores,
        veiculos,
        alunos
    }

    return rota;
}

function calcularCustoFixo() {
    let custoComPessoalValido = calcularCustoComPessoal();
    detalharCustoComPessoal(custoComPessoalValido);

    let custoAdministrativoValido = calcularCustoAdministrativo();
    detalharCustoAdministrativo(custoAdministrativoValido);

    let custoDepreciacaoValido = calcularCustoDepreciacao();
    detalharDepreciacao(custoDepreciacaoValido);

    let custoRemuneracaoValido = calcularCustoRemuneracao();
    detalharRemuneracao(custoRemuneracaoValido);

    // Calcula custo fixo
    let CUSTO_FIXO = 0;
    if (custoComPessoalValido && custoAdministrativoValido &&
        custoDepreciacaoValido && custoRemuneracaoValido) {
        CUSTO_FIXO = det.CUSTO_COM_PESSOAL.valor +
            det.CUSTO_ADMINISTRATIVO.valor +
            det.CUSTO_DEPRECIACAO_FROTA.valor + 
            det.CUSTO_REMUNERACAO_FROTA.valor;

        det.CUSTO_FIXO = {
            "codigo_parametro": "CUSTO_FIXO",
            "result": true,
            "valor": CUSTO_FIXO
        }

        detalharCustoFixo();
    }

    if (DEBUG) { console.debug("CUSTO_FIXO", CUSTO_FIXO) }

    return (custoComPessoalValido && custoAdministrativoValido &&
        custoDepreciacaoValido && custoRemuneracaoValido);
}

function calcularCustoVariavel(custoFixoValido) {
    let custoComCombustivelValido = calcularCustoComCombustivel();
    detalharCustoCombustivel(custoComCombustivelValido);

    let custoComOleoLubrificantesValido = calcularCustoComOleoLubrificantes();
    detalharCustoOleoLubrificantes(custoComOleoLubrificantesValido);

    let custoDeRodagemValido = calcularCustoDeRodagem();
    detalharCustoDeRodagem(custoDeRodagemValido);

    let custoDePecasAcessoriosValido = calcularCustoPecasAcessorios();
    detalharCustoPecasAcessorios(custoDePecasAcessoriosValido);

    // Calcula custo variável
    let CUSTO_VARIAVEL = 0;
    if (custoComCombustivelValido && custoComOleoLubrificantesValido &&
        custoDeRodagemValido && custoDePecasAcessoriosValido) {
        CUSTO_VARIAVEL = det.CUSTO_COM_COMBUSTIVEL.valor +
            det.CUSTO_OLEO_LUBRIFICANTES.valor +
            det.CUSTO_DE_RODAGEM.valor +
            det.CUSTO_PECAS_ACESSORIOS.valor;

        det.CUSTO_VARIAVEL = {
            "codigo_parametro": "CUSTO_VARIAVEL",
            "result": true,
            "valor": CUSTO_VARIAVEL
        }

        detalharCustoVariavel();
    }
    if (DEBUG) { console.debug("CUSTO_VARIAVEL", CUSTO_VARIAVEL) }

    // Retorna se custo final é válido, fazendo a junção lógica com o custofixo
    return (custoFixoValido && custoComCombustivelValido && custoComOleoLubrificantesValido &&
        custoDeRodagemValido && custoDePecasAcessoriosValido);
}

function calcularCustoFinal(custoFinalValido) {
    let CUSTO_FINAL = 0;
    let CUSTO_KM = 0;
    let CUSTO_ALUNO = 0;

    if (custoFinalValido) {
        CUSTO_FINAL = (12 * det.CUSTO_FIXO.valor) + ((10 * det.CUSTO_VARIAVEL.valor) * det.KM_MENSAL_ROTA.valor * 20 * 2);
        CUSTO_KM = CUSTO_FINAL / (det.KM_MENSAL_ROTA.valor * 2);


        det.CUSTO_FINAL = {
            "codigo_parametro": "CUSTO_FINAL",
            "result": true,
            "valor": CUSTO_FINAL
        }

        det.CUSTO_KM = {
            "codigo_parametro": "CUSTO_KM",
            "result": true,
            "valor": CUSTO_KM
        }

        if (det.NUM_ALUNOS.valor > 0) {
            CUSTO_ALUNO = CUSTO_FINAL / (det.NUM_ALUNOS.valor);
            det.CUSTO_ALUNO = {
                "codigo_parametro": "CUSTO_ALUNO",
                "result": true,
                "valor": CUSTO_ALUNO
            }
        }

        detalharCustoFinal();
    }

    if (DEBUG) { console.debug("CUSTO_FINAL", CUSTO_FINAL) }
    if (DEBUG) { console.debug("CUSTO_KM", CUSTO_KM) }
    if (DEBUG) { console.debug("CUSTO_ALUNO", CUSTO_ALUNO) }

    rotaValida = custoFinalValido;
    return custoFinalValido;
}

function formataMoeda(nomeParametro, casasDecimais = 2) {
    let num = Number(det[nomeParametro].valor).toFixed(2);
    return Intl.NumberFormat("pt-BR").format(num)

}

function formataOutputParametro(nomeParametro, casasDecimais = 2) {
    if (!(nomeParametro in det)) {
        return "\\textrm{ERRO}";
    }

    if (det[nomeParametro].result) {
        if (!isNaN(det[nomeParametro].result)) {
            return det[nomeParametro].valor.toFixed(casasDecimais);
        } else {
            return det[nomeParametro].valor;
        }
    } else {
        return "\\textrm{NÃO INFORMADO}"
    }
}

function detalharCustoComPessoal(custoComPessoalValido) {
    if (!custoComPessoalValido) {
        $("#CustoPessoalCard").addClass("erroCusto");
    }
    $("#CustoMotoristaDetalhamento").text(`$Cm = ${formataOutputParametro("COEFICIENTE_UTILIZACAO_MOTORISTA")} 
                                           \\times ${formataOutputParametro("SALARIO_MEDIO_MOTORISTA")} 
                                           \\times ${formataOutputParametro("ENCARGOS_SOCIAIS")}$`)
    $("#CustoMotoristaValorFinal").text(`$Cm = ${formataOutputParametro("CUSTO_COM_MOTORISTA")}$`)

    $("#CustoMonitorDetalhamento").text(`$Cmon = ${formataOutputParametro("COEFICIENTE_UTILIZACAO_MONITOR")} 
                                          \\times ${formataOutputParametro("SALARIO_MEDIO_MONITORES")}
                                          \\times ${formataOutputParametro("ENCARGOS_SOCIAIS")}$`)

    $("#CustoMonitorValorFinal").text(`$Cmon = ${formataOutputParametro("CUSTO_COM_MONITOR")}$`)

    $("#CustoManutencaoDetalhamento").text(`$Cpm = ${formataOutputParametro("CUSTO_COM_MOTORISTA")} 
                                                \\times ${formataOutputParametro("CFT_CUSTO_MANUTENCAO_RODO")}$`)
    $("#CustoManutencaoValorFinal").text(`$Cpm = ${formataOutputParametro("CUSTO_COM_MANUTENCAO")}$`)

    $("#CustoPessoalDetalhamento").text(`$Cdp = ${formataOutputParametro("CUSTO_COM_MOTORISTA")} 
                                            + ${formataOutputParametro("CUSTO_COM_MANUTENCAO")}
                                            + ${formataOutputParametro("CUSTO_COM_MONITOR")}$`)
    $("#CustoPessoalValorFinal").text(`$Cdp = ${formataOutputParametro("CUSTO_COM_PESSOAL")}$`)
}

function detalharCustoAdministrativo(custoValido) {
    if (!custoValido) {
        $("#CustoAdmCard").addClass("erroCusto");
    }

    $("#CustoAdministrativoDetalhamento").text(`$Cad = \\frac{${formataOutputParametro("IPVA_FROTA")} +
                                                              ${formataOutputParametro("DPVAT_FROTA")} + 
                                                              ${formataOutputParametro("SRC_FROTA")}}
                                                {12 \\times ${formataOutputParametro("NUM_VEICULOS")}}$`)

    $("#CustoAdministrativoValorFinal").text(`$Cad = ${formataOutputParametro("CUSTO_ADMINISTRATIVO")}$`)
}

function detalharDepreciacao(custoValido) {
    if (!custoValido) {
        $("#CustoDepreciacaoCard").addClass("erroCusto");
    }

    $("#CustoDepreciacaoDetalhamentoPassoUm").text(`$Cdf = \\frac{\\max(0, ${formataOutputParametro("VIDA_UTIL_RODO", 0)} - 
                                                   (${formataOutputParametro("ANO_ATUAL", 0)} - ${formataOutputParametro("ANO_VEICULO", 0)}))}
                                                {1 + 2 \\cdots + ${formataOutputParametro("VIDA_UTIL_RODO", 0)}} 
                                                \\times (1 - \\frac{${formataOutputParametro("PERC_RESIDUAL_RODO", 0)}}{100})$`)

    $("#CustoDepreciacaoDetalhamentoPassoDois").text(`$Cdf = \\frac{${formataOutputParametro("DIFF_VIDAUTIL_IDADE_VEICULO", 0)}}
                                                                   {${formataOutputParametro("SOMATORIO_VIDA_UTIL", 0)}}
                                                   \\times (1 - ${formataOutputParametro("VALOR_RESIDUAL")}) = 
                                                   ${formataOutputParametro("COEFICIENTE_DEPRECIACAO_VEICULO", 6)}$`)


    $("#CustoDepreciacaoDetalhamentoPassoTres").text(`$Cudf = \\frac{${formataOutputParametro("COEFICIENTE_DEPRECIACAO_VEICULO", 6)} 
                                                      \\times ${formataOutputParametro("PRECO_MEDIO_VEICULOS")}}
                                                      {12 \\times ${formataOutputParametro("NUM_VEICULOS", 0)}}$`)

    $("#CustoDepreciacaoValorFinal").text(`$Cudf = ${formataOutputParametro("CUSTO_DEPRECIACAO_FROTA")}$`)
}

function detalharRemuneracao(custoValido) {
    if (!custoValido) {
        $("#CustoRemuneracaoCapitalCard").addClass("erroCusto");
    }

    $("#CustoRemuneracaoDetalhamentoPassoUm").text(`$Crf = \\left \\{ 1 - \\left (
        \\frac{${formataOutputParametro("DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO", 0)}}
        {${formataOutputParametro("SOMATORIO_VIDA_UTIL", 0)}}
        \\right ) \\times
        \\left ( 1 - \\frac{${formataOutputParametro("PERC_RESIDUAL_RODO", 0)}}{100} \\right ) \\right
        \\} \\times ${formataOutputParametro("VALOR_TRC", 4)} $`);

    $("#CustoRemuneracaoDetalhamentoPassoDois").text(`$Crf = ${formataOutputParametro("COEFICIENTE_REMUNERACAO_VEICULO", 6)} $`);

    $("#CustoRemuneracaoDetalhamentoPassoTres").text(`$Cudf = \\frac{${formataOutputParametro("COEFICIENTE_REMUNERACAO_VEICULO", 6)} 
    \\times ${formataOutputParametro("PRECO_MEDIO_VEICULOS")}}{12}$`);

    $("#CustoRemuneracaoValorFinal").text(`$Cudf = ${formataOutputParametro("CUSTO_REMUNERACAO_FROTA")}$`);
}

function detalharCustoCombustivel(custoValido) {
    if (!custoValido) {
        $("#CustoCombustivelCard").addClass("erroCusto");
    }

    $("#CustoCombustivelDetalhamento").text(`$Cc = \\frac{1}{${formataOutputParametro("CFT_CONSUMO_COMBUSTIVEL", 4)}} 
                                            \\times ${formataOutputParametro("PRECO_MEDIO_COMBUSTIVEIS")}$`)
    $("#CustoCombustivelValorFinal").text(`$Cc = ${formataOutputParametro("CUSTO_COM_COMBUSTIVEL", 4)}$`)
}

function detalharCustoOleoLubrificantes(custoValido) {
    if (!custoValido) {
        $("#CustoOleoLubrificantesCard").addClass("erroCusto");
    }

    $("#CustoOleoLubrificantesDetalhamento").text(`$Cc = ${formataOutputParametro("CFT_CONSUMO_OLEO_LUBRIFICANTE")} \\times ${formataOutputParametro("PRECO_MEDIO_COMBUSTIVEIS")}$`)
    $("#CustoOleoLubrificantesValorFinal").text(`$Cc = ${formataOutputParametro("CUSTO_OLEO_LUBRIFICANTES", 4)}$`)
}

function detalharCustoDeRodagem(custoValido) {
    if (!custoValido) {
        $("#CustoRodagemCard").addClass("erroCusto");
    }

    $("#CustoRodagemDetalhamento").text(`$Cr = \\frac{(${formataOutputParametro("PRECO_MEDIO_PNEUS")} \\times ${formataOutputParametro("NUMERO_PNEUS")}) 
                                               + (${formataOutputParametro("PRECO_MEDIO_RECAPAGEM")} \\times ${formataOutputParametro("NUMERO_PNEUS")} \\times ${formataOutputParametro("NUM_RECAPAGEM")})}
                                               {${formataOutputParametro("VIDA_UTIL_PNEU")}}$`)
    $("#CustoRodagemValorFinal").text(`$Cr = ${formataOutputParametro("CUSTO_DE_RODAGEM")}$`)
}

function detalharCustoPecasAcessorios(custoValido) {
    if (!custoValido) {
        $("#CustoPecaAcessoriosCard").addClass("erroCusto");
    }

    $("#CustoPecaAcessoriosDetalhamento").text(`$Cpa = \\frac{${formataOutputParametro("CFT_CONSUMO_PECAS", 6)} \\times ${formataOutputParametro("PRECO_MEDIO_VEICULOS")}}
                                                   {${formataOutputParametro("KM_MENSAL_ROTA")} \\times 20 \\textrm{ (dias)} \\times 2 \\textrm{ (ida e volta)}}$`)
    $("#CustoPecaAcessoriosValorFinal").text(`$Cpa = ${formataOutputParametro("CUSTO_PECAS_ACESSORIOS")}$`)
}

function detalharCustoFixo() {
    $("#CustoFixoDetalhamento").text(`$Cf = ${formataOutputParametro("CUSTO_COM_PESSOAL")} + 
                                            ${formataOutputParametro("CUSTO_ADMINISTRATIVO")} + 
                                            ${formataOutputParametro("CUSTO_DEPRECIACAO_FROTA")} +
                                            ${formataOutputParametro("CUSTO_REMUNERACAO_FROTA")}$`);
    $("#CustoFixoValorFinal").text(`$Cf = ${formataOutputParametro("CUSTO_FIXO")}$`)
}

function detalharCustoVariavel() {
    $("#CustoVariavelDetalhamento").text(`$Cv = ${formataOutputParametro("CUSTO_COM_COMBUSTIVEL")} + 
                                            ${formataOutputParametro("CUSTO_OLEO_LUBRIFICANTES")} + 
                                            ${formataOutputParametro("CUSTO_DE_RODAGEM")} + 
                                            ${formataOutputParametro("CUSTO_PECAS_ACESSORIOS")}$`);
    $("#CustoVariavelValorFinal").text(`$Cv = ${formataOutputParametro("CUSTO_VARIAVEL")}$`)
}

function detalharCustoFinal() {
    $("#CustoRotaDetalhamento").text(`$Custo = (12 \\times ${formataOutputParametro("CUSTO_FIXO")}) + 
                                            (10 \\times ${formataOutputParametro("CUSTO_VARIAVEL")})
                                            \\times (${formataOutputParametro("KM_MENSAL_ROTA")} \\textrm{ km}
                                            \\times 20 \\textrm{ dias})$`);
    $("#CustoRotaValorFinal").text(`$Custo = ${formataMoeda("CUSTO_FINAL")}$`)
}


function mostraInformacoesCusto() {
    if (rotaValida) {
        $("#precoCustoGrande").text("R$ " + formataMoeda("CUSTO_FINAL"));
        $("#custoPorKM").text("R$ " + formataMoeda("CUSTO_KM"));

        if (det["CUSTO_ALUNO"] && det["CUSTO_ALUNO"].result) {
            $("#custoPorAluno").text("R$ " + formataMoeda("CUSTO_ALUNO"));
        }

        // Grafico custo fixo
        let CUSTO_ANUAL_COM_MOTORISTA = Number(Number(12 * det.CUSTO_COM_MOTORISTA.valor).toFixed(2));
        let CUSTO_ANUAL_COM_MONITOR = Number(12 * det.CUSTO_COM_MONITOR.valor);
        let CUSTO_ANUAL_COM_MANUTENCAO = Number(Number(12 * det.CUSTO_COM_MANUTENCAO.valor).toFixed(2));
        let CUSTO_ANUAL_COM_ADM = Number(Number(12 * det.CUSTO_ADMINISTRATIVO.valor).toFixed(2));
        let CUSTO_ANUAL_COM_DEPRECIACAO = Number(Number(12 * det.CUSTO_DEPRECIACAO_FROTA.valor).toFixed(2));

        let KM_ROTA_ANUAL = det.KM_MENSAL_ROTA.valor * 20 * 2;
        let CUSTO_VARIAVEL_ANUAL_COM_COMBUSTIVEL = Number(Number(10 * det.CUSTO_COM_COMBUSTIVEL.valor * KM_ROTA_ANUAL).toFixed(2));
        let CUSTO_VARIAVEL_ANUAL_COM_OLEOLUBRIFICANTES = Number(Number(10 * det.CUSTO_OLEO_LUBRIFICANTES.valor * KM_ROTA_ANUAL).toFixed(2));
        let CUSTO_VARIAVEL_ANUAL_COM_CUSTORODAGEM = Number(Number(10 * det.CUSTO_DE_RODAGEM.valor * KM_ROTA_ANUAL).toFixed(2));
        let CUSTO_VARIAVEL_ANUAL_COM_PECASACESSORIOS = Number(Number(10 * det.CUSTO_PECAS_ACESSORIOS.valor * KM_ROTA_ANUAL).toFixed(2));

        // var grafData = google.visualization.arrayToDataTable([
        //     ['Custo', 'Valor (ano)'],
        //     ['Motoristas', CUSTO_ANUAL_COM_MOTORISTA],
        //     ['Monitor', CUSTO_ANUAL_COM_MONITOR],
        //     ['Manutenção', CUSTO_ANUAL_COM_MANUTENCAO],
        //     ['Administrativo', CUSTO_ANUAL_COM_ADM],
        //     ['Depreciação', CUSTO_ANUAL_COM_DEPRECIACAO],
        //     ['Combustível', CUSTO_VARIAVEL_ANUAL_COM_COMBUSTIVEL],
        //     ['Óleo/Lubrificantes', CUSTO_VARIAVEL_ANUAL_COM_OLEOLUBRIFICANTES],
        //     ['Rodagem', CUSTO_VARIAVEL_ANUAL_COM_CUSTORODAGEM],
        //     ['Peças e Acessórios', CUSTO_VARIAVEL_ANUAL_COM_PECASACESSORIOS]
        // ]);

        // var formatter = new google.visualization.NumberFormat({ decimalSymbol: ',', groupingSymbol: '.', negativeColor: 'red', negativeParens: true, prefix: 'R$ ' });
        // formatter.format(grafData, 1);

        // var options = {
        //     title: "Composição do custo da rota (ano)",
        //     fontName: "Roboto",
        //     fontSize: 10,
        //     height: 500,
        //     legend: {
        //         position: "bottom",
        //         maxLines: 2,
        //     },
        //     tooltip: {
        //         ignoreBounds: true,
        //     }
        // };

        // var chart = new google.visualization.PieChart(document.getElementById('graficoCusto'));
        // chart.draw(grafData, options);

        // Treemap
        // var options = {
        //     series: [
        //         {
        //             name: "Custos Fixos",
        //             data: [
        //                 { x: 'Custos com Motoristas', y: CUSTO_ANUAL_COM_MOTORISTA },
        //                 { x: 'Custos com Monitores', y: CUSTO_ANUAL_COM_MONITOR },
        //                 { x: 'Custos com Prof. Manutenção', y: CUSTO_ANUAL_COM_MANUTENCAO },
        //                 { x: "Custo Administrativo do Veículo (IPVA, DPVAT, etc)", y: CUSTO_ANUAL_COM_ADM },
        //                 { x: "Depreciação", y: CUSTO_ANUAL_COM_DEPRECIACAO },
        //             ]
        //         },
        //         {
        //             name: "Custos Variáveis",
        //             data: [
        //                 { x: "Combustível", y: CUSTO_VARIAVEL_ANUAL_COM_COMBUSTIVEL },
        //                 { x: "Óleo/Lubrificantes", y: CUSTO_VARIAVEL_ANUAL_COM_OLEOLUBRIFICANTES },
        //                 { x: "Rodagem", y: CUSTO_VARIAVEL_ANUAL_COM_CUSTORODAGEM },
        //                 { x: "Peças e Acessórios", y: CUSTO_VARIAVEL_ANUAL_COM_PECASACESSORIOS },
        //             ]
        //         }
        //     ],
        //     legend: {
        //         show: false
        //     },
        //     chart: {
        //         height: 550,
        //         type: 'treemap'
        //     },
        //     title: {
        //         text: 'Basic Treemap'
        //     }
        // };

        // var chart = new ApexCharts(document.querySelector("#graficoCusto"), options);
        // chart.render();

        var options = {
            series: [CUSTO_ANUAL_COM_MOTORISTA, CUSTO_ANUAL_COM_MONITOR,
                CUSTO_ANUAL_COM_MANUTENCAO, CUSTO_ANUAL_COM_ADM, CUSTO_ANUAL_COM_DEPRECIACAO,
                CUSTO_VARIAVEL_ANUAL_COM_COMBUSTIVEL, CUSTO_VARIAVEL_ANUAL_COM_OLEOLUBRIFICANTES,
                CUSTO_VARIAVEL_ANUAL_COM_CUSTORODAGEM, CUSTO_VARIAVEL_ANUAL_COM_PECASACESSORIOS],
            chart: {
                // width: '70%',
                type: 'pie',
                // offsetX: 100,
                // offsetX: 100,
            },
            labels: ['Motoristas', 'Monitores', 'Pessoal de Manutenção', 'Administração',
                'Depreciação', 'Combustível', 'Óleo/Lubrificantes', 'Rodagem', 'Peças e Acessórios'],
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
        if (DEBUG) { console.debug("COEFICIENTE_UTILIZACAO_MOTORISTA", rotaParams.NUM_MOTORISTAS.valor / rotaParams.NUM_VEICULOS.valor) }

        COEFICIENTE_UTILIZACAO_MOTORISTA = Number(rotaParams.NUM_MOTORISTAS.valor / rotaParams.NUM_VEICULOS.valor);

        det.COEFICIENTE_UTILIZACAO_MOTORISTA = {
            "codigo_parametro": "COEFICIENTE_UTILIZACAO_MOTORISTA",
            "result": true,
            "valor": COEFICIENTE_UTILIZACAO_MOTORISTA
        };
    }

    // Salário médio do motorista
    if (rotaParams.SALARIO_MEDIO_MOTORISTA.result) {
        if (DEBUG) { console.debug("SALARIO_MEDIO_MOTORISTA", rotaParams.SALARIO_MEDIO_MOTORISTA.valor) }

        SALARIO_MEDIO_MOTORISTA = Number(rotaParams.SALARIO_MEDIO_MOTORISTA.valor);
    }

    // Encargos sociais
    if (rotaParams.PERC_ENCARGO_SOCIAIS.result) {
        if (DEBUG) { console.debug("ENCARGOS_SOCIAIS", 1 + (rotaParams.PERC_ENCARGO_SOCIAIS.valor / 100)) }

        ENCARGOS_SOCIAIS = Number(1 + (rotaParams.PERC_ENCARGO_SOCIAIS.valor / 100));

        det.ENCARGOS_SOCIAIS = {
            "codigo_parametro": "ENCARGOS_SOCIAIS",
            "result": true,
            "valor": ENCARGOS_SOCIAIS
        };
    }

    if (COEFICIENTE_UTILIZACAO_MOTORISTA > 0 && SALARIO_MEDIO_MOTORISTA > 0 && ENCARGOS_SOCIAIS > 0) {
        if (DEBUG) { console.debug("CUSTO_COM_MOTORISTA", COEFICIENTE_UTILIZACAO_MOTORISTA * SALARIO_MEDIO_MOTORISTA * ENCARGOS_SOCIAIS) }

        CUSTO_COM_MOTORISTA = Number(COEFICIENTE_UTILIZACAO_MOTORISTA * SALARIO_MEDIO_MOTORISTA * ENCARGOS_SOCIAIS);
        det.CUSTO_COM_MOTORISTA = {
            "codigo_parametro": "CUSTO_COM_MOTORISTA",
            "result": true,
            "valor": CUSTO_COM_MOTORISTA
        };
    } else {
        det.CUSTO_COM_MOTORISTA = {
            "codigo_parametro": "CUSTO_COM_MOTORISTA",
            "result": false,
            "valor": "ERRO"
        };
    }

    // Agora calcularemos o custo com monitores (idêntico ao do motorista)
    // Custo Com Monitores = Coef Utilização * Salário Médio * Encargos Sociais
    let COEFICIENTE_UTILIZACAO_MONITOR = 0;
    let SALARIO_MEDIO_MONITORES = 0;

    // Coeficiente de utilização do motorista (|monitores| / |veiculos|)
    if (rotaParams.NUM_MONITORES.result && rotaParams.NUM_MONITORES.valor > 0) {
        if (DEBUG) { console.debug("COEFICIENTE_UTILIZACAO_MONITOR", rotaParams.NUM_MONITORES.valor / rotaParams.NUM_VEICULOS.valor) }

        COEFICIENTE_UTILIZACAO_MONITOR = Number(rotaParams.NUM_MONITORES.valor / rotaParams.NUM_VEICULOS.valor);

        det.COEFICIENTE_UTILIZACAO_MONITOR = {
            "codigo_parametro": "COEFICIENTE_UTILIZACAO_MONITOR",
            "result": true,
            "valor": COEFICIENTE_UTILIZACAO_MONITOR
        };
    } else if (rotaParams.NUM_MONITORES.result && rotaParams.NUM_MONITORES.valor == 0) {
        det.COEFICIENTE_UTILIZACAO_MONITOR = {
            "codigo_parametro": "COEFICIENTE_UTILIZACAO_MONITOR",
            "result": true,
            "valor": 0
        };
    }

    // Salário médio dos monitores
    if (rotaParams.SALARIO_MEDIO_MONITORES.result) {
        if (DEBUG) { console.debug("SALARIO_MEDIO_MONITORES", rotaParams.SALARIO_MEDIO_MONITORES.valor) }

        SALARIO_MEDIO_MONITORES = Number(rotaParams.SALARIO_MEDIO_MONITORES.valor);
    }

    if (rotaParams.NUM_MONITORES.valor > 0 && COEFICIENTE_UTILIZACAO_MONITOR > 0 && SALARIO_MEDIO_MONITORES > 0 && ENCARGOS_SOCIAIS > 0) {
        if (DEBUG) { console.debug("CUSTO_COM_MONITOR", COEFICIENTE_UTILIZACAO_MONITOR * SALARIO_MEDIO_MONITORES * ENCARGOS_SOCIAIS) }

        CUSTO_COM_MONITOR = Number(COEFICIENTE_UTILIZACAO_MONITOR * SALARIO_MEDIO_MONITORES * ENCARGOS_SOCIAIS);

        det.CUSTO_COM_MONITOR = {
            "codigo_parametro": "CUSTO_COM_MONITOR",
            "result": true,
            "valor": CUSTO_COM_MONITOR
        };
    } else {
        det.CUSTO_COM_MONITOR = {
            "codigo_parametro": "CUSTO_COM_MONITOR",
            "result": true,
            "valor": 0
        };
    }

    // Custo com pessoal de manutenção (depende do custo com motorista)
    if (CUSTO_COM_MOTORISTA > 0 && rotaParams.PERC_CFT_CUSTO_MANUTENCAO_RODO.result) {
        CFT_CUSTO_MANUTENCAO_RODO = Number(rotaParams.PERC_CFT_CUSTO_MANUTENCAO_RODO.valor / 100);
        CUSTO_COM_MANUTENCAO = Number(CUSTO_COM_MOTORISTA * CFT_CUSTO_MANUTENCAO_RODO);

        if (DEBUG) { console.debug("CFT_CUSTO_MANUTENCAO_RODO", CFT_CUSTO_MANUTENCAO_RODO) }
        if (DEBUG) { console.debug("CUSTO_COM_MANUTENCAO", CUSTO_COM_MANUTENCAO) }

        det.CFT_CUSTO_MANUTENCAO_RODO = {
            "codigo_parametro": "CFT_CUSTO_MANUTENCAO_RODO",
            "result": true,
            "valor": CFT_CUSTO_MANUTENCAO_RODO
        };

        det.CUSTO_COM_MANUTENCAO = {
            "codigo_parametro": "CUSTO_COM_MANUTENCAO",
            "result": true,
            "valor": CUSTO_COM_MANUTENCAO
        };

    } else {
        det.CUSTO_COM_MANUTENCAO = {
            "codigo_parametro": "CUSTO_COM_MANUTENCAO",
            "result": false,
            "valor": "Custo com motorista não especificado"
        };
    }

    // Valor final
    if ((CUSTO_COM_MOTORISTA > 0 && CUSTO_COM_MANUTENCAO > 0 && CUSTO_COM_MONITOR == 0 && rotaParams.NUM_MONITORES.valor == 0) ||
        (CUSTO_COM_MOTORISTA > 0 && CUSTO_COM_MANUTENCAO > 0 && CUSTO_COM_MONITOR > 0)) {
        if (DEBUG) { console.debug("CUSTO_COM_PESSOAL", CUSTO_COM_MOTORISTA + CUSTO_COM_MANUTENCAO + CUSTO_COM_MONITOR) }

        CUSTO_COM_PESSOAL = Number(CUSTO_COM_MOTORISTA + CUSTO_COM_MANUTENCAO + CUSTO_COM_MONITOR);

        det.CUSTO_COM_PESSOAL = {
            "codigo_parametro": "CUSTO_COM_PESSOAL",
            "result": true,
            "valor": CUSTO_COM_PESSOAL
        };
    } else {
        det.CUSTO_COM_PESSOAL = {
            "codigo_parametro": "CUSTO_COM_PESSOAL",
            "result": false,
            "valor": "ERRO"
        };

        custoValido = false;
    }

    return custoValido;
}

function calcularCustoAdministrativo() {
    let custoValido = true;

    let CUSTO_ADMINISTRATIVO = 0; // IPVA/12 MOTORISTA + CUSTO MONITOR + CUSTO MANUTENÇÃO

    if (rotaParams.NUM_VEICULOS.result && rotaParams.IPVA_FROTA.result &&
        rotaParams.DPVAT_FROTA.result && rotaParams.SRC_FROTA.result) {

        CUSTO_ADMINISTRATIVO = Number((rotaParams.IPVA_FROTA.valor + rotaParams.DPVAT_FROTA.valor + rotaParams.SRC_FROTA.valor) / 12)

        det.CUSTO_ADMINISTRATIVO = {
            "codigo_parametro": "CUSTO_ADMINISTRATIVO",
            "result": true,
            "valor": CUSTO_ADMINISTRATIVO
        };
    } else {
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoDepreciacao() {
    let custoValido = true;

    let CUSTO_DEPRECIACAO_FROTA = 0; // (COEFICIENTE_DEPRECIACAO_VEICULO * PREÇO_VEICULO_NOVO) / 12

    // Cálculo do coeficiente de depreciacao
    let COEFICIENTE_DEPRECIACAO_VEICULO = 0;
    let DIFF_VIDAUTIL_IDADE_VEICULO = 0;
    let SOMATORIO_VIDA_UTIL = 0;
    let VALOR_RESIDUAL = 0;

    if (det.PERC_RESIDUAL_RODO.result) {
        VALOR_RESIDUAL = Number(rotaParams.PERC_RESIDUAL_RODO.valor / 100);

        if (DEBUG) { console.debug("VALOR RESIDUAL", VALOR_RESIDUAL) }

        det.VALOR_RESIDUAL = {
            "codigo_parametro": "VALOR_RESIDUAL",
            "result": true,
            "valor": VALOR_RESIDUAL
        };

    }

    if (rotaParams.VIDA_UTIL_RODO.result && rotaParams.PERC_RESIDUAL_RODO.result && rotaParams.IDADE_VEICULO.result) {
        DIFF_VIDAUTIL_IDADE_VEICULO = Math.max(0, rotaParams.VIDA_UTIL_RODO.valor - rotaParams.IDADE_VEICULO.valor);
        SOMATORIO_VIDA_UTIL = ((1 + rotaParams.VIDA_UTIL_RODO.valor) * rotaParams.VIDA_UTIL_RODO.valor) / 2;
        COEFICIENTE_DEPRECIACAO_VEICULO = (DIFF_VIDAUTIL_IDADE_VEICULO / SOMATORIO_VIDA_UTIL) * (1 - VALOR_RESIDUAL);

        if (DEBUG) { console.debug("DIFF_VIDAUTIL_IDADE_VEICULO", DIFF_VIDAUTIL_IDADE_VEICULO) }
        if (DEBUG) { console.debug("SOMATORIO_VIDA_UTIL", SOMATORIO_VIDA_UTIL) }
        if (DEBUG) { console.debug("COEFICIENTE_DEPRECIACAO_VEICULO", COEFICIENTE_DEPRECIACAO_VEICULO) }

        det.COEFICIENTE_DEPRECIACAO_VEICULO = {
            "codigo_parametro": "COEFICIENTE_DEPRECIACAO_VEICULO",
            "result": true,
            "valor": COEFICIENTE_DEPRECIACAO_VEICULO
        };
        det.DIFF_VIDAUTIL_IDADE_VEICULO = {
            "codigo_parametro": "DIFF_VIDAUTIL_IDADE_VEICULO",
            "result": true,
            "valor": DIFF_VIDAUTIL_IDADE_VEICULO
        };
        det.SOMATORIO_VIDA_UTIL = {
            "codigo_parametro": "SOMATORIO_VIDA_UTIL",
            "result": true,
            "valor": SOMATORIO_VIDA_UTIL
        };
    } else {
        custoValido = false;
    }

    if (custoValido &&
        det.COEFICIENTE_DEPRECIACAO_VEICULO.result &&
        det.PRECO_MEDIO_VEICULOS.result &&
        det.NUM_VEICULOS.result) {
        CUSTO_DEPRECIACAO_FROTA = (COEFICIENTE_DEPRECIACAO_VEICULO * det.PRECO_MEDIO_VEICULOS.valor) / (12 * det.NUM_VEICULOS.valor);

        if (DEBUG) { console.debug("CUSTO_DEPRECIACAO_FROTA", CUSTO_DEPRECIACAO_FROTA) }
        det.CUSTO_DEPRECIACAO_FROTA = {
            "codigo_parametro": "CUSTO_DEPRECIACAO_FROTA",
            "result": true,
            "valor": CUSTO_DEPRECIACAO_FROTA
        };
    } else {
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoRemuneracao() {
    let custoValido = true;

    let CUSTO_REMUNERACAO_FROTA = 0; // (COEFICIENTE_REMUNERACAO_VEICULO * PREÇO_VEICULO_NOVO) / 12

    // Cálculo do coeficiente de depreciacao
    let COEFICIENTE_REMUNERACAO_VEICULO = 0;
    let DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO = 0;
    let SOMATORIO_VIDA_UTIL = 0;
    let VALOR_RESIDUAL = 0;
    let VALOR_TRC = 0;

    if (det.PERC_RESIDUAL_RODO.result && det.PERC_TRC.result) {
        VALOR_RESIDUAL = Number(rotaParams.PERC_RESIDUAL_RODO.valor / 100);
        VALOR_TRC = Number(rotaParams.PERC_TRC.valor / 100);

        if (DEBUG) { console.debug("VALOR RESIDUAL", VALOR_RESIDUAL) }
        if (DEBUG) { console.debug("VALOR_TRC", VALOR_TRC) }

        det.VALOR_RESIDUAL = {
            "codigo_parametro": "VALOR_RESIDUAL",
            "result": true,
            "valor": VALOR_RESIDUAL
        };

        det.VALOR_TRC = {
            "codigo_parametro": "VALOR_TRC",
            "result": true,
            "valor": VALOR_TRC
        };
    }

    if (rotaParams.VIDA_UTIL_RODO.result && rotaParams.PERC_RESIDUAL_RODO.result &&
        rotaParams.IDADE_VEICULO.result && rotaParams.PERC_TRC.result) {
        let diff = 0;
        for (let i = 2; i <= rotaParams.IDADE_VEICULO.valor; i++) {
            diff = diff + Math.max(0, rotaParams.VIDA_UTIL_RODO.valor - (i - 2));
        }

        DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO = diff;
        SOMATORIO_VIDA_UTIL = ((1 + rotaParams.VIDA_UTIL_RODO.valor) * rotaParams.VIDA_UTIL_RODO.valor) / 2;
        COEFICIENTE_REMUNERACAO_VEICULO = VALOR_TRC * (
            1 - ((DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO / SOMATORIO_VIDA_UTIL) * (1 - VALOR_RESIDUAL))
        )

        if (DEBUG) { console.debug("DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO", DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO) }
        if (DEBUG) { console.debug("SOMATORIO_VIDA_UTIL", SOMATORIO_VIDA_UTIL) }
        if (DEBUG) { console.debug("COEFICIENTE_REMUNERACAO_VEICULO", COEFICIENTE_REMUNERACAO_VEICULO) }

        det.COEFICIENTE_REMUNERACAO_VEICULO = {
            "codigo_parametro": "COEFICIENTE_REMUNERACAO_VEICULO",
            "result": true,
            "valor": COEFICIENTE_REMUNERACAO_VEICULO
        };
        det.DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO = {
            "codigo_parametro": "DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO",
            "result": true,
            "valor": DIFF_RESIDUAL_VIDAUTIL_IDADE_VEICULO
        };
    } else {
        custoValido = false;
    }

    if (custoValido) {
        CUSTO_REMUNERACAO_FROTA = (COEFICIENTE_REMUNERACAO_VEICULO * det.PRECO_MEDIO_VEICULOS.valor) / (12 * det.NUM_VEICULOS.valor);

        if (DEBUG) { console.debug("CUSTO_REMUNERACAO_FROTA", CUSTO_REMUNERACAO_FROTA) }
        det.CUSTO_REMUNERACAO_FROTA = {
            "codigo_parametro": "CUSTO_REMUNERACAO_FROTA",
            "result": true,
            "valor": CUSTO_REMUNERACAO_FROTA
        };
    } else {
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoComCombustivel() {
    let custoValido = true;

    let CUSTO_COM_COMBUSTIVEL = 0;

    if (rotaParams.CFT_CONSUMO_COMBUSTIVEL.result && rotaParams.PRECO_MEDIO_COMBUSTIVEIS.result) {
        CUSTO_COM_COMBUSTIVEL = (1 / rotaParams.CFT_CONSUMO_COMBUSTIVEL.valor) * rotaParams.PRECO_MEDIO_COMBUSTIVEIS.valor;

        if (DEBUG) { console.debug("CUSTO_COM_COMBUSTIVEL", CUSTO_COM_COMBUSTIVEL) }

        det.CUSTO_COM_COMBUSTIVEL = {
            "codigo_parametro": "CUSTO_COM_COMBUSTIVEL",
            "result": true,
            "valor": CUSTO_COM_COMBUSTIVEL
        };
    } else {
        if (DEBUG) { console.debug("CUSTO_COM_COMBUSTIVEL", 0) }
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoComOleoLubrificantes() {
    let custoValido = true;

    let CUSTO_OLEO_LUBRIFICANTES = 0;

    if (rotaParams.CFT_CONSUMO_OLEO_LUBRIFICANTE.result && rotaParams.PRECO_MEDIO_COMBUSTIVEIS.result) {
        CUSTO_OLEO_LUBRIFICANTES = rotaParams.CFT_CONSUMO_OLEO_LUBRIFICANTE.valor * rotaParams.PRECO_MEDIO_COMBUSTIVEIS.valor;

        if (DEBUG) { console.debug("CUSTO_OLEO_LUBRIFICANTES", CUSTO_OLEO_LUBRIFICANTES) }

        det.CUSTO_OLEO_LUBRIFICANTES = {
            "codigo_parametro": "CUSTO_OLEO_LUBRIFICANTES",
            "result": true,
            "valor": CUSTO_OLEO_LUBRIFICANTES
        };
    } else {
        if (DEBUG) { console.debug("CUSTO_OLEO_LUBRIFICANTES", 0) }
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoDeRodagem() {
    let custoValido = true;

    let CUSTO_DE_RODAGEM = 0;

    if (rotaParams.PRECO_MEDIO_PNEUS.result && rotaParams.NUMERO_PNEUS.result &&
        rotaParams.PRECO_MEDIO_RECAPAGEM.result && rotaParams.NUM_RECAPAGEM.result &&
        rotaParams.VIDA_UTIL_PNEU.result) {

        CUSTO_DE_RODAGEM = ((rotaParams.PRECO_MEDIO_PNEUS.valor * rotaParams.NUMERO_PNEUS.valor) +
            (rotaParams.PRECO_MEDIO_RECAPAGEM.valor * rotaParams.NUMERO_PNEUS.valor * rotaParams.NUM_RECAPAGEM.valor))
            / (rotaParams.VIDA_UTIL_PNEU.valor);

        if (DEBUG) { console.debug("CUSTO_DE_RODAGEM", CUSTO_DE_RODAGEM) }

        det.CUSTO_DE_RODAGEM = {
            "codigo_parametro": "CUSTO_DE_RODAGEM",
            "result": true,
            "valor": CUSTO_DE_RODAGEM
        };
    } else {
        if (DEBUG) { console.debug("CUSTO_DE_RODAGEM", 0) }
        custoValido = false;
    }

    return custoValido;
}

function calcularCustoPecasAcessorios() {
    let custoValido = true;

    let CUSTO_PECAS_ACESSORIOS = 0;

    if (rotaParams.CFT_CONSUMO_PECAS.result &&
        rotaParams.PRECO_MEDIO_VEICULOS.result &&
        rotaParams.KM_MENSAL_ROTA.result) {

        CUSTO_PECAS_ACESSORIOS = (rotaParams.CFT_CONSUMO_PECAS.valor * rotaParams.PRECO_MEDIO_VEICULOS.valor) /
            (rotaParams.KM_MENSAL_ROTA.valor * 20 * 2); // 20 dias * 2 (ida e volta)

        if (DEBUG) { console.debug("CUSTO_PECAS_ACESSORIOS", CUSTO_PECAS_ACESSORIOS) }

        det.CUSTO_PECAS_ACESSORIOS = {
            "codigo_parametro": "CUSTO_PECAS_ACESSORIOS",
            "result": true,
            "valor": CUSTO_PECAS_ACESSORIOS
        };
    } else {
        if (DEBUG) { console.debug("CUSTO_PECAS_ACESSORIOS", 0) }
        custoValido = false;
    }

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
        "CFT_CONSUMO_PECAS",
        "NUM_RECAPAGEM",
        "PERC_ENCARGO_SOCIAIS",
        "PERC_CFT_CUSTO_MANUTENCAO_RODO",
        "PERC_RESIDUAL_RODO",
        "PERC_TRC",
        "PRECO_MEDIO_COMBUSTIVEIS",
        "PRECO_MEDIO_PNEUS",
        "PRECO_MEDIO_RECAPAGEM",
        "VIDA_UTIL_RODO"
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
        "IPVA_FROTA",
        "DPVAT_FROTA",
        "SRC_FROTA",
        "CFT_CONSUMO_COMBUSTIVEL",
        "NUMERO_PNEUS",
        "VIDA_UTIL_PNEU",
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
        if (DEBUG) { console.debug("NUM_VEICULOS", 0) }
        if (DEBUG) { console.debug("IPVA_FROTA", 0) }
        if (DEBUG) { console.debug("DPVAT_FROTA", 0) }
        if (DEBUG) { console.debug("SRC_FROTA", 0) }
        if (DEBUG) { console.debug("PRECO_MEDIO_VEICULOS", 0) }
        if (DEBUG) { console.debug("CFT_CONSUMO_COMBUSTIVEL", 0) }
        if (DEBUG) { console.debug("NUMERO_PNEUS", 0) }
        if (DEBUG) { console.debug("VIDA_UTIL_PNEU", 0) }

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

            if (DEBUG) { console.debug("IPVA_FROTA", veiculoDetalhe?.placa, veiculoDetalhe?.ipva) }
            if (veiculoDetalhe.ipva && !(isNaN(veiculoDetalhe.ipva)) && Number(veiculoDetalhe.ipva) > 0) {
                params.IPVA_FROTA.valor = params.IPVA_FROTA.valor + Number(veiculoDetalhe.ipva);
                params.IPVA_FROTA.result = true;
            } else {
                custoValido = false;
            }

            if (DEBUG) { console.debug("DPVAT_FROTA", veiculoDetalhe?.placa, veiculoDetalhe?.dpvat) }
            if (veiculoDetalhe.dpvat && !(isNaN(veiculoDetalhe.dpvat)) && Number(veiculoDetalhe.dpvat) > 0) {
                params.DPVAT_FROTA.valor = params.DPVAT_FROTA.valor + Number(veiculoDetalhe.dpvat);
                params.DPVAT_FROTA.result = true;
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

            if (DEBUG) { console.debug("NUMERO_PNEUS", veiculoDetalhe?.placa, veiculoDetalhe?.numero_de_pneus) }
            if (veiculoDetalhe.numero_de_pneus && !(isNaN(veiculoDetalhe.numero_de_pneus)) && Number(veiculoDetalhe.numero_de_pneus) > 0) {
                params.NUMERO_PNEUS.valor = params.NUMERO_PNEUS.valor + Number(veiculoDetalhe.numero_de_pneus);
                params.NUMERO_PNEUS.result = true;
            } else {
                custoValido = false;
            }

            if (DEBUG) { console.debug("VIDA_UTIL_PNEU", veiculoDetalhe?.placa, veiculoDetalhe?.vida_util_do_pneu) }
            if (veiculoDetalhe.vida_util_do_pneu && !(isNaN(veiculoDetalhe.vida_util_do_pneu)) && Number(veiculoDetalhe.vida_util_do_pneu) > 0) {
                params.VIDA_UTIL_PNEU.valor = params.VIDA_UTIL_PNEU.valor + Number(veiculoDetalhe.vida_util_do_pneu);
                params.VIDA_UTIL_PNEU.result = true;
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

        if (params.NUMERO_PNEUS.result) {
            if (DEBUG) { console.debug("NUMERO_PNEUS", params.NUMERO_PNEUS.valor / params.NUM_VEICULOS.valor) }
            params.NUMERO_PNEUS.valor = params.NUMERO_PNEUS.valor / params.NUM_VEICULOS.valor;
        }

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
        KM_MENSAL_ROTA: {
            "codigo_parametro": "KM_MENSAL_ROTA",
            "modulo": "Rotas",
            "result": false,
            "valor": 0
        },
        NUM_ALUNOS: {
            "codigo_parametro": "NUM_ALUNOS",
            "modulo": "Monitores",
            "result": false,
            "valor": 0
        }
    };

    if (rota.km && !(isNaN(rota.km)) && Number(rota.km) > 0) {
        params.KM_MENSAL_ROTA.valor = Number(rota.km); // * 20 * 2; // km * 20 dias * 2 (ida e volta)
        params.KM_MENSAL_ROTA.result = true;
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
