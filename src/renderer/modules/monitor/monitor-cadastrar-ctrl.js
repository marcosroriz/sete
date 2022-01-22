// monitor-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela monitor-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um monitor.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarMonitor") {
    estaEditando = true;
}

// Conjuntos que indicam as rotas vinculadas ao monitor
var antRotas = new Set();

// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".datanasc").mask('00/00/0000');
$(".datavalida").mask('00/00/0000');
$('.money').mask('#.##0,00', { reverse: true });

// Boolean que indica se o veículo e motoristas foram definidos previamente para esta rota
var rotaInformadoPrev = false;

var validadorFormulario = $("#wizardCadastrarMonitorForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            regdata: {
                required: true,
                datanasc: true
            },
            regnome: {
                required: true,
                lettersonly: true
            },
            regcpf: {
                required: true,
                cpf: true
            },
            vinculo: {
                required: true,
            },
            modoSexo: {
                required: true
            },
            'temHorario[]': {
                required: true,
                minlength: 1
            },
        }
    }
});

$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarMonitorForm'),
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

            if (action == "editarMonitor") {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Monitor salvo com sucesso",
        text: "O monitor " + $("#regnome").val() + " foi salvo com sucesso. " +
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
            navigateDashboard("./modules/monitor/monitor-listar-view.html");
        });
}

$("#salvarMonitor").on('click', async () => {
    $("[name='temHorario[]']").valid();

    var monitorJSON = GetMonitorFromForm();
    var $valid = $('#wizardCadastrarMonitorForm').valid();
    if (!$valid) {
        return false;
    } else {
        // Verifica se já existe um motoriosta com o dado CPF
        let cpf = monitorJSON["cpf"];

        let existeCPF = false;
        try {
            let res = await restImpl.dbGETEntidade(DB_TABLE_MONITOR, `/${cpf}`);
            existeCPF = true;
            console.log(res);
        } catch (err) {
            existeCPF = false;
            console.log(err);
        }

        if (existeCPF && !estaEditando) {
            errorFn("Já existe um monitor com o CPF indicado. " +
                "Por favor digite outro CPF ou exclua este monitor primeiro.",
                '', "Ops... CPF duplicado")
        } else {
            if (estaEditando) {
                loadingFn("Editando o monitor ...")

                let cpf = estadoMonitor["ID"];
                try {
                    var novasRotas = new Set($("#tipoRota").val());
                    var rotasAdicionar = new Set([...novasRotas].filter(x => !antRotas.has(x)));
                    var rotasRemover = new Set([...antRotas].filter(x => !novasRotas.has(x)))

                    await restImpl.dbPUT(DB_TABLE_MONITOR, `/${cpf}`, monitorJSON);

                    for (var rID of rotasAdicionar) {
                        if (rID != "-1" && rID != -1) {
                            await restImpl.dbPOST(DB_TABLE_MONITOR, `/${cpf}/rota`, { "id_rota": rID });
                        }
                    }

                    for (var rID of rotasRemover) {
                        if (rID != "-1" && rID != -1) {
                            await restImpl.dbDELETEComParam(DB_TABLE_MONITOR, `/${cpf}/rota`, { "id_rota": rID });
                        }
                    }
                    completeForm()
                } catch (err) {
                    errorFn("Erro ao atualizar o monitor.", err);
                }
            } else {
                loadingFn("Cadastrando o monitor ...")

                try {
                    await restImpl.dbPOST(DB_TABLE_MONITOR, "", monitorJSON);
                    for (var rID of $("#tipoRota").val()) {
                        if (rID != "-1" && rID != -1) {
                            await restImpl.dbPOST(DB_TABLE_MONITOR, `/${cpf}/rota`, { "id_rota": rID });
                        }
                    }
                    completeForm()
                } catch (err) {
                    errorFn("Erro ao salvar o monitor.", err);
                }
            }
        }

    }
});

// Lida com a atribuição nas rotas
restImpl.dbGETColecao(DB_TABLE_ROTA)
    .then(rotas => preprocessarRotas(rotas))
    .then(() => verificaEdicao())

function preprocessarRotas(rotas) {
    // Processando Motoristas
    if (rotas.length != 0) {
        for (let rota of rotas) {
            $('#tipoRota').append(`<option value="${rota.id_rota}">${rota.nome}</option>`);
        }
        $('#tipoRota').selectpicker({
            noneSelectedText: "Escolha pelo menos uma rota"
        });

        rotaInformadoPrev = true;
    } else {
        $('#tipoRota').removeClass("selectpicker")
        $('#tipoRota').addClass("form-control")
        $('#tipoRota').removeAttr("multiple")
        $('#tipoRota').val(-1)
        $('#tipoRota').change()

        $(".marcarTodosLabel").hide()
        $("#tipoRota").parent().addClass("mt-2")
    }

    return Promise.resolve();
}

function verificaEdicao() {
    if (estaEditando) {
        restImpl.dbGETEntidade(DB_TABLE_MONITOR, `/${estadoMonitor.ID}`)
            .then((monitorRaw) => {
                if (monitorRaw) {
                    estadoMonitor = parseMonitorREST(monitorRaw);
                    PopulateMonitorFromState(estadoMonitor);

                    // Reativa máscaras
                    $('.cep').trigger('input');
                    $(".cpfmask").trigger('input');
                    $(".telmask").trigger('input');
                    $(".datanasc").trigger('input');
                    $("#regsalario").trigger('input');

                    $("#cancelarAcao").on('click', () => {
                        cancelDialog()
                            .then((result) => {
                                if (result.value) {
                                    navigateDashboard(lastPage);
                                }
                            })
                    });

                    return getRotasDoMonitor(estadoMonitor.ID)
                }
            }).then((rotasMonitor) => {
                if (rotasMonitor) {
                    let idRotas = [];
                    rotasMonitor.forEach(rota => {
                        antRotas.add(String(rota.id_rota));
                        idRotas.push(rota.id_rota);
                    });

                    $("#tipoRota").selectpicker('val', idRotas);
                }
            }).catch((err) => {
                errorFn("Erro ao editar o motorista", err)
            })
    }
}

$('#tipoRota').on("change", () => {
    $('#tipoRota').valid();
})

$('#tipoRota').on('changed.bs.select', function (e, clickedIndex, isSelected, previousValue) {
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

action = "cadastrarMonitor"
