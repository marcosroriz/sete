// Lista de Alunos (Anterior e Novo)
var antAlunosAtendidos  = new Set();
var novoAlunosAtendidos = new Set();
var naoAtendidosPorNenhuma = new Set();

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
        $('#alunosOutros').append(`<option value="${aID}">${aNome}</option>`);

        if (a["ID_ESCOLA"] == null) {
            naoAtendidosPorNenhuma.add(parseInt(aID));
        }
    });
});

$("#colocarAluno").click(() => {
    for (var aID of $("#alunosOutros").val()) {
        var aNome = $(`option[value=${aID}]`).text();
        $(`option[value=${aID}]`).remove();
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novoAlunosAtendidos.add(parseInt(aID));
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$("#tirarAluno").click(() => {
    for (var aID of $("#alunosAtendidos").val()) {
        var aNome = $(`option[value=${aID}]`).text();
        $(`option[value=${aID}]`).remove();
        $('#alunosOutros').append(`<option value="${aID}">${aNome}</option>`);
        novoAlunosAtendidos.delete(parseInt(aID));
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

// Função para relatar erro
var errorFnSalvar = (err) => {
    Swal2.fire({
        title: "Ops... tivemos um problema!",
        text: "Erro ao associar os alunos a escola! Feche e abra o software novamente. \n" + err,
        icon: "error",
        button: "Fechar"
    });
}

$("#btnSalvar").click(() => {
    var alunosAdicionar = new Set([...novoAlunosAtendidos].filter(x => !antAlunosAtendidos.has(x)));
    var alunosRemover = new Set([...antAlunosAtendidos].filter(x => !novoAlunosAtendidos.has(x)));

    // Primeiro, remover relações que mudaram
    var promiseArrayRemove = new Array();
    alunosAdicionar.forEach((aID) => promiseArrayRemove.push(RemoveAlunoEscola(aID)));
    alunosRemover.forEach((aID) => promiseArrayRemove.push(RemoveAlunoEscola(aID)));

    Promise.all(promiseArrayRemove)
        .then(() => {
            // Agora, vamos adicionar as novas relações
            var promiseArrayAdd = new Array();
            alunosAdicionar.forEach((aID) => promiseArrayAdd.push(AdicionaAlunoEscola(aID, estadoEscola["ID_ESCOLA"])));

            Promise.all(promiseArrayAdd)
                .then((res) => {
                    Swal2.fire({
                        title: "Alunos salvos com sucesso",
                        text: "Clique abaixo para retornar ao painel administrativo.",
                        type: "success",
                        icon: "success",
                        showCancelButton: false,
                        confirmButtonClass: "btn-success",
                        confirmButtonText: "Retornar ao painel",
                        closeOnConfirm: false,
                        closeOnClickOutside: false,
                        allowOutsideClick: false,
                        showConfirmButton: true
                    })
                    .then(() => {
                        navigateDashboard("./modules/escola/escola-listar-view.html");
                    });
                })
                .catch((err) => errorFnSalvar(err))
        })
        .catch((err) => errorFnSalvar(err))
});

$("#btnCancelar").click(() => {
    Swal2.fire({
        title: 'Cancelar Edição?',
        text: "Se você cancelar nenhum alteração será feita nos dados da escola.",
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        cancelButtonText: "Voltar a editar",
        confirmButtonText: 'Sim, cancelar'
    })
    .then((result) => {
        if (result.value) {
            navigateDashboard(lastPage);
        }
    })
});

var filtroApenasSem = false;
$("#mostrarApenasSem").click(() => {
    filtroApenasSem = !filtroApenasSem;
    if (filtroApenasSem) {
        $("#alunosOutros option").hide();

        for (var aID of naoAtendidosPorNenhuma) {
            $(`option[value=${aID}]`).show();
        }        
    } else {
        $("#alunosOutros option").show();
    }

})