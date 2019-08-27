identity_router = "form-garagem";
var _garagem = {};

(function($) { init(); })(jQuery);

function init() {
    GetAll();
}

function ShowHideCadastro() {
    if ($('#new_cadastrar_garagem').css('display') == "none") {
        $('#new_cadastrar_garagem').fadeIn();
        $('.botton-cadastro').text("Cancelar");
        $('.botton-cadastro-save').fadeIn();
    } else {
        $('#new_cadastrar_garagem').fadeOut();
        $('.botton-cadastro').text("Cadastrar Garagem");
        $('.botton-cadastro-save').fadeOut();
    }
}

function InsertCTRL() {
    var data = GetForm();
    Inserir('Garagem', data);
}

//Buscar dados
function GetAll() {
    GetAllData('Garagem').then(
            (rows) => { SetRow(rows); })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {

        });

}
//popular grid
function SetRow(data) {
    if (data.length < 1)
        return;
    data.forEach(c => AddRowGrid(c));
}
//montar html
function AddRowGrid(row) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td class="text-center">' + row.ID_GARAGEM + '</td>';
    cols += '<td>' + row.NOME + '</td>';
    cols += '<td>' + row.ENDERECO + '</td>';
    cols += '<td class="text-center">' + row.CEP + '</td>';
    cols += '<td class="text-center">';
    cols += '<a href="#" onclick="RemoveTableRow(this,' + row.ID_GARAGEM + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#grid-data").append(newRow);
    return false;
};

//deletar servidor
function RemoveTableRow(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        Delete('Garagem', 'ID_GARAGEM', id, row);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    alert('Operação realiza com sucesso.');
}

function SuccessData(table) {
    $("#grid-data tbody").html("");
    ShowHideCadastro();
    OfForm();
    GetAll();
    alert('Operação realiza com sucesso.');
}

function OfForm() {
    $("#NOME").val(""); // string
    $("#ENDERECO").val(""); // string
    $("#LATITUDE").val(""); //string
    $("#LONGITUDE").val(""); //sring
    $("#CEP").val(""); //int
}