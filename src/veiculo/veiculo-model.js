function GetVeiculoForm() {
    return {
        "ID_VEICULO": _veiculo.ID_VEICULO, //int
        "PLACA": $("#PLACA").val(), //string
        "MODELO": $("#MODELO").val(), //string
        "ANO": $("#ANO").val(), //int
        "TIPO_TRANSPORTE": $("#TIPO_TRANSPORTE").val(), //bool
        "ORIGEM": $('input[name=ORIGEM]:checked').val(), //int
        "AQUISICAO": $('input[name=AQUISICAO]:checked').val(), //int
        "POSSUI_GARAGEM": $("#POSSUI_GARAGEM").val(), //bool
        "KM_VEICULO": $("#KM_VEICULO").val(), //int
        //"ULTIMA_MANUTENCAO": $("#ULTIMA_MANUTENCAO").val(), //string
        "CAPACIDADE_MAX": $("#CAPACIDADE_MAX").val(), //int
        "CAPACIDADE_ATUAL": $("#CAPACIDADE_ATUAL").val() //int
    };
}

function ObterVeiculos() {
    return knex.select('*').from('Veiculo');
}

function ObterVeiculo(id) {
    return knex.select('*').where('ID_VEICULO', '=', id).from('Veiculo');
}

function InserirVeiculo(veiculo) {
    if (veiculo.ID_VEICULO > 0)
        AtualizarVeiculo(veiculo);
    else {
        veiculo.ID_VEICULO = undefined;
        const veiculos = [veiculo];
        knex('Veiculo').insert(veiculos).then(() => { SuccessVeiculo(); })
            .catch((err) => { console.log(err); throw err })
            .finally(() => {});
    }
}

function AtualizarVeiculo(veiculo) {
    knex('Veiculo')
        .where('ID_VEICULO', '=', veiculo.ID_VEICULO)
        .update(veiculo).then(() => { SuccessVeiculo(); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function DeleteVeiculo(row, id) {
    knex('Veiculo')
        .where('ID_VEICULO', '=', id)
        .del().then(() => {
            DeleteRow(row);
        })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}