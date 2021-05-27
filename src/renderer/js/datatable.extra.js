// datatable.extra.js
// Este arquivo contém funções adicionais (comuns) para incrementar ou alterar
// a funcionalidade da biblioteca datatables

// Adicionamos a função capitalize a classe String para permitir colocar 
// o primeiro caractere em maiúsculo de uma dada string
String.prototype.capitalize = function () {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// Função que retorna um dicionário contendo as opções mais comuns que utilizamos
// para configurar o datatable. 
function dtConfigPadrao(nomeDado) {
    return {
        autoWidth: false,
        bAutoWidth: false,
        lengthMenu: [[10, 50, -1], [10, 50, "Todos"]],
        pagingType: "simple_numbers",
        order: [[0, "asc"]],
        language: {
            "search": "_INPUT_",
            "searchPlaceholder": `Procurar ${nomeDado}`,
            "lengthMenu": `Mostrar _MENU_ ${nomeDado}s por página`,
            "zeroRecords": `Não encontrei nenhum ${nomeDado} cadastrado`,
            "info": "Filtro retornou _TOTAL_ registros",
            "infoEmpty": "Sem registros disponíveis",
            "infoFiltered": `(do total de _MAX_ ${nomeDado}s)`,
            "paginate": {
                "first": "Primeira",
                "last": "Última",
                "next": "Próxima",
                "previous": "Anterior"
            },
        },
        dom: 'rtilfpB',
    }
}

// Semelhante a função de configuração padrão do datatables, mas utiliza 
// palavras-chave no 
function dtConfigPadraoFem(nomeDado) {
    let configPadrao = dtConfigPadrao(nomeDado);
    configPadrao["language"]["zeroRecords"] = `Não encontrei nenhuma ${nomeDado} cadastrada`;
    configPadrao["language"]["infoFiltered"] = `${nomeDado.capitalize()}s filtradas a partir do total de _MAX_ ${nomeDado}s)`;

    return configPadrao;
}

var dtLanguage = {
    "search": "_INPUT_",
    "searchPlaceholder": "Procurar escolas",
    "lengthMenu": "Mostrar _MENU_ escolas por página",
    "zeroRecords": "Não encontrei nenhuma escola cadastrada",
    "info": "Mostrando página _PAGE_ de _PAGES_",
    "infoEmpty": "Sem registros disponíveis",
    "infoFiltered": "(Escolas filtradas a partir do total de _MAX_ escolas)",
    "paginate": {
        "first": "Primeira",
        "last": "Última",
        "next": "Próxima",
        "previous": "Anterior"
    }
}

// Função para pegar a linha ao usuário clicar
function getRowOnClick(t) {
    var $tr = $(t).closest('tr');

    if ($tr.hasClass('child')) {
        $tr = $tr.prev('.parent');
    }

    return $tr;
}

// Esta função limita o número de caracteres que aparece na célula da tabela
function renderAtMostXCharacters(x = 50) {
    return function (data, type, row) {
        return data.length > x ? data.substr(0, x) + '…' : data;
    }
}

// Equivalente a função anterior, mas não precisa da datatable, dar para usar na String
function renderEllipsis(data, x = 50) {
    return data.length > x ? data.substr(0, x) + '…' : data;
}


// jQuery extension method:
jQuery.fn.textFilter = function (textbox) {
    return this.each(function () {
        var select = this;
        $(textbox).bind('change keyup', function () {
            var options = $(select).find('option');
            var search = $.trim($(this).val());
            var regex = new RegExp(search, "gi");

            $.each(options, function (i) {
                var option = options[i];
                if (option.text.match(regex) !== null) {
                    $(option).show();
                } else {
                    $(option).hide();
                }
            });
        });
    });
};


jQuery.fn.filterByText = function (textbox) {
    return this.each(function () {
        var select = this;
        var options = [];
        $(select).find('option').each(function () {
            options.push({
                value: $(this).val(),
                text: $(this).text()
            });
        });
        $(select).data('options', options);

        $(textbox).bind('change keyup', function () {
            var options = $(select).empty().data('options');
            var search = $.trim($(this).val());
            var regex = new RegExp(search, "gi");

            $.each(options, function (i) {
                var option = options[i];
                if (option.text.match(regex) !== null) {
                    $(select).append(
                        $('<option>').text(option.text).val(option.value)
                    );
                }
            });
        });
    });
};

jQuery.extend(jQuery.fn.dataTableExt.oSort, {
    'locale-compare-asc': function (a, b) {
        return a.localeCompare(b, 'cs', { sensitivity: 'accent' })
    },
    'locale-compare-desc': function (a, b) {
        return b.localeCompare(a, 'cs', { sensitivity: 'accent' })
    }
})

jQuery.fn.dataTable.ext.type.search['locale-compare'] = function (data) {
    return !data
        ? ''
        : typeof data === 'string'
            ? data
                .replace(/\n/g, ' ')
                .replace(/[e]/g,'e')
                .replace(/[í]/g,'i')
                .replace(/[ã]/g,'a')
                .replace(/[õ]/g,'o')
                .replace(/[éÉěĚèêëÈÊË]/g, 'e')
                .replace(/[šŠ]/g, 's')
                .replace(/[čČçÇ]/g, 'c')
                .replace(/[řŘ]/g, 'r')
                .replace(/[žŽ]/g, 'z')
                .replace(/[ýÝ]/g, 'y')
                .replace(/[áÁâàÂÀ]/g, 'a')
                .replace(/[íÍîïÎÏ]/g, 'i')
                .replace(/[ťŤ]/g, 't')
                .replace(/[ďĎ]/g, 'd')
                .replace(/[ňŇ]/g, 'n')
                .replace(/[óÓ]/g, 'o')
                .replace(/[úÚůŮ]/g, 'u')
            : data
}

// https://jsfiddle.net/7a1e48sp/4/
function dtInitFiltros(dt, colunas) {
    dt.columns().every(function (i) {
        if (colunas.includes(i)) {
            var column = this;
            var select = $($(this.header()).find('select')[0]);

            // Remove evento de ordenar ascendente / decrescente que esta no elemento pai do select
            select.on('click', function (evt) {
                    evt.stopPropagation();
            })

            if (select.hasClass("form-includes")) {
                select.on('change', function (evt) {
                    var val = $.fn.dataTable.util.escapeRegex($(this).val());
                    column.search(val ? val : '', true, false).draw();
                });
            } else if (select.hasClass("form-range")) {
                select.on('change', function (evt) {
                    var val =$(this).val();
                    column.search(val, true, false).draw();
                });
            } else {
                select.on('change', function (evt) {
                    var val = $.fn.dataTable.util.escapeRegex($(this).val());
                    column.search(val ? '^' + val + '$' : '', true, false).draw();
                });

                column.data().unique().sort().each(function (d, j) {
                    select.append('<option value="' + d + '">' + renderEllipsis(d, 50) + '</option>')
                });
            }
        }
    });
}

(function () {

    function removeAccents(data) {
        if (data.normalize) {
            // Use I18n API if avaiable to split characters and accents, then remove
            // the accents wholesale. Note that we use the original data as well as
            // the new to allow for searching of either form.
            return data + ' ' + data
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        return data;
    }

    var searchType = jQuery.fn.DataTable.ext.type.search;

    searchType.string = function (data) {
        return !data ?
            '' :
            typeof data === 'string' ?
                removeAccents(data) :
                data;
    };

    searchType.html = function (data) {
        return !data ?
            '' :
            typeof data === 'string' ?
                removeAccents(data.replace(/<.*?>/g, '')) :
                data;
    };

}());