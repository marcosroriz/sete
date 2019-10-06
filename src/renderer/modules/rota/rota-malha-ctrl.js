// Lista de Imports
var fs = require("fs-extra");

$("#baixarMalha").click(() => {
    dialog.showSaveDialog(win, {
        title: "Salvar Malha OSM",
        buttonLabel: "Salvar Malha",
        filters: [
            { name: "OSM", extensions: ["osm"] }
        ]
    }, (arqDestino) => {
        console.log(arqDestino);
        let arqOrigem = path.join(userDataDir, "malha.osm");
        try {
            fs.copySync(arqOrigem, arqDestino)
            console.log('success!')
        } catch (err) {
            console.error(err)
        }
    });
});

$('#rota-malha-salvarNovaMalha').click(() => {
    swal({
        title: "Processando a malha...",
        text: "Espere um minutinho...",
        type: "warning",
        imageUrl: "img/icones/processing.gif",
        icon: "img/icones/processing.gif",
        buttons: false,
        showSpinner: true,
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false
    });

    let osmFilePath = $("#novaMalhaOSM")[0].files[0].path;
    ipcRenderer.send('start:malha-update', osmFilePath);
});

$('#lol').click(() => {
    console.log("lol");
});

// Wizard
$('.card-wizard').bootstrapWizard({
    'tabClass': 'nav nav-pills',
    'nextSelector': '.btn-next',
    'previousSelector': '.btn-back',

    onNext: function (tab, navigation, index) {
        window.scroll(0, 0);
        return true;
    },

    onTabClick: function (tab, navigation, index) {
        window.scroll(0, 0);
        return true;
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
    }
});