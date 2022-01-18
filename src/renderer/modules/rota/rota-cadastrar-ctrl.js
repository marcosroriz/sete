// rota-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela rota-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de uma rota.
// Também é feito consultas nos dados de veículos, alunos e escolas para permitir
// vinculá-los com a rota.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
var idRota = "";
if (action == "editarRota") {
    idRota = estadoRota["ID"];
    estaEditando = true;
}

// Listas utilizadas para armazenar veículos, motoristas
// e posteriormente vincular com a rota sendo cadastrada
var listaDeVeiculos = new Map();
var listaDeFornecedores = new Map();
var listaDeEscolas = new Map();
var listaDeAlunos = new Map();

// Lista de escolas e alunos atendidos
var novasEscolas = new Set();
var novosAlunos = new Set();
var antEscolas = new Set();
var antAlunos = new Set();

// Boolean que indica se o veículo e motoristas foram definidos previamente para esta rota
var veiculoInformadoPrev = false;
var motoristaInformadoPrev = false;

// Filtros
$('#escolasNaoAtendidas').textFilter($('#filtroEscolasNaoAtendidas'));
$('#escolasAtentidas').textFilter($('#filtroEscolasAtendidas'));
$('#alunosNaoAtendidos').textFilter($('#filtroAlunosNaoAtendidos'));
$('#alunosAtendidos').textFilter($('#filtroAlunosAtendidos'));

// Máscaras
$('.horamask').mask('00:00');
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".datanasc").mask('00/00/0000');
$('.numbermask').mask('00000000');
$(".kmmask").mask("000000.00", { reverse: true });
$('.cnh').mask('000000000-00', { reverse: true });

var validadorFormulario = $("#wizardCadastrarRotaForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            tipoRota: {
                required: true
            },
            regnome: {
                required: true
            },
            regkm: {
                required: true
            },
            regtempo: {
                required: true
            },
            'temHorario[]': {
                required: true,
                minlength: 1
            },
        },
    }
});

$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarRotaForm'),
    ...{
        onTabShow: function (tab, navigation, index) {
            var $total = navigation.find('li').length;
            var $current = index + 1;
    
            var $wizard = navigation.closest('.card-wizard');
    
            // If it's the last tab then hide the last button and show the finish instead
            if ($current >= $total) {
                $($wizard).find('.btn-next').hide();
                $($wizard).find('.btn-finish').show();
            } else {
                $($wizard).find('.btn-next').show();
                $($wizard).find('.btn-finish').hide();
            }
    
            if (estadoRota) {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Rota salva com sucesso",
        text: "A rota " + $("#regnome").val() + " foi salva com sucesso. " +
              "Clique abaixo para retornar ao painel.",
        icon: "success",
        showCancelButton: false,
        confirmButtonClass: "btn-success",
        confirmButtonText: "Retornar ao painel",
        closeOnConfirm: false,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: true
    })
    .then(() => {
        navigateDashboard("./modules/rota/rota-listar-view.html");
    });
}

$("#salvarrota").on("click", () => {
    var rotasJSON = GetRotaFromForm();

    // Campos restantes
    var alunosAdicionar = new Set([...novosAlunos].filter(x => !antAlunos.has(x)));
    var alunosRemover = new Set([...antAlunos].filter(x => !novosAlunos.has(x)));
    var escolasAdicionar = new Set([...novasEscolas].filter(x => !antEscolas.has(x)));
    var escolasRemover = new Set([...antEscolas].filter(x => !novasEscolas.has(x)));

    var $valid = $('#wizardCadastrarRotaForm').valid();
    if (!$valid) {
        return false;
    } else {
        loadingFn("Processando dados da rota ...")

        var prePromessas = new Array();
        var idRota;

        alunosAdicionar.forEach((aID) => prePromessas.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", aID)));
        alunosRemover.forEach((aID) => prePromessas.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_ATENDE_ALUNO, "ID_ALUNO", aID)));

        if (estaEditando) {
            idRota = estadoRota["ID"]
            if (motoristaInformadoPrev) {
                prePromessas.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA, "ID_ROTA", idRota));
            }
            if (veiculoInformadoPrev) {
                prePromessas.push(dbRemoverDadoSimplesPromise(DB_TABLE_ROTA_POSSUI_VEICULO, "ID_ROTA", idRota));
            }
            escolasRemover.forEach((eID) => {
                prePromessas.push(dbRemoverDadoCompostoPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA, 
                                  "ID_ESCOLA", eID, "ID_ROTA", idRota));
            });
        }

        Promise.all(prePromessas)
        .then(() => {
            if (estaEditando) {
                return dbAtualizarPromise(DB_TABLE_ROTA, rotasJSON, estadoRota["ID"])
            } else {
                return dbInserirPromise(DB_TABLE_ROTA, rotasJSON);
            }
        }).then((res) => {
            if (idRota == "" || idRota == undefined || idRota == null) {
                idRota = res.id;
            }
            var promessasFinais = new Array();
            
            alunosAdicionar.forEach((aID) => promessasFinais.push(dbInserirPromise(DB_TABLE_ROTA_ATENDE_ALUNO, 
                                     { "ID_ROTA": idRota, "ID_ALUNO": aID })));
            escolasAdicionar.forEach((eID) => promessasFinais.push(dbInserirPromise(DB_TABLE_ROTA_PASSA_POR_ESCOLA,
                                     { "ID_ROTA": idRota, "ID_ESCOLA": eID })));

            var placaVeiculo = $("#tipoVeiculo").val();
            if (placaVeiculo != -1) {
                promessasFinais.push(dbInserirPromise(DB_TABLE_ROTA_POSSUI_VEICULO, 
                                    { "ID_ROTA": idRota, "ID_VEICULO": placaVeiculo }));
            }

            if ($("#tipoMotorista").val() != -1) {
                for (var mCPF of $("#tipoMotorista").val()) {
                    promessasFinais.push(dbInserirPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA,
                                        { "ID_ROTA": idRota, "CPF_MOTORISTA": mCPF }));
                }
            }
            return Promise.all(promessasFinais)
        })
        .then(() => completeForm())
        .catch((err) => errorFn("Erro ao processar dados da rota", err));
    }
});

function carregaVeiculoMotorista(veiculos, motoristas) {
    // Processando Veiculos
    if (veiculos.length != 0) {
        for (let veiculoRaw of veiculos) {
            let veiculoJSON = parseVeiculoDB(veiculoRaw);
            let vSTR = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`
            $('#tipoVeiculo').append(`<option value="${veiculoJSON["ID"]}">${vSTR}</option>`);
        }
        veiculoInformadoPrev = true;
    }
    $("#tipoVeiculo").val($("#tipoVeiculo option:first").val());

    // Processando Motoristas
    if (motoristas.length != 0) {
        for (let motoristaRaw of motoristas) {
            let motoristaJSON = parseMotoristaDB(motoristaRaw);
            $('#tipoMotorista').append(`<option value="${motoristaJSON["ID"]}">${motoristaJSON["NOME"]}</option>`);
        }
        $('#tipoMotorista').selectpicker({
            noneSelectedText: "Escolha pelo menos um motorista"
        });

        motoristaInformadoPrev = true;
    } else {
        $('#tipoMotorista').removeClass("selectpicker")
        $('#tipoMotorista').addClass("form-control")
        $('#tipoMotorista').removeAttr("multiple")
        $('#tipoMotorista').val(-1)
        $('#tipoMotorista').change()

        $(".marcarTodosLabel").hide()
        $("#tipoMotorista").parent().addClass("mt-2")
    }
}

restImpl.dbGETColecao(DB_TABLE_VEICULO)
.then((veiculos) => {
    // Processando Veiculos
    if (veiculos.length != 0) {
        for (let veiculoRaw of veiculos) {
            let veiculoJSON = parseVeiculoREST(veiculoRaw);
            let vSTR = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`
            $('#tipoVeiculo').append(`<option value="${veiculoJSON["ID"]}">${vSTR}</option>`);
        }
    }
    $("#tipoVeiculo").val($("#tipoVeiculo option:first").val());

    if (estaEditando) {
        console.log(DB_TABLE_ROTA, `/${idRota}/veiculos`)
        return restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}/veiculos`);
    } else {
        return false;
    }
}).then((rota) => {
    if (rota && $("#listarota option[value='" + rota.id_rota + "']").length > 0) {
        $("#listarota").val(rota.id_rota);

        // ID da rota anterior
        idRotaAnterior = rota.id_rota;

        // Veiculo anterior existe
        veiculoInformadoPrev = true;
    }
})
.catch((err) => {
    // console.log("Rota sem veículo", err);
})

restImpl.dbGETColecao(DB_TABLE_MOTORISTA)
.then((motoristas) => {
    // Processando Motoristas
    if (motoristas.length != 0) {
        for (let motoristaRaw of motoristas) {
            let motoristaJSON = parseMotoristaREST(motoristaRaw);
            $('#tipoMotorista').append(`<option value="${motoristaJSON["ID"]}">${motoristaJSON["NOME"]}</option>`);
        }
        $('#tipoMotorista').selectpicker({
            noneSelectedText: "Escolha pelo menos um motorista"
        });

        motoristaInformadoPrev = true;
    } else {
        $('#tipoMotorista').removeClass("selectpicker")
        $('#tipoMotorista').addClass("form-control")
        $('#tipoMotorista').removeAttr("multiple")
        $('#tipoMotorista').val(-1)
        $('#tipoMotorista').change()

        $(".marcarTodosLabel").hide()
        $("#tipoMotorista").parent().addClass("mt-2")
    }
})

// Adicionando os alunos na tela de rotas
restImpl.dbGETColecao(DB_TABLE_ESCOLA)
.then(async (alunos) => {
    // Processando alunos
    if (alunos.length != 0) {
        let alunosAtendidos = new Map();
        try {
            alunosAtendidos = await restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}/alunos`);
        } catch (error) {
            alunosAtendidos = new Map();
        }

        $("#totalNumAlunos").text(alunosAtendidos.size);
        
        alunos.sort((a, b) => a["nome"].localeCompare(b["nome"]))
        alunos.forEach(alunoRaw => {
            let alunoJSON = parseAlunoREST(alunoRaw);
            let alunoSTR = alunoJSON["NOME"]; // + " (" + alunoJSON["CPF"] + ")";
            let alunoID = alunoJSON["ID"];
            
            if (alunosAtendidos.has(alunoJSON["ID"])) {
                antAlunos.add(alunoID);
                novosAlunos.add(alunoID);
                $('#alunosAtendidos').append(`<option value="${alunoID}">${alunoSTR}</option>`);
            } else {
                $('#alunosNaoAtendidos').append(`<option value="${alunoID}">${alunoSTR}</option>`);
            }
        })
    }
})


// Adicionando os alunos na tela de rotas
restImpl.dbGETColecao(DB_TABLE_ALUNO)
.then(async (escolas) => {
    // Processando alunos
    if (escolas.length != 0) {
        debugger
        let escolasAtendidas = new Map();
        // try {
        //     escolasAtendidas = await restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}/escolas`);
        // } catch (error) {
        //     escolasAtendidas = new Map();
        // }

        $("#totalNumEscolas").text(escolasAtendidas.size);

        escolas.forEach(escolaRaw => {
            let escolaJSON = parseEscolaREST(escolaRaw);
            let escolaID = escolaJSON["ID"];
            if (escolasAtendidas.has(escolaJSON["ID"])) {
                antEscolas.add(escolaID);
                novasEscolas.add(escolaID);
                $('#escolasAtentidas').append(`<option value="${escolaID}">${escolaJSON["NOME"]}</option>`);
            } else {
                $('#escolasNaoAtendidas').append(`<option value="${escolaID}">${escolaJSON["NOME"]}</option>`);
            }
        })
    }
})

// var veiculosPromise = dbBuscarTodosDadosPromise(DB_TABLE_VEICULO);
// var motoristaPromise = dbBuscarTodosDadosPromise(DB_TABLE_MOTORISTA);
// var escolasPromise = dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA);
// var alunosPromise = dbBuscarTodosDadosPromise(DB_TABLE_ALUNO);

// if (estaEditando) {
//     var veiculoEspecificoPromise = dbBuscarDadosEspecificosPromise(DB_TABLE_ROTA_POSSUI_VEICULO,
//                                     "ID_ROTA", estadoRota["ID"]);
//     var motoristaEspecificoPromise = dbBuscarDadosEspecificosPromise(DB_TABLE_ROTA_DIRIGIDA_POR_MOTORISTA,
//                                     "ID_ROTA", estadoRota["ID"]);

//     Promise.all([veiculosPromise, motoristaPromise, escolasPromise, alunosPromise,
//                  veiculoEspecificoPromise, motoristaEspecificoPromise])
//         .then((res) => {
//             // Processa Veiculos e Motoristas
//             carregaVeiculoMotorista(res[0], res[1]);

//             // Seleciona veículos da rota
//             if (res[4].length != 0) {
//                 $("#tipoVeiculo").val(res[4][0]["ID_VEICULO"]);
//             }

//             // Seleciona motorista da rota
//             if (res[5].length != 0) {
//                 var mlist = new Array();
//                 res[5].forEach(m => mlist.push(m["CPF_MOTORISTA"]))
//                 $("#tipoMotorista").selectpicker('val', mlist)
//             }

//             PopulateRotaFromState(estadoRota);
//             $('.horamask').trigger('input');
//             $('.cep').trigger('input');
//             $(".cpfmask").trigger('input');
//             $(".telmask").trigger('input');
//             $(".datanasc").trigger('input');
//             $('.numbermask').trigger('input');
//             $(".kmmask").trigger('input');
//             $('.cnh').trigger('input');

//             let todosAlunos = convertListToMap(res[3])
//             let todasEscolas = convertListToMap(res[2])
//             let alunosAtendidos = convertListToMap(estadoRota["ALUNOS"], "ID_ALUNO");
//             let escolasAtendidas = convertListToMap(estadoRota["ESCOLAS"], "ID_ESCOLA");
            
//             $("#totalNumAlunos").text(alunosAtendidos.size);
//             $("#totalNumEscolas").text(escolasAtendidas.size);

//             todosAlunos.forEach(aluno => {
//                 let alunoSTR = aluno["NOME"] + " (" + aluno["DATA_NASCIMENTO"] + ")";
//                 let alunoID = aluno["ID"];
//                 if (alunosAtendidos.has(aluno["ID"])) {
//                     antAlunos.add(alunoID);
//                     novosAlunos.add(alunoID);
//                     $('#alunosAtendidos').append(`<option value="${alunoID}">${alunoSTR}</option>`);
//                 } else {
//                     $('#alunosNaoAtendidos').append(`<option value="${alunoID}">${alunoSTR}</option>`);
//                 }
//             })

//             todasEscolas.forEach(escola => {
//                 let escolaID = escola["ID"];
//                 if (escolasAtendidas.has(escola["ID"])) {
//                     antEscolas.add(escolaID);
//                     novasEscolas.add(escolaID);
//                     $('#escolasAtentidas').append(`<option value="${escolaID}">${escola["NOME"]}</option>`);
//                 } else {
//                     $('#escolasNaoAtendidas').append(`<option value="${escolaID}">${escola["NOME"]}</option>`);
//                 }
//             })

//             $("#cancelarAcao").on('click', () => {
//                 cancelDialog()
//                 .then((result) => {
//                     if (result.value) {
//                         navigateDashboard(lastPage);
//                     }
//                 })
//             });
//         })
// } else {
//     Promise.all([veiculosPromise, motoristaPromise, escolasPromise, alunosPromise])
//     .then((res) => {
//         // Processa Veiculos e Motoristas
//         carregaVeiculoMotorista(res[0], res[1]);

//         // Processando Escolas
//         var escolasResult = res[2];
//         for (let escolaRaw of escolasResult) {
//             listaDeEscolas.set(escolaRaw["ID"], escolaRaw);
//             $('#escolasNaoAtendidas').append(`<option value="${escolaRaw["ID"]}">${escolaRaw["NOME"]}</option>`);
//         }

//         // Processando Alunos
//         var alunosResult = res[3];
//         for (let alunoRaw of alunosResult) {
//             listaDeAlunos.set(alunoRaw["ID"], alunoRaw);
//             $('#alunosNaoAtendidos').append(`<option value="${alunoRaw["ID"]}">${alunoRaw["NOME"]} (${alunoRaw["DATA_NASCIMENTO"]})</option>`);
//         }
//     })
// }

$("#colocarEscola").on("click", () => {
    for (var eID of $("#escolasNaoAtendidas").val()) {
        var eNome = $(`#escolasNaoAtendidas option[value=${eID}]`).text();
        $(`#escolasNaoAtendidas option[value=${eID}]`).remove();
        $('#escolasAtentidas').append(`<option value="${eID}">${eNome}</option>`);
        novasEscolas.add(eID);
    }

    $("#totalNumEscolas").text($("#escolasAtentidas option").length);
});

$("#tirarEscola").on("click", () => {
    for (var eID of $("#escolasAtentidas").val()) {
        var eNome = $(`#escolasAtentidas option[value=${eID}]`).text();
        $(`#escolasAtentidas option[value=${eID}]`).remove();
        $('#escolasNaoAtendidas').append(`<option value="${eID}">${eNome}</option>`);
        novasEscolas.delete(eID);
    }

    $("#totalNumEscolas").text($("#escolasAtentidas option").length);
});

$("#colocarAluno").on("click", () => {
    for (var aID of $("#alunosNaoAtendidos").val()) {
        var aNome = $(`#alunosNaoAtendidos option[value=${aID}]`).text();
        $(`#alunosNaoAtendidos option[value=${aID}]`).remove();
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novosAlunos.add(aID);
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$("#tirarAluno").on("click", () => {
    for (var aID of $("#alunosAtendidos").val()) {
        var aNome = $(`#alunosAtendidos option[value=${aID}]`).text();
        $(`#alunosAtendidos option[value=${aID}]`).remove();
        $('#alunosNaoAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novosAlunos.delete(aID);
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$('#tipoMotorista').on("change", () => {
    $('#tipoMotorista').valid();
})

$('#tipoMotorista').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
    // Verificar se quer adicionar depois
    if (clickedIndex == 0) {
        // Ver se não tinha escolhido isso antes
        // previousValue = true se estava ativo antes
        if (!previousValue) {
            // Remover todas as opções escolhidas
            $('.selectpicker').val('-1');
            $('.selectpicker').selectpicker('render');
        } 
    } else {
        // Ver se tinha escolhido a opção de escolher depois
        var opcoes = $('.selectpicker').val();
        if (opcoes.includes("-1")) {
            opcoes = opcoes.filter(item => item != '-1')
        }
    
        $('.selectpicker').val(opcoes);
        $('.selectpicker').selectpicker('render');
    }

    $('.selectpicker').selectpicker('toggle');
});
