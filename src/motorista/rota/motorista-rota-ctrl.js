var _motorista = {};
var _rota = {};
var _alunos = [];
var _alunos_edit = [];

(function($) { init(); })(jQuery);


//inserir rota motorista
function InsertRotaMotoristaCTRL() {
    var rota = GetRotaMotoristaForm();
    InserirRotaMotorista(rota);
}

//popular grid
function SetRow(rotas) {
    if (rotas.length < 1)
        return;
    rotas.forEach(c => SetLinhaRotasMotorista(c));
}
//montar html
function SetLinhaRotasMotorista(rota) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td class="text-center td-code">' + rota.id + '</td>';
    cols += '<td>' + rota.nome_rota + '</td>';
    cols += '<td class="text-center">' + rota.km + '</td>';
    cols += '<td class="text-center td-action" ><a href = "#" onclick="EditarRotaMotorista(' + rota.id + ')"> Ver </a> | ';
    cols += '<a href="#" onclick="RemoveTableRowRotaMotorista(this,' + rota.id + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#rotas-grid").append(newRow);
    return false;
};


//inserir rota motorista
function InsertRotaRotaMotoristaCTRL() {
    var rota = GetRotaMotoristaForm();
    InserirRotaMotorista(rota);
}

//editar motorista
function EditarRotaMotorista(id) {
    ObterDadosPorCondicao('RotaMotorista', 'id', id).then(
            (rows) => {
                if (rows.length > 0)
                    _rota = rows[0];
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            PopularForm(_rota);
            SelectEditAlunos(id);
        });
}

function SelectEditAlunos(id) {

    ObterDadosPorCondicao('RelacaoRotaAluno', 'rota_id', id).then(
            (rows) => {
                _alunos_edit = rows;
                console.log(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            setTimeout(() => {
                for (let i = 0; i < _alunos_edit.length; i++) {
                    $("#aluno_id_" + _alunos_edit[i].aluno_id).attr('checked', 'checked')
                }
            }, 1500);
        });
}


//popular form
function PopularForm(rota) {
    GetMotoristas();
    GetAlunos(rota.escola_id);

    $("#rota_nome").val(rota.nome_rota);
    $("#rota_km").val(rota.km);
    $("#rota_escola").val(rota.escola_id);

    setTimeout(() => {
        $("#rota_motorista").val(rota.motorista_id);
    }, 1000);

    $('.btn-temp-insert').hide();
    $('.modal-motorista-rota-form').modal('show');
}

/** dados rota *************************************/
function SuccessRotaMotorista() {
    $('.modal-motorista-rota-form').modal('hide');
    GetRotasMotoristas();
    alert('Operação realiza com sucesso.');
}

function GetRotasMotoristas() {
    ObterDados('RotaMotorista').then(
            (rows) => {
                SetRow(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

//deletar rota motorista
function RemoveTableRowRotaMotorista(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        DeleteRotaMotorista(row, id);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    alert('Operação realiza com sucesso.');
}


/** dados motorista ************************************************/
function AdicionarRota() {
    _alunos = [];
    _rota = {};
    $("#rota_nome").val("");
    $("#rota_km").val("");
    $("#rota_escola").val("");
    $("#rota_motorista").val("");
    $(".select-motorista").html("");
    $('.btn-temp-insert').fadeIn();
    var newRow = $("<option value=''>");
    newRow.append("Selecione um Motorista");
    $(".select-motorista").append(newRow);

    GetMotoristas();
}

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
    ObterDados('Motorista').then(
            (rows) => {
                SetSelectMotoristas(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}


/** dados alunos **/
//set select motorista
function OnSelectEscola() {
    var id_escola = $('#rota_escola').val();
    GetAlunos(id_escola);
}

function SetSelectAlunos(alunos) {
    $(".select-alunos").html("");
    _alunos = [];
    alunos.forEach(c => {
        var newRow = $("<div class='col-lg-12'>");
        var label = "<label class='btn btn-link'>";
        label += "<input type='checkbox' onclick='OnClickCheckedAluno(this)' id='aluno_id_" + c.ID_ALUNO + "' value='" + c.ID_ALUNO + "'" +
            " name='" + c.NOME + c.ID_ALUNO + "'> &nbsp;&nbsp;&nbsp;";
        label += "<span class='text-primary checked-aluno'>" + c.NOME + "</span>";
        newRow.append(label);
        $(".select-alunos").append(newRow);
    });
}

//Buscar dados
function GetAlunos(id_escola) {
    ObterDadosPorCondicao('Aluno', 'ID_ESCOLA', id_escola).then(
            (rows) => {
                SetSelectAlunos(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {});
}

function OnClickCheckedAluno(e) {
    function ver(obj) {
        return (obj == e.value);
    }

    var aluno = _alunos.filter(ver);
    if (e.checked) {
        if (aluno.length < 1)
            _alunos.push(e.value);
    } else {
        if (aluno.length > 0) {
            var posicao = 0;
            for (let i = 0; i < _alunos.length; i++) {
                if (_alunos[i] == aluno[0])
                    posicao = i;
            }
            _alunos.splice(posicao, 1);
        }
    }
}


function init() {

    GetRotasMotoristas();

    setTimeout(() => {
        identity_router = null;
        identity_object_id = 0;
    }, 500);
}