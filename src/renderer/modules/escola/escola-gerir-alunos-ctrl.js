// Lista de Alunos (Anterior e Novo)
var antOutrosAlunos     = new Set();
var antAlunosAtendidos  = new Set();
var novoOutrosAlunos    = new Set();
var novoAlunosAtendidos = new Set();

// Filtros
$('#alunosOutros').textFilter($('#filtroOutrosAlunos'));
$('#alunosAtendidos').textFilter($('#filtroTxtAtendidos'));


ListaDeAlunosPorEscola(estadoEscola["ID_ESCOLA"], (err, result) => {
    result.forEach((a) => {
        var aID = a["ID_ALUNO"];
        var aNome = a["NOME"] + " (" + a["DATA_NASCIMENTO"] + ")";
        antAlunosAtendidos.add(aID);
        novoAlunosAtendidos.add(aID);
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
    });
    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});


ListaDeAlunosNaoAtendidosPorEscola(estadoEscola["ID_ESCOLA"], (err, result) => {
    result.forEach((a) => {
        var aID = a["ID_ALUNO"];
        var aNome = a["NOME"] + " (" + a["DATA_NASCIMENTO"] + ")";
        antOutrosAlunos.add(aID);
        novoOutrosAlunos.add(aID);
        $('#alunosOutros').append(`<option value="${aID}">${aNome}</option>`);
    });
});

$("#colocarAluno").click(() => {
    for (var aID of $("#alunosOutros").val()) {
        var aNome = $(`option[value=${aID}]`).text();
        $(`option[value=${aID}]`).remove();
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novoOutrosAlunos.delete(aID);
        novoAlunosAtendidos.add(aID);
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$("#tirarAluno").click(() => {
    for (var aID of $("#alunosAtendidos").val()) {
        var aNome = $(`option[value=${aID}]`).text();
        $(`option[value=${aID}]`).remove();
        $('#alunosOutros').append(`<option value="${aID}">${aNome}</option>`);
        novoAlunosAtendidos.delete(aID);
        novoOutrosAlunos.add(aID);
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});