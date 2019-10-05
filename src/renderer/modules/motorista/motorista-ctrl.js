var _motoristas = [];
var _motorista = {};

(function($) { init(); })(jQuery);

//Buscar dados
function GetMotoristas() {
    ObterMotoristas().then(
            (rows) => { _motoristas = rows; })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            SetRow();
        });

}
//popular grid
function SetRow() {
    if (_motoristas.length < 1)
        return;
    _motoristas.forEach(c => AdicioarLinhaMotorista(c));
}
//montar html
function AdicioarLinhaMotorista(motorista) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td class="text-center">' + motorista.ID_MOTORISTA + '</td>';
    cols += '<td>' + motorista.NOME + '</td>';
    cols += '<td class="text-center">' + motorista.DATA_NASCIMENTO + '</td>';
    cols += '<td class="text-center">' + motorista.SEXO + '</td>';
    cols += '<td class="text-center">';
    cols += '<a href = "#" onclick="EditRowMotorista(' + motorista.ID_MOTORISTA + ')"> editar </a> | ';
    cols += '<a href="#" onclick="RemoveTableRowMotorista(this,' + motorista.ID_MOTORISTA + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#motorista-grid").append(newRow);
    return false;
};

//deletar motorista
function RemoveTableRowMotorista(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        DeleteMotorista(row, id);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    alert('Operação realiza com sucesso.');
}

//inserir motorista
function InsertMotoristaCTRL() {
    var motorista = GetMotoristaForm();
    InserirMotorista(motorista);
}

function SetEdit() {
    if (identity_object_id > 0)
        EditarMotorista(identity_object_id);
}

function SuccessMotorista() {
    $("#content").load("./motorista/motorista-view.html");
    alert('Operação realiza com sucesso.');
}

function EditRowMotorista(id) {
    identity_object_id = id;
    $("#content").load("./motorista/motorista-form.html");
}

//editar motorista
function EditarMotorista(id) {
    ObterMotorista(id).then(
            (rows) => {
                if (rows.length > 0)
                    _motorista = rows[0];
                console.log(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            PopularForm(_motorista);
        });
}

//popular form
function PopularForm(motorista) {
    $("#NACIONALIDADE").val(motorista.NACIONALIDADE);
    $("#DOC_IDENTIFICACAO").val(motorista.DOC_IDENTIFICACAO);
    $("#CPF").val(motorista.CPF);
    $("#ORGAO_EMISSOR").val(motorista.ORGAO_EMISSOR);

    $("#NOME").val(motorista.NOME);
    $("#DATA_NASCIMENTO").val(motorista.DATA_NASCIMENTO);
    $("#DEF_CAMINHAR").attr('checked', (motorista.DEF_CAMINHAR) ? true : false);
    $("#DEF_OUVIR").attr('checked', (motorista.DEF_OUVIR) ? true : false);
    $("#DEF_ENXERGAR").attr('checked', (motorista.DEF_ENXERGAR) ? true : false);
    $("#DEF_MENTAL").attr('checked', (motorista.DEF_MENTAL) ? true : false);

    $('input[value=' + motorista.SEXO + ']').attr('checked', 'checked');
    $('input[value=' + motorista.COR + ']').attr('checked', 'checked');
}

function init() {
    switch (identity_router) {

        case "view-motorista":
            GetMotoristas();
            break;

        case "form-motorista":
            SetEdit();
            break;
    }

    setTimeout(() => {
        identity_router = null;
        identity_object_id = 0;
    }, 500);
}