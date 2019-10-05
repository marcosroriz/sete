var _alunos = [];
var _aluno = {};

(function($) { init(); })(jQuery);

//Buscar dados
function GetAlunos() {
    ObterAlunos().then(
            (rows) => { _alunos = rows; })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            SetRow();
            console.log(_alunos);
        });

}
//popular grid
function SetRow() {
    if (_alunos.length < 1)
        return;
    _alunos.forEach(c => AdicioarLinhaAluno(c));
}
//montar html
function AdicioarLinhaAluno(aluno) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td class="text-center">' + aluno.ID_ALUNO + '</td>';
    cols += '<td>' + aluno.NOME + '</td>';
    cols += '<td>' + aluno.ENDERECO + '</td>';
    cols += '<td class="text-center">' + aluno.DATA_NASCIMENTO + '</td>';
    cols += '<td class="text-center">' + aluno.SEXO + '</td>';
    cols += '<td class="text-center">' + aluno.TURNO + '</td>';
    cols += '<td class="text-center">';
    cols += '<a href = "#" onclick="EditRowAluno(' + aluno.ID_ALUNO + ')"> editar </a> | ';
    cols += '<a href="#" onclick="RemoveTableRowAluno(this,' + aluno.ID_ALUNO + ')">excluir</a >';
    cols += '</td>';
    newRow.append(cols);
    $("#aluno-grid").append(newRow);
    return false;
};

//deletar aluno
function RemoveTableRowAluno(row, id) {
    if (confirm("deseja excluir registro " + id + " ?"))
        DeleteAluno(row, id);
};

function DeleteRow(row) {
    var tr = $(row).closest('tr');
    tr.fadeOut(400, function() {
        tr.remove();
    });
    alert('Operação realiza com sucesso.');
}

//inserir aluno
function InsertAlunoCTRL() {
    var aluno = GetAlunoForm();
    InserirAluno(aluno);
}

function SetEdit() {
    if (identity_object_id > 0)
        EditarAluno(identity_object_id);
}

function SuccessAluno() {
    $("#content").load("./aluno/aluno-view.html");
    alert('Operação realiza com sucesso.');
}

function EditRowAluno(id) {
    identity_object_id = id;
    $("#content").load("./aluno/aluno-form.html");
}

//editar aluno
function EditarAluno(id) {
    ObterAluno(id).then(
            (rows) => {
                if (rows.length > 0)
                    _aluno = rows[0];
                console.log(rows);
            })
        .catch((err) => { console.log(err); throw err })
        .finally(() => {
            PopularForm(_aluno);
        });
}

//popular form
function PopularForm(aluno) {
    $("#reglat").val(aluno.LATITUDE);
    $("#reglon").val(aluno.LONGITUDE);
    $("#regend").val(aluno.ENDERECO);
    $("#regcep").val(aluno.CEP);

    $("#temPorteira").attr('checked', (aluno.DA_PORTEIRA) ? true : false);
    $("#temMataBurro").attr('checked', (aluno.DA_MATABURRO) ? true : false);
    $("#temColchete").attr('checked', (aluno.DA_COLCHETE) ? true : false);
    $("#temAtoleiro").attr('checked', (aluno.DA_ATOLEIRO) ? true : false);
    $("#temPonte").attr('checked', (aluno.DA_PONTERUSTICA) ? true : false);
    $("#regnome").val(aluno.NOME);
    $("#regdata").val(aluno.DATA_NASCIMENTO);
    //$("input[name=sexo]:checked").val(aluno.SEXO), //int
    //$("input[name=cor]:checked").val(aluno.COR), //$("#regemail").val(), //int
    $("#regnomeresp").val(aluno.NOME_RESPONSAVEL);
    $("#reggrau").val(aluno.GRAU_RESPONSAVEL);
    $("#regfoneresponsavel").val(aluno.TELEFONE_RESPONSAVEL);
    $("#temDeCaminhar").attr('checked', (aluno.DEF_CAMINHAR) ? true : false);
    $("#temDeOuvir").attr('checked', (aluno.DEF_OUVIR) ? true : false);
    $("#temDeEnxergar").attr('checked', (aluno.DEF_ENXERGAR) ? true : false);
    $("#temDeMentalIntelec").attr('checked', (aluno.DEF_MENTAL) ? true : false);
    $("#regescola").val(aluno.ID_ESCOLA);

    $('input[value=' + aluno.TURNO + ']').attr('checked', 'checked');
    $('input[value=' + aluno.NIVEL + ']').attr('checked', 'checked');
    $('input[value=' + aluno.SEXO + ']').attr('checked', 'checked');
    $('input[value=' + aluno.COR + ']').attr('checked', 'checked');
}

function init() {
    switch (identity_router) {

        case "view-aluno":
            GetAlunos();
            break;

        case "form-aluno":
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