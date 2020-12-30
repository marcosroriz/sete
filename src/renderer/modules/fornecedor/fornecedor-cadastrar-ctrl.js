// fornecedor-cadastrar-ctrl.js
// Este arquivo contém o script de controle da tela foirnecedor-cadastrar-view. 
// O mesmo serve tanto para cadastrar, quanto para alterar os dados de um fornecedor.

// Verifica se é um cadastro novo ou é uma edição
var estaEditando = false;
if (action == "editarFornecedor") {
    estaEditando = true;
}

// Máscaras
$('.cep').mask("00000-000");
$(".telmask").mask(telmaskbehaviour, teloptions);
$(".cnpj").mask("00.000.000/0000-00", { reverse: true });

// Posição do Fornecedor
var posicaoFornecedor;

// Mapa
var mapa = novoMapaOpenLayers("mapCadastroFornecedor", cidadeLatitude, cidadeLongitude);
var vectorSource = mapa["vectorSource"];
var vectorLayer = mapa["vectorLayer"];
var mapaOL = mapa["map"];

// Ativa busca e camadas
mapa["activateGeocoder"]();
mapa["activateImageLayerSwitcher"]();

window.onresize = function () {
    setTimeout(function () {
        if (mapaViz != null) { mapaViz["map"].updateSize(); }
    }, 200);
}

// Plota fornecedor na tela
var plotaFornecedor = (lat, lon) => {
    posicaoFornecedor = gerarMarcador(lat, lon, "img/icones/fornecedor-marcador.png", 25, 50);
    vectorSource.addFeature(posicaoFornecedor);

    var translate = new ol.interaction.Translate({
        features: new ol.Collection([posicaoFornecedor])
    });

    translate.on('translateend', function (evt) {
        var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
        $("#reglat").val(lat.toPrecision(8));
        $("#reglon").val(lon.toPrecision(8));
    }, posicaoFornecedor);

    mapaOL.addInteraction(translate);
}

// Lida com click de usuário
mapaOL.on('singleclick', function (evt) {
    if (evt.originalEvent.path.length > 21) {
        return;
    }

    if (posicaoFornecedor != null) {
        try {
            vectorSource.removeFeature(posicaoFornecedor);
        } catch (err) {
            console.log(err);
        }
    }

    var [lon, lat] = ol.proj.toLonLat(evt.coordinate);
    $("#reglat").val(lat.toPrecision(8));
    $("#reglon").val(lon.toPrecision(8));
    $("#reglat").valid();
    $("#reglon").valid();

    plotaFornecedor(lat, lon)
});

var validadorFormulario = $("#wizardCadastrarFornecedorForm").validate({
    // Estrutura comum de validação dos nossos formulários (mostrar erros, mostrar OK)
    ...configMostrarResultadoValidacao(),
    ...{
        rules: {
            regnome: {
                required: true
            },
            regcnpj: {
                required: true,
                cpfcnpj: true
            },
            'temServico[]': {
                required: true,
                minlength: 1
            },
        },
    }
});

$('.card-wizard').bootstrapWizard({
    // Configura ações básica do wizard (ver função em common.js)
    ...configWizardBasico('#wizardCadastrarFornecedorForm'),
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

            if (estaEditando) {
                $($wizard).find('#cancelarAcao').show();
            } else {
                $($wizard).find('#cancelarAcao').hide();
            }
        }
    }
});

var completeForm = () => {
    Swal2.fire({
        title: "Fornecedor salvo com sucesso",
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
        $("a[name='fornecedor/fornecedor-listar-view']").click();
    });
}

$("#salvarfornecedor").on('click', () => {
    $("#regnome").valid();
    $("#regcnpj").valid();
    $("[name='temServico[]']").valid();

    var fornecedorJSON = GetFornecedorFromForm();

    var $valid = $('#wizardCadastrarFornecedorForm').valid();
    if (!$valid) {
        return false;
    } else {
        if (estaEditando) {
            loadingFn("Editando o fornecedor ...")

            dbAtualizarPromise(DB_TABLE_FORNECEDOR, fornecedorJSON, estadoFornecedor["ID"])
            .then(() => dbAtualizaVersao())
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao atualizar o fornecedor.", err))
        } else {
            loadingFn("Cadastrando o fornecedor ...")
                    
            dbInserirPromise(DB_TABLE_FORNECEDOR, fornecedorJSON)
            .then(() => dbAtualizaVersao())
            .then(() => completeForm())
            .catch((err) => errorFn("Erro ao salvar o fornecedor.", err))
        }
    }
});

if (estaEditando) {
    PopulateFornecedorFromState(estadoFornecedor);
    if (estadoFornecedor["LOC_LATITUDE"] != null && estadoFornecedor["LOC_LATITUDE"] != undefined && 
        estadoFornecedor["LOC_LONGITUDE"] != null && estadoFornecedor["LOC_LONGITUDE"] != undefined) {
        plotaFornecedor(estadoFornecedor["LOC_LATITUDE"], estadoFornecedor["LOC_LONGITUDE"]);

        if (!vectorSource.isEmpty()) {
            mapa["map"].getView().fit(vectorSource.getExtent());
            mapa["map"].updateSize();
        }
    }

    $('.cep').trigger('input');
    $(".telmask").trigger('input');
    $(".cnpj").trigger('input');

    $("#cancelarAcao").on('click', () => {
        cancelDialog()
        .then((result) => {
            if (result.value) {
                navigateDashboard(lastPage);
            }
        })
    });
}

action = "cadastrarFornecedor"