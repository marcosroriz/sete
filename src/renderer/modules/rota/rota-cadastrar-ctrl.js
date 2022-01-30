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

// Conjunto de escolas e alunos atendidos (agora e novo)
var novasEscolas = new Set();
var novosAlunos = new Set();
var antEscolas = new Set();
var antAlunos = new Set();

// Conjuntos que indicam os motoristas, monitores e veículos utilizados previamente pela rota
var antMotoristas = new Set();
var antMonitores = new Set();
var antVeiculos = new Set();
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
                $("#cancelarAcao").on('click', () => {
                    cancelDialog().then((result) => {
                        if (result.value) {
                            navigateDashboard(lastPage);
                        }
                    })
                });
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

// Popula dados caso esteja editando
if (estaEditando) {
    restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${estadoRota.ID}`)
        .then((rotaRaw) => {
            let detalhesDaRota = parseRotaDBREST(rotaRaw);
            Object.assign(estadoRota, detalhesDaRota);

            PopulateRotaFromState(estadoRota);
            $('.horamask').trigger('input');
            $('.cep').trigger('input');
            $(".cpfmask").trigger('input');
            $(".telmask").trigger('input');
            $(".datanasc").trigger('input');
            $('.numbermask').trigger('input');
            $(".kmmask").trigger('input');
            $('.cnh').trigger('input');
        })
}

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

async function preProcessarSalvarRota(alunosAdicionar, alunosRemover, escolasRemover, motoristasRemover, monitoresRemover, veiculosRemover) {
    // Remover o vínculo da rota dos aluno que iremos adicionar nesta rota
    for (const aID of alunosAdicionar) {
        try {
            await restImpl.dbDELETE(DB_TABLE_ALUNO, `/${aID}/rota`);
        } catch (error) {
            console.error(error);
        }
    };

    // Remover o vínculo da rota dos aluno que não irão mais utilizar essa rota
    for (const aID of alunosRemover) {
        try {
            await restImpl.dbDELETE(DB_TABLE_ALUNO, `/${aID}/rota`);
        } catch (error) {
            console.error(error);
        }
    };

    // Remove as escolas vinculadas a rota caso esteja editando
    if (estaEditando) {
        for (const eID of escolasRemover) {
            try {
                await restImpl.dbDELETEComParam(DB_TABLE_ESCOLA, `/${eID}/rota`, { rotas: [{ "id_rota": estadoRota["ID"] }] });
            } catch (error) {
                console.error(error);
            }
        };

        for (const mID of motoristasRemover) {
            try {
                await restImpl.dbDELETEComParam(DB_TABLE_ROTA, `/${idRota}/motoristas`, { "cpf_motorista": mID });
            } catch (error) {
                console.error(error);
            }
        };

        for (const mID of monitoresRemover) {
            try {
                await restImpl.dbDELETEComParam(DB_TABLE_MONITOR, `/${mID}/rota`, { "id_rota": idRota });
            } catch (error) {
                console.error(error);
            }
        };

        for (const vID of veiculosRemover) {
            try {
                if (vID != "-1" && vID != -1) {
                    await restImpl.dbDELETEComParam(DB_TABLE_ROTA, `/${idRota}/veiculos`, { "id_veiculo": vID });
                }
            } catch (error) {
                console.error(error);
            }
        }
    }
}

async function posProcessamentoSalvarRota(idRota, alunosAdicionar, escolasAdicionar, motoristasAdicionar, monitoresAdicionar, veiculosAdicionar) {
    // Criar vinculo entre alunos e a rota

    if (alunosAdicionar.size > 0) {
        let vinculoAlunoRotas = [];
        alunosAdicionar.forEach((aID) => vinculoAlunoRotas.push({ "id_aluno": aID }))
        try {
            let resp = await restImpl.dbPOST(DB_TABLE_ROTA, `/${idRota}/alunos`, {
                "alunos": vinculoAlunoRotas
            });
            console.log(resp);
        } catch (error) {
            console.error(error);
        }

    }

    if (escolasAdicionar.size > 0) {
        let vinculoAlunosEscolas = [];

        escolasAdicionar.forEach((eID) => vinculoAlunosEscolas.push({ "id_escola": eID }));
        try {
            debugger
            let resp = await restImpl.dbPOST(DB_TABLE_ROTA, `/${idRota}/escolas`, {
                "escolas": vinculoAlunosEscolas
            });
            console.log(resp);
        } catch (error) {
            console.error(error);
        }

    }

    if (veiculosAdicionar.size > 0) {
        for (var vID of veiculosAdicionar) {
            if (vID != "-1" && vID != "-1") {
                try {
                    await restImpl.dbPOST(DB_TABLE_ROTA, `/${idRota}/veiculos`, {
                        "id_veiculo": vID
                    })

                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    if ($("#tipoMotorista").val() != -1) {
        if (motoristasAdicionar.size > 0) {
            for (var vID of motoristasAdicionar) {
                try {
                    await restImpl.dbPOST(DB_TABLE_ROTA, `/${idRota}/motoristas`, {
                        "cpf_motorista": vID
                    })
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }

    if ($("#tipoMonitor").val() != -1) {
        if (monitoresAdicionar.size > 0) {
            for (var vID of monitoresAdicionar) {
                try {
                    await restImpl.dbPOST(DB_TABLE_MONITOR, `/${vID}/rota`, {
                        "id_rota": idRota
                    })
                } catch (error) {
                    console.error(error);
                }
            }
        }
    }
    completeForm()
}

$("#salvarrota").on("click", async () => {
    var rotasJSON = GetRotaFromForm();

    // Campos restantes
    var alunosAdicionar = new Set([...novosAlunos].filter(x => !antAlunos.has(x)));
    var alunosRemover = new Set([...antAlunos].filter(x => !novosAlunos.has(x)));
    var escolasAdicionar = new Set([...novasEscolas].filter(x => !antEscolas.has(x)));
    var escolasRemover = new Set([...antEscolas].filter(x => !novasEscolas.has(x)));

    var novosMotoristas = new Set($("#tipoMotorista").val());
    var motoristasAdicionar = new Set([...novosMotoristas].filter(x => !antMotoristas.has(x)));
    var motoristasRemover = new Set([...antMotoristas].filter(x => !novosMotoristas.has(x)))

    var novosMonitores = new Set($("#tipoMonitor").val());
    var monitoresAdicionar = new Set([...novosMonitores].filter(x => !antMonitores.has(x)));
    var monitoresRemover = new Set([...antMonitores].filter(x => !novosMonitores.has(x)))

    var novosVeiculos = new Set([$("#tipoVeiculo").val()]);
    var veiculosAdicionar = new Set([...novosVeiculos].filter(x => !antVeiculos.has(x)));
    var veiculosRemover = new Set([...antVeiculos].filter(x => !novosVeiculos.has(x)))

    debugger 
    var $valid = $('#wizardCadastrarRotaForm').valid();
    if (!$valid) {
        return false;
    } else {
        loadingFn("Processando dados da rota ...")

        try {
            await preProcessarSalvarRota(alunosAdicionar, alunosRemover, escolasRemover, motoristasRemover, monitoresRemover, veiculosRemover);

            // Faz a alteração nos dados da rota (caso esteja editando = PUT, caso contrário = POST)
            if (estaEditando) {
                idRota = estadoRota.ID;
                console.log("Atualizando Rota com:", rotasJSON)
                await restImpl.dbPUT(DB_TABLE_ROTA, `/${idRota}`, rotasJSON);
            } else {
                console.log("Inserindo Rota com:", rotasJSON);
                let resp = await restImpl.dbPOST(DB_TABLE_ROTA, "", rotasJSON);
                idRota = resp?.data?.messages?.id;
            }

            if (idRota == null || idRota == "") {
                throw "IDROTA É NULO";
            } else {
                posProcessamentoSalvarRota(idRota, alunosAdicionar, escolasAdicionar, motoristasAdicionar, monitoresAdicionar, veiculosAdicionar)
            }
        } catch (error) {
            console.log("Error")
        } finally {
            Swal2.close();
        }

    }
})

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
            return restImpl.dbGETEntidade(DB_TABLE_ROTA, `/${idRota}/veiculos`);
        } else {
            return false;
        }
    }).then((veiculo) => {
        if (veiculo && $("#tipoVeiculo option[value='" + veiculo?.id_veiculo + "']").length > 0) {
            $("#tipoVeiculo").val(veiculo.id_veiculo);
            antVeiculos.add(String(veiculo.id_veiculo));
        }
    })
    .catch((err) => {
        console.error(err);
    })

restImpl.dbGETColecao(DB_TABLE_MOTORISTA)
    .then((motoristas) => {
        // Processando Motoristas
        if (motoristas.length != 0) {
            motoristas.sort((a, b) => a["nome"].localeCompare(b["nome"]))
            for (let motoristaRaw of motoristas) {
                let motoristaJSON = parseMotoristaREST(motoristaRaw);
                $('#tipoMotorista').append(`<option value="${motoristaJSON["ID"]}">${motoristaJSON["NOME"]}</option>`);
            }
            $('#tipoMotorista').selectpicker({
                noneSelectedText: "Escolha pelo menos um motorista"
            });
        } else {
            $('#tipoMotorista').removeClass("selectpicker");
            $('#tipoMotorista').addClass("form-control");
            $('#tipoMotorista').removeAttr("multiple");
            $('#tipoMotorista').val(-1);
            $('#tipoMotorista').trigger();

            $(".marcarTodosMotoristasLabel").hide();
            $("#tipoMotorista").parent().addClass("mt-2");
        }

        if (estaEditando) {
            return restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/motoristas`);
        } else {
            return false;
        }
    }).then((motoristas) => {
        if (motoristas?.length > 0) {
            let cpfMotoristas = [];
            motoristas.forEach(mon => {
                antMotoristas.add(mon["cpf_motorista"]);
                cpfMotoristas.push(mon["cpf_motorista"]);
            });
            $("#tipoMotorista").selectpicker('val', cpfMotoristas);
        }
    })
    .catch((err) => {
        console.error(err);
    })


restImpl.dbGETColecao(DB_TABLE_MONITOR)
    .then((monitores) => {
        // Processando Monitores
        if (monitores.length != 0) {
            monitores.sort((a, b) => a["nome"].localeCompare(b["nome"]))

            for (let monitorRaw of monitores) {
                $('#tipoMonitor').append(`<option value="${monitorRaw["cpf"]}">${monitorRaw["nome"]}</option>`);
            }
            $('#tipoMonitor').selectpicker({
                noneSelectedText: "Escolha pelo menos um monitor"
            });
        } else {
            $('#tipoMonitor').removeClass("selectpicker");
            $('#tipoMonitor').addClass("form-control");
            $('#tipoMonitor').removeAttr("multiple");
            $('#tipoMonitor').val(-1);
            $('#tipoMonitor').trigger();

            $(".marcarTodosMonitoresLabel").hide();
            $("#tipoMonitor").parent().addClass("mt-2");
        }

        if (estaEditando) {
            return restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/monitores`);
        } else {
            return false;
        }
    }).then((monitores) => {
        if (monitores?.length > 0) {
            let cpfMonitores = [];
            monitores.forEach(mon => {
                antMonitores.add(mon["cpf_monitor"]);
                cpfMonitores.push(mon["cpf_monitor"]);
            });
            $("#tipoMonitor").selectpicker('val', cpfMonitores)
        }
    })
    .catch((err) => {
        console.error(err);
    })

// Adicionando os alunos na tela de rotas
restImpl.dbGETColecao(DB_TABLE_ALUNO)
    .then(async (alunos) => {
        // Processando alunos
        if (alunos.length != 0) {
            let alunosAtendidos = new Map();
            try {
                alunosAtendidos = await restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/alunos`);
                alunosAtendidos = convertListToMap(alunosAtendidos, "id_aluno")
            } catch (error) {
                alunosAtendidos = new Map();
            }

            $("#totalNumAlunos").text(alunosAtendidos.size);

            alunos.sort((a, b) => a["nome"].localeCompare(b["nome"]))
            alunos.forEach(alunoRaw => {
                let alunoJSON = parseAlunoREST(alunoRaw);
                let alunoSTR = alunoJSON["NOME"]; // + " (" + alunoJSON["CPF"] + ")";
                let alunoID = String(alunoJSON["ID"]);

                if (alunosAtendidos.has(alunoID)) {
                    antAlunos.add(alunoID);
                    novosAlunos.add(alunoID);
                    $('#alunosAtendidos').append(`<option value="${alunoID}">${alunoSTR}</option>`);
                } else {
                    $('#alunosNaoAtendidos').append(`<option value="${alunoID}">${alunoSTR}</option>`);
                }
            })
        }
    })


// Adicionando as escolas na tela de rotas
restImpl.dbGETColecao(DB_TABLE_ESCOLA)
    .then(async (escolas) => {
        // Processando alunos
        if (escolas.length != 0) {
            let escolasAtendidas = new Map();
            try {
                escolasAtendidas = await restImpl.dbGETColecao(DB_TABLE_ROTA, `/${idRota}/escolas`);
                debugger 
                escolasAtendidas = convertListToMap(escolasAtendidas, "id_escola")
            } catch (error) {
                escolasAtendidas = new Map();
            }

            $("#totalNumEscolas").text(escolasAtendidas.size);

            escolas.sort((a, b) => a["nome"].localeCompare(b["nome"]))
            escolas.forEach(escolaRaw => {
                let escolaJSON = parseEscolaREST(escolaRaw);
                let escolaID = String(escolaJSON["ID"]);
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


// Handlers para tirar e colocar alunos e escolas da lista de atendidos
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


$('#tipoMonitor').on("change", () => {
    $('#tipoMonitor').valid();
})

$('#tipoMonitor').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
    // Verificar se quer adicionar depois
    if (clickedIndex == 0) {
        // Ver se não tinha escolhido isso antes
        // previousValue = true se estava ativo antes
        if (!previousValue) {
            // Remover todas as opções escolhidas
            $('.monSelectPicker').val('-1');
            $('.monSelectPicker').selectpicker('render');
        }
    } else {
        // Ver se tinha escolhido a opção de escolher depois
        var opcoes = $('.monSelectPicker').val();
        if (opcoes.includes("-1")) {
            opcoes = opcoes.filter(item => item != '-1')
        }

        $('.monSelectPicker').val(opcoes);
        $('.monSelectPicker').selectpicker('render');
    }

    $('.monSelectPicker').selectpicker('toggle');
});
