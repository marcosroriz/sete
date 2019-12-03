// Firebase user
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        firebaseUser = user;
        var userDocPromise = remotedb.collection("users").doc(firebaseUser.uid).get();
        userDocPromise.then((queryResult) => {
            userData = queryResult.data();
            $("#userName").html(userData["NOME"]);
        })
    }
});


$(".link-dash").click(function () {
    navigateDashboard("./modules/" + $(this).attr("name") + ".html");
});

var dashPromises = new Array();

dashPromises.push(NumeroDeAlunosAtendidosPromise().then((res) => {
    $("#alunosAtendidos").text(res[0]["NUMALUNOS"]);
}))

dashPromises.push(NumeroDeEscolasAtendidasPromise().then((res) => {
    $("#escolasAtendidas").text(res[0]["NUMESCOLAS"]);
}))

dashPromises.push(NumeroDeVeiculosFuncionamentoPromise().then((res) => {
    $("#veiculosFuncionamento").text(res[0]["NUMVEICULOS"]);
}))

dashPromises.push(NumeroDeVeiculosEmManutencaoPromise().then((res) => {
    $("#veiculosNaoFuncionamento").text(res[0]["NUMVEICULOS"]);
}))

dashPromises.push(BuscarTodosDadosPromise("Rotas").then((res) => {
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

Promise.all(dashPromises)
.then(() => {
    $(".preload").fadeOut(1000, function () {
        $(".content").fadeIn(1000);
    });
})