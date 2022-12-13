// relatorio-frota-ctrl.js
// Este arquivo contém o script de controle da tela relatorio-frota-view. 

// Preenchimento da Tabela via REST
var relatorios = new Map();

restImpl.dbGETEntidade(DB_TABLE_GRAFICOS, "/veiculos")
    .then((res) => {
        for (let r of res.data) {
            switch (r.nome) {
                case "Lotação Média":
                    r["tipo"] = "total";
                    break;
                case "Capacidade Disponível":
                    r["tipo"] = "total";
                    break;
                case "Categoria dos veículos":
                    r["tipo"] = "pizza";
                    break;
                case "Idade dos Veículos":
                    r["tipo"] = "total";
                    r["values"][0] = Number(String(r["values"][0]).replace(",", "."))
                    break;
                case "Marca dos Veículos":
                    r["tipo"] = "pizza";
                    break;
                case "Modelo dos veículos":
                    r["tipo"] = "pizza";
                    break;
                case "Origem dos veículos":
                    r["tipo"] = "pizza";
                    break;
                default:
                    r["tipo"] = "pizza"
                    break;
            }
            relatorios.set(r.nome, r);

            $("#menuRelatorio").append(
                `<a href="#" name="${r.nome}" class="list-group-item list-group-item-action">
                ${r.nome}
                </a>`);
        }

        $("#menuRelatorio a").on("click", (e) => {
            $(".card-report").fadeOut(300, () => {
                e.preventDefault()
                var $that = $(e.target);
                $($that).parent().find('a').removeClass('active');
                $that.addClass('active');

                var optName = $that.attr('name');
                var opt = relatorios.get(optName);

                // Grafico
                if (graficoAtual?.destroy) {
                    graficoAtual.destroy();
                }
                $("#grafico").empty();
                graficoAtual = plotGraphic("#grafico", opt);

                $(".card-report").fadeIn(300);
            });
        });

        $("#menuRelatorio a:first-child").trigger("click");
    }).catch((err) => {
        debugger
        console.log(err);
        errorFn(err);
    })

action = "relatorioFrota";