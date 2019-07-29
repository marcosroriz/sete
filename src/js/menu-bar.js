(function($) {
    VerificarNotificacoes();
    setInterval(() => {
        VerificarNotificacoes();
    }, 50000);
})(jQuery);

//popular notificao
function VerificarNotificacoes() {
    $("#menuNotificacoes").html("");
    var previsoes_manutencao = [];
    ObterPrevisoesManutencaoAbertasVencidas().then(
            (rows) => { previsoes_manutencao = rows; })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            previsoes_manutencao.forEach(c => AdicioarNotificao(c));
            $("#qtNotificacoes").text(previsoes_manutencao.length);
        });
}

//montar html
function AdicioarNotificao(previsaoManutencao) {
    var newRow = $("<li class='dropdown-item' >");
    var text = "Previsão de Manutenção:</br><b>" + previsaoManutencao.MODELO + "</b>";
    newRow.append(text);
    $("#menuNotificacoes").append(newRow);
    return false;
};

function ObterPrevisoesManutencaoAbertasVencidas() {
    var data = new Date();
    var mes = (data.getMonth() + 1);
    mes = (mes < 10) ? '0' + mes : mes;
    var dataAtual = data.getFullYear() + '-' + mes + '-' + data.getDate();
    var dataFim = (data.getFullYear() - 100) + '-' + mes + '-' + data.getDate();
    return knex.select('*').where('status', '=', 0)
        .whereBetween('data_prevista', [dataFim, dataAtual])
        .from('PrevisaoManutencao').innerJoin('Veiculo', 'Veiculo.ID_VEICULO', 'PrevisaoManutencao.veiculo_id');
}