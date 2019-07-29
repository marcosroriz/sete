function GetPrevisaoManutencaoForm() {
    var data = new Date();
    return {
        "id": _previsao_manutencao.id, //int
        "descricao": $("#pm-descricao").val(), //string
        "data_cadastro": data.getDate() + '/' + (data.getMonth() + 1) + '/' + data.getFullYear(),
        "data_prevista": $('#pm-data_prevista').val(), //string
        "status": 0,
        "veiculo_id": _veiculo.ID_VEICULO //int
    };
}

function ObterPrevisoesManutencao(veiculo_id) {
    return knex.select('*').where('veiculo_id', '=', veiculo_id).orderBy('data_prevista', 'desc').from('PrevisaoManutencao');
}

function ObterPrevisaoManutencao(id) {
    return knex.select('*').where('id', '=', id).from('PrevisaoManutencao');
}

function InserirPrevisaoManutencao(previsaoManutencao) {
    previsaoManutencao.id = undefined;
    const previsaoManutencao_save = [previsaoManutencao];
    knex('PrevisaoManutencao').insert(previsaoManutencao_save).then(() => { SuccessPrevisaoManutencao(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function AtualizarPrevisaoManutencao(previsaoManutencao) {
    setTimeout(() => {

        knex('PrevisaoManutencao')
            .where('id', '=', previsaoManutencao.id)
            .update(previsaoManutencao).then(() => { SuccessPrevisaoManutencao(); })
            .catch((err) => { console.log(err); throw err })
            .finally(() => {});
    }, 50);
}
//m37U8TV1et
function DeletePrevisaoManutencao(row, id) {
    knex('PrevisaoManutencao')
        .where('id', '=', id)
        .del().then(() => {
            DeleteRowPrevisaoManutencao(row);
        })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function GetStatus(model) {
    var data = new Date();
    return {
        "id": model.id, //int
        "descricao": model.descricao, //string
        "data_cadastro": model.data_cadastro,
        "data_prevista": model.data_prevista, //string
        "status": model.status,
        "veiculo_id": model.veiculo_id //int
    };
}