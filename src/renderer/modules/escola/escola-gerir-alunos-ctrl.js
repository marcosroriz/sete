// escola-gerir-ctrl.js
// Este arquivo contém o script de controle da tela escola-gerir-view. O mesmo
// possibilita adicionar/remover alunos em lote das escolas

// Variável que armazena os alunos apresentados (será preenchida)
var listaDeAlunos = new Map();

// Conjunto (Set) de Alunos (Anterior e Novo) atendidos
var antAlunosAtendidos  = new Set();
var novoAlunosAtendidos = new Set();
var atendidoPorOutraEscola = new Set();
// var naoAtendidosPorNenhuma = new Set();

// Filtros
$('#alunosOutros').textFilter($('#filtroOutrosAlunos'));
$('#alunosAtendidos').textFilter($('#filtroTxtAtendidos'));

// Título da escola sendo gerida
$(".tituloSecao span").text(estadoEscola["NOME"]);

async function carregarDados() {
    try {
        // Pegar alunos e discrimina aqueles atendidos por esta escola dos outros
        let res = await restImpl.dbGETEntidade(DB_TABLE_ESCOLA, `/${estadoEscola.ID}/alunos`);
        let alunosAtendidosRaw = res.data;

        alunosAtendidosRaw.forEach((alunoRaw) => {
            let alunoJSON = parseAlunoREST(alunoRaw);
            let aID = String(alunoJSON["id_aluno"]);
            listaDeAlunos.set(aID, alunoJSON);

            antAlunosAtendidos.add(aID);
            novoAlunosAtendidos.add(aID);
        });
    } catch (err) {
        // Escola não tem alunos
        console.log("ERROR", err);
    }

    try {
        // Pegar todos os alunos
        let todosAlunosRaw = await restImpl.dbGETColecao(DB_TABLE_ALUNO);

        todosAlunosRaw.forEach((alunoRaw) => {
            let alunoJSON = parseAlunoREST(alunoRaw);
            let aID = String(alunoJSON["id_aluno"]);
            listaDeAlunos.set(aID, alunoJSON);

            if (!antAlunosAtendidos.has(aID)) {
                listaDeAlunos.set(aID, alunoJSON);
                atendidoPorOutraEscola.add(aID);
            }
        });
    } catch (err) {
        // Não há outros alunos
        console.log("ERROR", err);
    }

    return Promise.resolve(listaDeAlunos)
}

carregarDados()
.then(() => adicionaDadosNaTela())
.catch(err => errorFn("Erro ao detalhar alunos atendidos pela escola: " + estadoEscola["NOME"], err))

// Adiciona dados na tela
var adicionaDadosNaTela = () => {
    // Alunos atendidos por esta escola
    let alunosAtendidos = []
    for (aID of antAlunosAtendidos) {
        alunosAtendidos.push(listaDeAlunos.get(aID));
    }
    alunosAtendidos = alunosAtendidos.sort((a, b) => a["NOME"].toLowerCase().localeCompare(b["NOME"].toLowerCase(), "pt-BR"));

    alunosAtendidos.forEach((aluno) => {
        let aID = aluno["ID"];
        let aNome = aluno["NOME"].toUpperCase();
        $('#alunosAtendidos').append(`<option value="${aID}">${aNome}</option>`);
    })

    // Alunos atendidos por outras escolas
    let outrosAlunos = []

    for (aID of atendidoPorOutraEscola) {
        outrosAlunos.push(listaDeAlunos.get(aID));
    }

    outrosAlunos = outrosAlunos.sort((a, b) => a["NOME"].toLowerCase().localeCompare(b["NOME"].toLowerCase(), "pt-BR"))
    outrosAlunos.forEach((aluno) => {
        let aID = aluno["ID"];
        let aNome = aluno["NOME"].toUpperCase();
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
$("#btnSalvar").on('click', async () => {
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
    let alunosAdicionar = new Set([...novoAlunosAtendidos].filter(x => !antAlunosAtendidos.has(x)));
    let alunosRemover = new Set([...antAlunosAtendidos].filter(x => !novoAlunosAtendidos.has(x)));

    // Número de operações a serem realizadas (barra de progresso)
    var totalOperacoes = alunosAdicionar.size + alunosAdicionar.size + alunosRemover.size; 
    var progresso = 0;

    function updateProgresso() {
        progresso++;
        let progressoPorcentagem = Math.round(100 * (progresso / totalOperacoes))
        $('.progress-bar').css('width', progressoPorcentagem + "%")
        $('.progress-bar').text(progressoPorcentagem + "%")
    }

    // Primeiro, remover relações que mudaram, isto é, tirar as escolas antigas dos alunos que vão entrar e daqueles que sairam
    var promiseArrayRemove = new Array();
    let alunosModificados = new Set([...alunosAdicionar, ...alunosRemover]);

    for (let aID of alunosModificados) {
        try {
            await restImpl.dbDELETE(DB_TABLE_ALUNO, `/${aID}/escola`);
        } catch (error) {
            console.log(error);
        } finally {
            updateProgresso();
        }
    }

    // Agora, vamos adicionar as novas relações
    let novosAlunosParaEscola = [];
    alunosAdicionar.forEach((aID) => {
        novosAlunosParaEscola.push({
            "id_aluno": aID
        })
    })

    let eID = estadoEscola["ID_ESCOLA"];
    if (eID == null || eID == undefined) {
        eID = estadoEscola["ID"];
    }

    return restImpl.dbPOST(DB_TABLE_ESCOLA, `/${eID}/alunos`, {
        "alunos": novosAlunosParaEscola
    }).then(() => Swal2.fire({
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

action = "gerirEscola"