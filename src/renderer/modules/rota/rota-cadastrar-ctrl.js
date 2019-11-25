// Listas utilizadas para armazenar veículos, motoristas
// e posteriormente vincular com a rota sendo cadastrada
var listaDeVeiculos = new Map();
var listaDeMotoristas = new Map();
var listaDeEscolas = new Map();
var listaDeAlunos = new Map();

// Lista de escolas e alunos atendidos
var novasEscolas = new Set();
var novosAlunos = new Set();
var antEscolas = new Set();
var antAlunos = new Set();

// Filtros
$('#escolasNaoAtendidas').textFilter($('#filtroEscolasNaoAtendidas'));
$('#escolasAtentidas').textFilter($('#filtroEscolasAtendidas'));
$('#alunosNaoAtendidos').textFilter($('#filtroAlunosNaoAtendidos'));
$('#alunosAtendidos').textFilter($('#filtroAlunosAtendidos'));

// Máscaras
$(".km").hide();
$(".tempo").hide();
$('.horamask').mask('00:00');
$('.cep').mask('00000-000');
$(".cpfmask").mask('000.000.000-00', { reverse: true });
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".datanasc").mask('00/00/0000');
$('.cnh').mask('000000000-00', { reverse: true });

var validadorFormulario = $("#wizardCadastrarRotaForm").validate({
    rules: {
        tipoRota: {
            required: true
        },
        regnome: {
            required: true
        },
        tipoVeiculo: {
            required: true,
            pickselect: true
        },
        tipoMotorista: {
            required: true,
            mltselect: true
        },
        'temHorario[]': {
            required: true,
            minlength: 1
        },
    },
    highlight: function (element) {
        $(element).closest('.form-group').removeClass('has-success').addClass('has-error');
        $(element).closest('.form-check').removeClass('has-success').addClass('has-error');
    },
    success: function (element) {
        $(element).closest('.form-group').removeClass('has-error').addClass('has-success');
        $(element).closest('.form-check').removeClass('has-error').addClass('has-success');
    },
    errorPlacement: function (error, element) {
        console.log(error);
        console.log(element);
        $(element).closest('.form-group').append(error).addClass('has-error');
    }
});

$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarRotaForm').valid();
        if (!$valid) {
            validadorFormulario.focusInvalid();
            return false;
        } else {
            window.scroll(0, 0);
        }
    },

    onTabClick: function (tab, navigation, index) {
        var $valid = $('#wizardCadastrarRotaForm').valid();
        if (!$valid) {
            return false;
        } else {
            window.scroll(0, 0);
            return true;
        }
    },

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

        if (action == "editarRota") {
            $($wizard).find('#cancelarAcao').show();
        } else {
            $($wizard).find('#cancelarAcao').hide();
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Rota salva com sucesso",
        text: "A rota " + $("#regnome").val() + " foi salva com sucesso. " +
            "Clique abaixo para retornar ao painel.",
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
        navigateDashboard("./modules/rota/rota-listar-view.html");
    });
}

$("#salvarrota").click(() => {
    var rotasJSON = GetRotaFromForm();

    // Campos restantes
    var alunosAdicionar  = new Set([...novosAlunos].filter(x => !antAlunos.has(x)));
    var alunosRemover    = new Set([...antAlunos].filter(x => !novosAlunos.has(x)));
    var escolasAdicionar = new Set([...novasEscolas].filter(x => !antEscolas.has(x)));
    var escolasRemover   = new Set([...antEscolas].filter(x => !novasEscolas.has(x)));

    var $valid = $('#wizardCadastrarRotaForm').valid();
    if (!$valid) {
        return false;
    } else {
        if (action == "editarRota") {

        } else {
            InserirPromise("Rotas", rotasJSON)
            .then((res) => {
                var idRota = res[0];
                var promiseArray = new Array();
                
                alunosAdicionar.forEach((aID) => 
                    promiseArray.push(InserirPromise("RotaAtendeAluno", { "ID_ROTA": idRota, "ID_ALUNO": aID })));
                escolasAdicionar.forEach((eID) => 
                    promiseArray.push(InserirPromise("RotaPassaPorEscolas", { "ID_ROTA": idRota, "ID_ESCOLA": eID })));
                alunosRemover.forEach((aID) => 
                    promiseArray.push(RemoverPromise("RotaAtendeAluno", "ID_ALUNO", aID )));
    
                Promise.all(promiseArray)
                .then(() => completeForm())
                .catch((err) => errorFn("Erro ao vincular rota com alunos e escolas", err));
            })
            .catch((err) => {
                errorFn("Erro ao salvar a rota!", err);
            });
        }
    }
});

if (action == "editarRota") {
    PopulateMotoristaFromState(estadoMotorista);
    $("#cancelarAcao").click(() => {
        Swal2.fire({
            title: 'Cancelar Edição?',
            text: "Se você cancelar nenhum alteração será feita nos dados do motorista.",
            type: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            cancelButtonText: "Voltar a editar",
            confirmButtonText: 'Sim, cancelar'
        }).then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
    });
}

var veiculosPromise = BuscarTodosDadosPromise("Veiculos");
var motoristaPromise = BuscarTodosDadosPromise("Motoristas");
var escolasPromise = ListarTodasAsEscolasPromise();
var alunosPromise = ListarTodosOsAlunosPromise();

Promise.all([veiculosPromise, motoristaPromise, escolasPromise, alunosPromise])
.then((res) => {
    // Processando Veiculos
    var veiculosResult = res[0];
    $('#tipoVeiculo').empty();
    for (let veiculoRaw of veiculosResult) {
        let veiculoJSON = parseVeiculoDB(veiculoRaw);
        listaDeVeiculos.set(veiculoJSON["ID_VEICULO"], veiculoJSON);

        let vSTR = `${veiculoJSON["TIPOSTR"]} (${veiculoJSON["PLACA"]})`
        $('#tipoVeiculo').append(`<option value="${veiculoJSON["ID_VEICULO"]}">${vSTR}</option>`);
    }

    // Processando Motoristas
    var motoristasResult = res[1];
    $('#tipoMotorista').empty();
    for (let motoristaRaw of motoristasResult) {
        let motoristaJSON = parseMotoristaDB(motoristaRaw);
        listaDeMotoristas.set(motoristaJSON["ID_MOTORISTA"], motoristaJSON);

        $('#tipoMotorista').append(`<option value="${motoristaJSON["ID_MOTORISTA"]}">${motoristaJSON["NOME"]}</option>`);
    }
    $('#tipoMotorista').selectpicker({
        noneSelectedText: "Escolha pelo menos um motorista"
    });

    // Processando Escolas
    var escolasResult = res[2];
    if (action != "editarRota") {
        for (let escolaRaw of escolasResult) {
            listaDeEscolas.set(escolaRaw["ID_ESCOLA"], escolaRaw);
            // antEscolas.add(parseInt(escolaRaw["ID_ESCOLA"]));
            // novasEscolas.add(parseInt(escolaRaw["ID_ESCOLA"]));
            $('#escolasNaoAtendidas').append(`<option value="${escolaRaw["ID_ESCOLA"]}">${escolaRaw["NOME"]}</option>`);
        }
    } 

    // Processando Alunos
    var alunosResult = res[3];
    if (action != "editarRota") {
        for (let alunoRaw of alunosResult) {
            listaDeAlunos.set(alunoRaw["ID_ALUNO"], alunoRaw);
            // antAlunos.add(parseInt(alunoRaw["ID_ALUNO"]));
            // novosAlunos.add(parseInt(alunoRaw["ID_ALUNO"]));
            $('#alunosNaoAtendidos').append(`<option value="${alunoRaw["ID_ALUNO"]}">${alunoRaw["NOME"]} (${alunoRaw["DATA_NASCIMENTO"]})</option>`);
        }
    } 
});

// Custom Triggers
$("input[name='tipoRota']").change((evt) => {
    var modalType = parseInt(evt.currentTarget.value);
    switch (modalType) {
        case 1:
            $(".tempo").hide();
            $(".km").show();
            break;
        case 2:
            $(".tempo").show();
            $(".km").hide();
            break;
        case 3:
            $(".tempo").show();
            $(".km").show();
            break;
        default:
            $(".tempo").hide();
            $(".km").show();

    }
})

$("#colocarEscola").click(() => {
    for (var eID of $("#escolasNaoAtendidas").val()) {
        var eNome = $(`#escolasNaoAtendidas option[value=${eID}]`).text();
        $(`option[value=${eID}]`).remove();
        $('#escolasAtentidas').append(`<option value="${eID}">${eNome}</option>`);
        novasEscolas.add(parseInt(eID));
    }

    $("#totalNumEscolas").text($("#escolasAtentidas option").length);
});

$("#tirarEscola").click(() => {
    for (var eID of $("#escolasAtentidas").val()) {
        var eNome = $(`#escolasAtentidas option[value=${eID}]`).text();
        $(`option[value=${eID}]`).remove();
        $('#escolasNaoAtendidas').append(`<option value="${eID}">${eNome}</option>`);
        novasEscolas.delete(parseInt(eID));
    }

    $("#totalNumEscolas").text($("#escolasAtentidas option").length);
});

$("#colocarAluno").click(() => {
    for (var aID of $("#alunosNaoAtendidos").val()) {
        var aNome = $(`#alunosNaoAtendidos option[value=${aID}]`).text();
        $(`option[value=${aID}]`).remove();
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novosAlunos.add(parseInt(aID));
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$("#tirarAluno").click(() => {
    for (var aID of $("#alunosAtendidos").val()) {
        var aNome = $(`#alunosAtendidos option[value=${aID}]`).text();
        $(`option[value=${aID}]`).remove();
        $('#alunosNaoAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novosAlunos.delete(parseInt(aID));
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$('#tipoMotorista').change(() => {
    $('#tipoMotorista').valid();
})
