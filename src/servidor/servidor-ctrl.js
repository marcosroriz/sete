var _servidors = [];
var _servidor = {};

(function($) { init(); })(jQuery);

//Buscar dados
function GetServidors() {
    ObterServidores().then(
            (rows) => { _servidors = rows; })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            SetRow();
            console.log(_servidors);
        });

}
//popular grid
function SetRow() {
    if (_servidors.length < 1)
        return;
    _servidors.forEach(c => AdicioarLinhaServidor(c));
}
//montar html
function AdicioarLinhaServidor(servidor) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td class="text-center">' + servidor.ID_SERVIDOR + '</td>';
    cols += '<td>' + servidor.NOME + '</td>';
    cols += '<td class="text-center">' + servidor.ENDERECO + '</td>';
    cols += '<td class="text-center">' + servidor.TELEFONE + '</td>';
    cols += '<td class="text-center">' + servidor.SEXO + '</td>';
    cols += '<td class="text-center">' + servidor.TURNO + '</td>';
    cols += '<td class="text-center">';
    cols += '<a href = "#" onclick="EditRowServidor(' + servidor.ID_SERVIDOR + ')"> editar </a> | ';
    cols += '<a href="#" onclick="RemoveTableRowServidor(this,' + servidor.ID_SERVIDOR + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#servidor-grid").append(newRow);
    return false;
};

//deletar servidor
function RemoveTableRowServidor(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        DeleteServidor(row, id);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    alert('Operação realiza com sucesso.');
}

//inserir servidor
function InsertServidorCTRL() {

    var servidor = GetServidorForm();
    InserirServidor(servidor);
}

function init() {
    switch (identity_router) {

        case "view-servidor":
            GetServidors();
            break;

        case "form-servidor":
            $('.mask-placa').mask('AAA-0000');
            $('.mask-ano').mask('0000');
            $('.mask-number').mask('0#');
            $('.mask-fone').mask(telmaskbehaviour, teloptions);
            $(".mask-cpf").mask('000.000.000-00', { reverse: true });
            $(".datanasc").mask('00/00/0000');
            $('.cep').mask('00000-000');
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
        EditarServidor(identity_object_id);
}

function SuccessServidor() {
    $("#content").load("./servidor/servidor-view.html");
    alert('Operação realiza com sucesso.');
}

function EditRowServidor(id) {
    identity_object_id = id;
    $("#content").load("./servidor/servidor-form.html");
}

//editar servidor
function EditarServidor(id) {
    ObterServidor(id).then(
            (rows) => {
                if (rows.length > 0)
                    _servidor = rows[0];
                console.log(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            PopularForm(_servidor);
        });
}

//popular form
function PopularForm(servidor) {
    $("#LATITUDE").val(servidor.LATITUDE);
    $("#LONGITUDE").val(servidor.LONGITUDE);
    $("#ENDERECO").val(servidor.ENDERECO);
    $("#CEP").val(servidor.CEP);
    $("#NOME").val(servidor.NOME);
    $("#DATA_NASCIMENTO").val(servidor.DATA_NASCIMENTO);
    $("#SEXO").val(servidor.SEXO);
    $("#TELEFONE").val(servidor.TELEFONE);
    $("#TURNO").val(servidor.TURNO);
}