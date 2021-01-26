function SuccessProxy(arDadosProxy) {
    Swal2.fire({
        title: "Configuração de proxy salva com sucesso!",
        text: "A aplicação será encerrada para que as configurações entre em vigor.",
        icon: "success",
        type: "success",
        button: "Fechar"
    }).then(function () {
        ipcRenderer.send('start:proxy', arDadosProxy);
    });
}


function AtualizarProxy(checado, endereco, porta) {

    var arDadosProxy = [];
    if (checado) {
        arDadosProxy = {
            'is_usa_proxy': 1,
            'servidor': endereco,
            'porta': porta
        };
    } else {
        arDadosProxy = {
            'is_usa_proxy': 0,
            'servidor': null,
            'porta': null
        };
    }

    this.ObterConfiguracao().then(function (arProxyConfigurado) {
        if (arProxyConfigurado[0].is_usa_proxy === arDadosProxy.is_usa_proxy && arDadosProxy.is_usa_proxy === 0) {
            Swal2.fire({
                title: "Atenção!",
                text: "Não identificado alteração na configuração. Altere a configuração e clique em salvar novamente!",
                icon: "warning",
                type: "warning",
                button: "Fechar"
            })
        } else {
            knex('config_proxy')
                .where('parametro', '=', 'proxy')
                .update(arDadosProxy).then(() => { SuccessProxy(arDadosProxy); })
                .catch((err) => { console.log(err); throw err })
                .finally(() => { });
        }
    })
}

function ObterConfiguracao() {
    return knex.select('*').from('config_proxy').where("parametro", 'proxy');
}
