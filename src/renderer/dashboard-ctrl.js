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


Promise.all(dashPromises)
.then(() => {
    $(".preload").fadeOut(1000, function () {
        $(".content").fadeIn(1000);
    });
})