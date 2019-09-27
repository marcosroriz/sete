identity_router = "form-rota";
var _rota = {};

(function($) { init(); })(jQuery);

function init() {
    setTimeout(() => {
        GetMotoristas();
        GetAllGaragens();
        $(".hora").mask("00:00");
        GetAll();
    }, 50);
}

function InsertCTRL() {
    var data = GetForm();
    if (!_rota.id)
        Inserir('Rota', data);
    else
        Atualizar('Rota', 'id', data, _rota.id);
}

//Buscar dados
function GetAll() {
    GetAllData('Rota').then(
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
    cols += '<td class="text-center">' + row.id + '</td>';
    cols += '<td>' + row.nome + '</td>';
    cols += '<td>' + row.quilometragem + '</td>';
    cols += '<td class="text-center">' + row.data_criacao + '</td>';
    cols += '<td class="text-center">';
    cols += '<a href="#" onclick="VerTableRow(this,' + row.id + ')">ver</a > | ';
    cols += '<a href="#" onclick="EditTableRow(' + row.id + ')">gerenciar</a > | ';
    cols += '<a href="#" onclick="RemoveTableRow(this,' + row.id + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#grid-data").append(newRow);
    return false;
};

function EditTableRow(id) {

    GetData('Rota', 'id', id).then(
            (row) => {
                _rota = row[0];
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            OnForm(_rota);
            SetAlunos();
            SetEscolas();
            GerenciarRelacaoAlunoEscola();
        });
}

function GerenciarRelacaoAlunoEscola() {
    if (_rota.id > 0) {
        $(".menu-relacao-aluno").fadeIn();
        $(".menu-relacao-escola").fadeIn();
        $('.nome_rota').each(function() { $(this).text(_rota.nome); });
        setTimeout(() => {
            $('.nome_motorista').each(function() { $(this).text($("#motorista_id  option:selected").text()); });
        }, 500);
    } else {
        $(".menu-relacao-aluno").fadeOut();
        $(".menu-relacao-escola").fadeOut();
    }
}

//deletar servidor
function RemoveTableRow(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        Delete('Rota', 'id', id, row);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    ShowHideCadastro();
    alert('Operação realiza com sucesso.');
}

function SuccessData(table) {
    if (table != "RelacaoRotaEscola" && table != "RelacaoRotaAluno") {
        $("#grid-data tbody").html("");
        ShowHideCadastro();
        OfForm();
        GetAll();
    }
    alert('Operação realiza com sucesso.');
}


/******************motorista***************/


//set select motorista
function SetSelectMotoristas(motoristas) {
    motoristas.forEach(c => {
        var newRow = $("<option value='" + c.ID_MOTORISTA + "'>");
        newRow.append(c.NOME);
        $(".select-motorista").append(newRow);
    });
}

//Buscar dados
function GetMotoristas() {
    GetAllData('Motorista').then(
            (rows) => {
                SetSelectMotoristas(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

/**********get garagem*****************/



//set select motorista
function SetSelectGaragens(data) {
    data.forEach(c => {
        var newRow = $("<option value='" + c.ID_GARAGEM + "'>");
        newRow.append(c.NOME);
        $(".select-garagem-inicio").append(newRow);
        var newRow_2 = $("<option value='" + c.ID_GARAGEM + "'>");
        newRow_2.append(c.NOME);
        $(".select-garagem-terminio").append(newRow_2);
    });
}

//Buscar dados
function GetAllGaragens() {
    GetAllData('Garagem').then(
            (rows) => {
                SetSelectGaragens(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}


function ShowHideCadastro() {
    _rota = {};
    if ($('#new_cadastrar').css('display') == "none") {
        ShowCadastro();
    } else {
        $('#new_cadastrar').fadeOut();
        $('.botton-cadastro').text("Cadastrar Rotar");
        $('.botton-cadastro-save').fadeOut();
    }

    OfForm();
    GerenciarRelacaoAlunoEscola();
}

function ShowCadastro() {
    $('#new_cadastrar').fadeIn();
    $('.botton-cadastro').text("Cancelar");
    $('.botton-cadastro-save').fadeIn();
    GerenciarRelacaoAlunoEscola();
}

function CickLabelAlunoGrid(e, lado) {
    $(".grid-drop-aluno label").each(function(e, c) {
        $(this).removeClass("active");
    });
    $(e).addClass("active");
    if ($(".grid-drop-aluno label.active").parent().attr('class').match("lado_aluno_1")) {
        $(".left-aluno").css("opacity", 0.1);
        $(".right-aluno").css("opacity", 1);
    } else {
        $(".right-aluno").css("opacity", 0.1);
        $(".left-aluno").css("opacity", 1);
    }
}

function ClickAlunoLeft(e) {

    if ($(".left-aluno").css("opacity") != "1")
        return;
    $(".left-aluno").css("opacity", 0.1);
    RemoveRelacaoAlunoRota("RelacaoRotaAluno", _rota.id, $(".grid-drop-aluno label.active").attr('id'));

    $(".lado_aluno_1").append($(".grid-drop-aluno label.active"));
    $(".grid-drop-aluno label.active").removeClass("active");
}

function ClickAlunoRight(e) {

    if ($(".right-aluno").css("opacity") != "1")
        return;
    $(".right-aluno").css("opacity", 0.1);
    InsertRelacaoAlunoRota("RelacaoRotaAluno", _rota.id, $(".grid-drop-aluno label.active").attr('id'));
    $(".lado_aluno_2").append($(".grid-drop-aluno label.active"));
    $(".grid-drop-auno label.active").removeClass("active");
}

/**********Get Aluno Rota************/


function SetAlunos() {
    GetAlunosVinculados(_rota.id);
    GetAlunosNaoVinculados();
}

function GetAlunosVinculados(rota_id) {
    ObterAlunosVinculados(rota_id).then(
            (rows) => {
                CarregarListaAlunos(rows, 2);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function GetAlunosNaoVinculados() {
    ObterAlunosNaoVinculados().then(
            (rows) => {
                CarregarListaAlunos(rows, 1);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function CarregarListaAlunos(data, lado) {
    $(".lado_aluno_" + lado).html("");
    data.forEach(c => {
        var newRow = $("<label class='dropdown-item' id='" + c.ID_ALUNO + "' onclick='CickLabelAlunoGrid(this, 1)'>");
        var label = c.NOME + "</label>";
        newRow.append(label);
        $(".lado_aluno_" + lado).append(newRow);
    });
}

function InsertRelacaoAlunoRota(table, id_rota, id) {
    var data = {
        rota_id: id_rota,
        aluno_id: id
    }
    Inserir(table, data);
}

function RemoveRelacaoAlunoRota(table, id_rota, id) {
    var data = {
        rota_id: id_rota,
        aluno_id: id
    }
    DeleteData(table, data);
}

/************* Escola ****************/


function CickLabelEscolaGrid(e, lado) {
    $(".grid-drop-escola label").each(function(e, c) {
        $(this).removeClass("active");
    });
    $(e).addClass("active");
    if ($(".grid-drop-escola label.active").parent().attr('class').match("lado_escola_1")) {
        $(".left-escola").css("opacity", 0.1);
        $(".right-escola").css("opacity", 1);
    } else {
        $(".right-escola").css("opacity", 0.1);
        $(".left-escola").css("opacity", 1);
    }
}

function ClickEscolaLeft(e) {
    if ($(".left-escola").css("opacity") != "1")
        return;
    $(".left-escola").css("opacity", 0.1);
    RemoveRelacaoEscolaRota("RelacaoRotaEscola", _rota.id, $(".grid-drop-escola label.active").attr('id'));

    $(".lado_escola_1").append($(".grid-drop-escola label.active"));
    $(".grid-drop-escola label.active").removeClass("active");
}

function ClickEscolaRight(e) {
    if ($(".right-escola").css("opacity") != "1")
        return;
    $(".right-escola").css("opacity", 0.1);
    InsertRelacaoEscolaRota("RelacaoRotaEscola", _rota.id, $(".grid-drop-escola label.active").attr('id'));
    $(".lado_escola_2").append($(".grid-drop-escola label.active"));
    $(".grid-drop-escola label.active").removeClass("active");
}


function SetEscolas() {
    GetEscolasVinculados(_rota.id);
    GetEscolasNaoVinculados(_rota.id);
}

function GetEscolasVinculados(rota_id) {
    ObterEscolasVinculados(rota_id).then(
            (rows) => {
                CarregarListaEscolas(rows, 2);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function GetEscolasNaoVinculados(rota_id) {
    ObterEscolasNaoVinculados(rota_id).then(
            (rows) => {
                CarregarListaEscolas(rows, 1);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function CarregarListaEscolas(data, lado) {
    $(".lado_escola_" + lado).html("");
    data.forEach(c => {
        var newRow = $("<label class='dropdown-item' id='" + c.ID_ESCOLA + "' onclick='CickLabelEscolaGrid(this, 1)'>");
        var label = c.nome + "</label>";
        newRow.append(label);
        $(".lado_escola_" + lado).append(newRow);
    });
}


function InsertRelacaoEscolaRota(table, id_rota, id) {
    var data = {
        rota_id: id_rota,
        escola_id: id
    }
    Inserir(table, data);
}

function RemoveRelacaoEscolaRota(table, id_rota, id) {
    var data = {
        rota_id: id_rota,
        escola_id: id
    }
    DeleteData(table, data);
}