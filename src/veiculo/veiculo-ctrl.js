var _veiculos = [];
var _veiculo = {};

(function($) { init(); })(jQuery);

//Buscar dados
function GetVeiculos() {
    ObterVeiculos().then(
            (rows) => { _veiculos = rows; })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            SetRow();
            console.log(_veiculos);
        });

}
//popular grid
function SetRow() {
    if (_veiculos.length < 1)
        return;
    _veiculos.forEach(c => AdicioarLinhaVeiculo(c));
}
//montar html
function AdicioarLinhaVeiculo(veiculo) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td class="text-center">' + veiculo.ID_VEICULO + '</td>';
    cols += '<td>' + veiculo.MODELO + '</td>';
    cols += '<td class="text-center">' + veiculo.PLACA + '</td>';
    cols += '<td class="text-center">' + veiculo.ANO + '</td>';
    cols += '<td class="text-center">' + veiculo.TIPO_TRANSPORTE + '</td>';
    cols += '<td class="text-center">' + veiculo.CAPACIDADE_ATUAL + '</td>';
    cols += '<td class="text-center">';
    cols += '<a href = "#" onclick="EditRowVeiculo(' + veiculo.ID_VEICULO + ')"> editar </a> | ';
    cols += '<a href="#" onclick="RemoveTableRowVeiculo(this,' + veiculo.ID_VEICULO + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#veiculo-grid").append(newRow);
    return false;
};

//deletar veiculo
function RemoveTableRowVeiculo(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        DeleteVeiculo(row, id);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    alert('Operação realiza com sucesso.');
}

//inserir veiculo
function InsertVeiculoCTRL() {
    var veiculo = GetVeiculoForm();
    InserirVeiculo(veiculo);
}

function init() {
    switch (identity_router) {

        case "view-veiculo":
            GetVeiculos();
            break;

        case "form-veiculo":
            $('.mask-placa').mask('AAA-0000');
            $('.mask-ano').mask('0000');
            $('.mask-number').mask('0#');
            $('.mask-fone').mask(telmaskbehaviour, teloptions);
            $(".mask-cpf").mask('000.000.000-00', { reverse: true });
            SetEdit();
            break;
    }

    setTimeout(() => {
        identity_router = null;
        identity_object_id = 0;
    }, 500);
}

function SetEdit() {
    if (identity_object_id > 0)
        EditarVeiculo(identity_object_id);
}

function SuccessVeiculo() {
    $("#content").load("./veiculo/veiculo-view.html");
    alert('Operação realiza com sucesso.');
}

function EditRowVeiculo(id) {
    identity_object_id = id;
    $("#content").load("./veiculo/veiculo-form.html");
}

//editar veiculo
function EditarVeiculo(id) {
    ObterVeiculo(id).then(
            (rows) => {
                if (rows.length > 0)
                    _veiculo = rows[0];
                console.log(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            PopularForm(_veiculo);
        });
}

//popular form
function PopularForm(veiculo) {
    $("#ID_VEICULO").val(veiculo.ID_VEICULO);
    $("#PLACA").val(veiculo.PLACA);
    $("#MODELO").val(veiculo.MODELO);
    $("#ANO").val(veiculo.ANO);
    $("#TIPO_TRANSPORTE").val(veiculo.TIPO_TRANSPORTE);
    $('input[value=' + veiculo.ORIGEM + ']').attr('checked', 'checked');
    $('input[value=' + veiculo.AQUISICAO + ']').attr('checked', 'checked');
    $("#POSSUI_GARAGEM").val(veiculo.POSSUI_GARAGEM);
    $("#KM_VEICULO").val(veiculo.KM_VEICULO);
    $("#CAPACIDADE_MAX").val(veiculo.KM_VEICULO);
    $("#CAPACIDADE_ATUAL").val(veiculo.CAPACIDADE_ATUAL);
}