var _previsoes_manutencao = [];
var _previsao_manutencao = {};

function CarregarPrevisoesManutencao(veiculo_id) {
    ObterPrevisoesManutencao(veiculo_id).then(
            (rows) => { _previsoes_manutencao = rows; })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            SetRowPrevisaoManutencao();
        });
}

//popular grid
function SetRowPrevisaoManutencao() {
    if (_previsoes_manutencao.length < 1)
        return;
    _previsoes_manutencao.forEach(c => { $("#tbodyManutencao").remove(); });
    setTimeout(() => {
        _previsoes_manutencao.forEach(c => AdicioarLinhaPrevisaoManutencao(c));
    }, 50);
}

function AlterarStatus(id) {
    ObterPrevisaoManutencao(id).then(
            (rows) => {
                _previsao_manutencao = rows[0];
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            _previsao_manutencao.status = $('#select-status').val();
            setTimeout(() => {
                AtualizarPrevisaoManutencao(_previsao_manutencao);
            }, 50);
        });
}

//montar html
function AdicioarLinhaPrevisaoManutencao(previsaoManutencao) {
    var newRow = $("<tbody id='tbodyManutencao'>");
    var cols = "<tr>";
    cols += '<td class="text-left">' + previsaoManutencao.descricao + '</td>';
    cols += '<td class="text-center">' + previsaoManutencao.data_cadastro + '</td>';
    cols += '<td class="text-center">' + previsaoManutencao.data_prevista + '</td>';
    cols += '<td class="text-center">'
    cols += '<select class="form-control" id="select-status" onchange="AlterarStatus(' + previsaoManutencao.id + ')">';
    cols += '<option value="0" ' + (previsaoManutencao.status < 1 ? 'selected' : '') + '>Aberto</option>';
    cols += '<option value="1" ' + (previsaoManutencao.status >= 1 ? 'selected' : '') + '>Fechado</option>';
    cols += '</select></td>';
    cols += '<td class="text-center">';
    cols += '<a href = "#" onclick="EditRowPrevisaoManutencao(' + previsaoManutencao.id + ')"> status </a> | ';
    cols += '<a href="#" onclick="RemoveTableRowPrevisaoManutencao(this,' + previsaoManutencao.id + ')">excluir</a >';
    cols += '</td></tr>';
    newRow.append(cols);
    $("#list-table-manutencao").append(newRow);
    $('')
    return false;
};

//deletar veiculo
function RemoveTableRowPrevisaoManutencao(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        DeletePrevisaoManutencao(row, id);
};

function DeleteRowPrevisaoManutencao(row) {
    var tr = $(row).closest('tbody');
    tr.fadeOut(400, function() {
        tr.remove();
    });
}

//inserir previsaoManutencao
function InsertPrevisaoManutencaoCTRL() {
    var previsaoManutencao = GetPrevisaoManutencaoForm();
    InserirPrevisaoManutencao(previsaoManutencao);
}

function SuccessPrevisaoManutencao() {
    alert('Operação realiza com sucesso.');
    CarregarPrevisoesManutencao(_veiculo.ID_VEICULO);
    $("#pm-descricao").val("");
    $('#pm-data_prevista').val("");
}