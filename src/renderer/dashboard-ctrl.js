// dashboard-ctrl.js
// Este arquivo provê os scripts básicos para controlar a tela inicial do SETE

// Mostra âncora de loading
$(".content").hide();

if (firstAcess) {
    loadingFn("Sincronizando os dados com a nuvem...", "Espere um minutinho...");
    $(".preload").hide();
} else {
    $(".preload").show();
}


// Ativa links de navegação
$(".link-dash").on('click', function () {
    navigateDashboard("./modules/" + $(this).attr("name") + ".html");
});

// Seta o usuário do firebase
firebase.auth().onAuthStateChanged((user) => {
    if (user && user.uid == userconfig.get("ID")) {
        firebaseUser = user;
        var userDocPromise = remotedb.collection("users").doc(firebaseUser.uid).get();
        userDocPromise.then((queryResult) => {
            userData = queryResult.data();
            $("#userName").html(userData["NOME"].split(" ")[0]);
        })
    }
});

// Verifica se DB está sincronizado antes de colocar dados na tela do dashboard
dbEstaSincronizado()
.then((estaSincronizado) => {
    if (!estaSincronizado) {
        console.log("PRECISAMOS SINCRONIZAR")
        return dbSincronizar();
    } else {
        // Está sincronizado
        console.log("ESTÁ SINCRONIZADO")
        return true;
    }
})
.then(() => preencheDashboard())
.then(() => {
    $(".preload").fadeOut(200, function () {
        $(".content").fadeIn(200);
    });
    Swal2.close()
    firstAcess = false;
})
.catch((err) => {
    errorFn("Erro ao sincronizar, tente mais tarde", err)
    $(".preload").fadeOut(200, function () {
        $(".content").fadeIn(200);
    });
})

// Preenche Dashboard
function preencheDashboard() {
    var dashPromises = new Array();

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ESCOLA_TEM_ALUNOS).then((res) => {
        $("#alunosAtendidos").text(res.length);

        let escolasAtendidas = new Set()
        res.forEach(relEscolaAluno => escolasAtendidas.add(relEscolaAluno["ID_ESCOLA"]))
        
        $("#escolasAtendidas").text(escolasAtendidas.size);
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_VEICULO).then((res) => {
        let func = naofunc = 0;
        res.forEach(veiculo => veiculo["MANUTENCAO"] ? func++ : naofunc++)
        $("#veiculosFuncionamento").text(func);
        $("#veiculosNaoFuncionamento").text(naofunc);
    }))

    dashPromises.push(dbBuscarTodosDadosPromise(DB_TABLE_ROTA).then((res) => {
        var totalRotas = res.length;
        var totalKM = 0;
        var totalKMMedio = 0;
        var totalTempo = 0;
        res.forEach((rota) => {
            totalKM = totalKM + parseFloat(rota["KM"]);
            totalTempo = totalTempo + parseFloat(rota["TEMPO"]);
        });

        if (totalRotas != 0) {
            totalKMMedio = Math.round(totalKM / totalRotas);
            totalTempo = Math.round(totalTempo / totalRotas);
        }

        $("#qtdeRotas").text(totalRotas);
        $("#kmTotal").text(Math.round(totalKM) + " km");
        $("#kmMedio").text(totalKMMedio + " km");
        $("#tempoMedio").text(totalTempo + " min");
    }))

    return Promise.all(dashPromises)
}
