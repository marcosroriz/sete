// escola-gerir-ctrl.js
// Este arquivo contém o script de controle da tela escola-gerir-view. O mesmo
// possibilita adicionar/remover alunos em lote das escolas

// Variável que armazena os alunos apresentados (será preenchida)
var listaDeAlunos = new Map();

// Conjunto (Set) de Alunos (Anterior e Novo) atendidos
var antAlunosAtendidos  = new Set();
var novoAlunosAtendidos = new Set();
var atendidoPorOutraEscola = new Set();
var naoAtendidosPorNenhuma = new Set();

// Filtros
$('#alunosOutros').textFilter($('#filtroOutrosAlunos'));
$('#alunosAtendidos').textFilter($('#filtroTxtAtendidos'));

// Título da escola sendo gerida
$(".tituloSecao span").text(estadoEscola["NOME"]);

// Pegar alunos e discrimina aqueles atendidos por esta escola dos outros
dbLeftJoinPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, "ID_ALUNO", DB_TABLE_ALUNO, "ID_ALUNO")
.then(res => processarAlunosAtendidos(res))
.then(() => dbBuscarTodosDadosPromise(DB_TABLE_ALUNO))
.then(res => processarAlunosRestantes(res))
.then(() => adicionaDadosNaTela())
.catch(err => {
    debugger
    errorFn("Erro ao detalhar alunos atendidos pela escola: " + estadoEscola["NOME"], err)
})

// Processa alunos atendidos (precisamos discriminar se são por essa escola ou não)
var processarAlunosAtendidos = (res) => {
    res.forEach((aluno) => {
        let aID = String(aluno["ID_ALUNO"]);
        listaDeAlunos.set(aID, aluno);

        if (estadoEscola["ID"] == aluno["ID_ESCOLA"]) {
            antAlunosAtendidos.add(aID);
            novoAlunosAtendidos.add(aID);
        } else {
            atendidoPorOutraEscola.add(aID);
        }
    })

    return listaDeAlunos;
}

// Processa alunos não atendidos
var processarAlunosRestantes = (res) => {
    res.forEach((aluno) => {
        let aID = String(aluno["ID"]);

        if (!(antAlunosAtendidos.has(aID) || atendidoPorOutraEscola.has(aID))) {
            listaDeAlunos.set(aID, aluno);
            naoAtendidosPorNenhuma.add(aID);
        }
    })

    return listaDeAlunos;
}

// Adiciona dados na tela
var adicionaDadosNaTela = () => {
    // Alunos atendidos por esta escola
    let alunosAtendidos = []
    for (aID of antAlunosAtendidos) {
        alunosAtendidos.push(listaDeAlunos.get(aID))
    }
    alunosAtendidos = alunosAtendidos.sort((a, b) => a["NOME"].toLowerCase().localeCompare(b["NOME"].toLowerCase(), "pt-BR"))

    alunosAtendidos.forEach((aluno) => {
        let aID = aluno["ID_ALUNO"];
        let aNome = aluno["NOME"] + " (" + aluno["DATA_NASCIMENTO"] + ")";
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
    })

    // Alunos atendidos por outras escolas
    let outrosAlunos = []

    for (aID of atendidoPorOutraEscola) {
        aluno = listaDeAlunos.get(aID)
        if (aluno != null && aluno["NOME"]) {
            outrosAlunos.push({
                "ID": aluno["ID_ALUNO"],
                "NOME": aluno["NOME"],
                "DATA_NASCIMENTO": aluno["DATA_NASCIMENTO"]
            })
        }
    }

    // Alunos atendidos por nenhuma
    for (aID of naoAtendidosPorNenhuma) {
        aluno = listaDeAlunos.get(aID);
        if (aluno != null && aluno["NOME"]) {
            outrosAlunos.push({
                "ID": aluno["ID"],
                "NOME": aluno["NOME"],
                "DATA_NASCIMENTO": aluno["DATA_NASCIMENTO"] 
            })
        }
    }

    outrosAlunos = outrosAlunos.sort((a, b) => a["NOME"].toLowerCase().localeCompare(b["NOME"].toLowerCase(), "pt-BR"))
    outrosAlunos.forEach((aluno) => {
        let aID = aluno["ID"];
        let aNome = aluno["NOME"] + " (" + aluno["DATA_NASCIMENTO"] + ")";
        $('#alunosOutros').append(`<option value="${aID}">${aNome}</option>`);
    })
}

$("#colocarAluno").on('click', () => {
    for (var aID of $("#alunosOutros").val()) {
        var aNome = $(`option[value="${aID}"]`).text();
        $(`option[value="${aID}"]`).remove();
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
        novoAlunosAtendidos.add(aID);
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

$("#tirarAluno").on('click', () => {
    for (var aID of $("#alunosAtendidos").val()) {
        var aNome = $(`option[value="${aID}"]`).text();
        $(`option[value="${aID}"]`).remove();
        $('#alunosOutros').append(`<option value="${aID}">${aNome}</option>`);
        novoAlunosAtendidos.delete(aID);
    }

    $("#totalNumAlunos").text($("#alunosAtendidos option").length);
});

// Salvar alunos
$("#btnSalvar").on('click', () => {
    Swal2.fire({
        title: "Aguarde, fazendo alteração nos dados da escola...",
        imageUrl: "img/icones/processing.gif",
        closeOnClickOutside: false,
        allowOutsideClick: false,
        showConfirmButton: false,
        html: `
        <br />
        <div class="progress" style="height: 20px;">
            <div id="pbar" class="progress-bar" role="progressbar" 
                 aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" 
                 style="width: 0%;">
            </div>
        </div>
        `
    })
    var alunosAdicionar = new Set([...novoAlunosAtendidos].filter(x => !antAlunosAtendidos.has(x)));
    var alunosRemover = new Set([...antAlunosAtendidos].filter(x => !novoAlunosAtendidos.has(x)));

    // Número de operações a serem realizadas (barra de progresso)
    var totalOperacoes = alunosAdicionar.size + alunosAdicionar.size + alunosRemover.size; 
    var progresso = 0;

    function updateProgresso() {
        progresso++;
        let progressoPorcentagem = Math.round(100 * (progresso / totalOperacoes))
        $('.progress-bar').css('width', progressoPorcentagem + "%")
        $('.progress-bar').text(progressoPorcentagem + "%")
    }

    // Primeiro, remover relações que mudaram
    var promiseArrayRemove = new Array();
    alunosAdicionar.forEach((aID) => {
        promiseArrayRemove.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS,
                                                            "ID_ALUNO", String(aID))
                                .then(() => updateProgresso()))
    })
        
    alunosRemover.forEach((aID) => {
        promiseArrayRemove.push(dbRemoverDadoSimplesPromise(DB_TABLE_ESCOLA_TEM_ALUNOS,
                                                            "ID_ALUNO", String(aID))
                                .then(() => updateProgresso()))
    })

    Promise.all(promiseArrayRemove)
    .then(() => {
        // Agora, vamos adicionar as novas relações
        var promiseArrayAdd = new Array();
        alunosAdicionar.forEach((aID) => {
            console.log(aID, estadoEscola["ID_ESCOLA"])
            let eID = estadoEscola["ID_ESCOLA"];
            if (eID == null || eID == undefined) {
                eID = estadoEscola["ID"];
            }
            promiseArrayAdd.push(dbInserirPromise(DB_TABLE_ESCOLA_TEM_ALUNOS, {
                "ID_ESCOLA": String(eID), 
                "ID_ALUNO": String(aID)
            }).then(() => updateProgresso()));
        })

        return Promise.all(promiseArrayAdd)
    })
    .then(() => Swal2.fire({
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
    }))
    .then(() => navigateDashboard("./modules/escola/escola-listar-view.html"))
    .catch((err) => {
        debugger
        Swal2.close();
        errorFn("Erro ao associar os alunos a escola!", err)
    })
});

$("#btnCancelar").on('click', () => {
    cancelDialog()
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
            console.log(`option[value=${aID}]`)
            $(`option[value="${aID}"]`).show();
        }        
    } else {
        $("#alunosOutros option").show();
    }

})

action = "gerirEscola"