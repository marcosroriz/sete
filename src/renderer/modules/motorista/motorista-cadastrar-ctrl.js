// motorista-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela motorista-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um motorista.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarMotorista") {
    estaEditando = true;
}

// Máscaras
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".datanasc").mask('00/00/0000');
$(".datavalida").mask('00/00/0000');
$('.cnh').mask('000000000-00', { reverse: true });
$('.money').mask('#.##0,00', {reverse: true});

var validadorFormulario = $("#wizardCadastrarMotoristaForm").validate({
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
            modoSexo: {
                required: true
            },
            regcnh: {
                required: true,
                cnh: true
            },
            // regcnhvalidade: {
            //     datavalida: true,
            // },
            'habilitado[]': {
                required: true,
                minlength: 1
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
    ...configWizardBasico('#wizardCadastrarMotoristaForm'),
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

            if (action == "editarMotorista") {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Motorista salvo com sucesso",
        text: "O motorista " + $("#regnome").val() + " foi salvo com sucesso. " +
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
        navigateDashboard("./modules/motorista/motorista-listar-view.html");
    });
}

$("#salvarmotorista").on('click', async () => {
    $("[name='regcnh']").valid();
    $("[name='habilitado[]']").valid();
    $("[name='temHorario[]']").valid();
    
    var motoristaJSON = GetMotoristaFromForm();

    var $valid = $('#wizardCadastrarMotoristaForm').valid();
    if (!$valid) {
        return false;
    } else {
        // Verifica se já existe um motoriosta com o dado CPF
        let cpf = motoristaJSON["cpf"];

        loadingFn("Cadastrando o motorista ...");
        let existeCPF = false;
        try {
            let res = await restImpl.dbGETEntidade(DB_TABLE_MOTORISTA, `/${cpf}`);
            debugger
            existeCPF = true;
            console.log(res);
        } catch (err) {
            debugger
            existeCPF = false;
            console.log(err);
        }
        

        if (existeCPF && !estaEditando) {
            errorFn("Já existe um motorista com o CPF indicado. " +
                    "Por favor digite outro CPF ou exclua este motorista primeiro.",
                    '', "Ops... CPF duplicado")
        } else {
            if ($("#regdocpessoaispdf")[0].files.length != 0) {
                var oriFile = $("#regdocpessoaispdf")[0].files[0].path;
                var dstFile = path.join(userDataDir, $("#regcpf").val() + ".pdf");
                motoristaJSON["ARQUIVO_DOCPESSOAIS_ANEXO"] = dstFile;
    
                fs.copySync(oriFile, dstFile);
                console.log("Salvando arquivo do motorista", dstFile);
            }

            if (estaEditando) {
                loadingFn("Editando o motorista ...")

                let idMotorista = estadoMotorista["ID"];
                restImpl.dbPUT(DB_TABLE_MOTORISTA, "/" + idMotorista, escolaJSON)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao atualizar o motorista.", err))
            } else {
                loadingFn("Cadastrando o motorista ...")
                
                restImpl.dbPOST(DB_TABLE_MOTORISTA, "", motoristaJSON)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao salvar o motorista.", err))
            }
        }

    }
});

if (estaEditando) {
    PopulateMotoristaFromState(estadoMotorista); 
    
    // Reativa máscaras
    $('.cep').trigger('input');
    $(".cpfmask").trigger('input');
    $(".telmask").trigger('input');
    $(".datanasc").trigger('input');
    $('.cnh').trigger('input');

    $("#cancelarAcao").on('click', () => {
        cancelDialog()
        .then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
    });
}

action = "cadastrarMotorista"