// frota-os-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela frota-os-cadastrar-view. 
// O mesmo serve tanto para cadastrar e alterar uma OS

// Lista de veiculo e fornecedor anterior
var antVeiculo;
var antFornecedor;

// Máscaras
$(".datamask").mask('00/00/0000');

var validadorFormulario = $("#wizardCadastrarOSForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            tipoServico: {
                required: true
            },
            regdata: {
                required: true,
                datavalida: true
            },
            tipoVeiculo: {
                required: true,
                mltselect: true
            },
            tipoFornecedor: {
                required: true,
                pickselect: true
            },
        },
    }
});

$('.card-wizard').bootstrapWizard({
    ...configWizardBasico('#wizardCadastrarOSForm'),
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
    
            if (action == "editarFornecedor") {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
    
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Ordem de serviço salva com sucesso",
        text: "Clique abaixo para retornar ao painel.",
        type: "success",
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
            $("a[name='frota/frota-os-view']").click();
        });
}

$("#salvaros").click(() => {
    var $valid = $('#wizardCadastrarOSForm').valid();
    var osJSON = GetOSFromForm();
    osJSON["termino"] = "N";

    if (!$valid) {
        return false;
    } else {
        if (action == "editarOS") {
            // Seta termino para valor atual
            osJSON["termino"] = estadoOS["TERMINO"]
            let osID = estadoOS["ID"]
            
            loadingFn("Atualizando a ordem de serviço ...")

            dbAtualizarPromise(DB_TABLE_ORDEM_DE_SERVICO, osJSON, osID)
            .then(() => dbAtualizaVersao())
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao atualizar a ordem de serviço.", err))
        } else {
            loadingFn("Cadastrando a ordem de serviço ...")

            restImpl.dbPOST(DB_TABLE_ORDEM_DE_SERVICO, "", osJSON)
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao salvar a ordem de serviço.", err))
        }
    }
});

restImpl.dbGETColecao(DB_TABLE_FORNECEDOR)
.then(res => processarFornecedores(res))
.then(() => restImpl.dbGETColecao(DB_TABLE_VEICULO))
.then(res => processarVeiculos(res))
.then(() => verificaEdicao())
.catch(err => errorFn("Erro ao carregar formulário de cadastro de OS", err))

// Processar fornecedores
var processarFornecedores = (res) => {
    for (let fornecedorRaw of res) {
        let fornecedorJSON = parseFornecedorREST(fornecedorRaw);
        let fSTR = `${fornecedorJSON["NOME"]} (${fornecedorJSON["CNPJ"]})`;
        $('#tipoFornecedor').append(`<option value="${fornecedorJSON["ID"]}">${fSTR}</option>`);
    }

    if (res.length == 0) {
        throw new Error("erro:fornecedor");
    }
}

// Processar veículos
var processarVeiculos = (res) => {
    for (let veiculoRaw of res) {
        let veiculoJSON = parseVeiculoREST(veiculoRaw);
        let vSTR = `${veiculoJSON["TIPO"]} (${veiculoJSON["MARCA"]} - ${veiculoJSON["PLACA"]})`;
        $('#tipoVeiculo').append(`<option value="${veiculoJSON["ID"]}">${vSTR}</option>`);
    }

    if (res.length == 0) {
        throw new Error("erro:veiculo");
    }
}

// Verifica se estamos editando o dado
var verificaEdicao = () => {
    if (action == "editarOS") {
        PopulateOSFromState(estadoOS);

        $("#cancelarAcao").click(() => {
            cancelDialog()
            .then((result) => {
                if (result.value) {
                    navigateDashboard(lastPage);
                }
            })
        });
    }
}