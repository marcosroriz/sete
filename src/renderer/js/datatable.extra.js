// datatable.extra.js
// Este arquivo contém funções adicionais (comuns) para incrementar ou alterar
// a funcionalidade da biblioteca datatables

// Adicionamos a função capitalize a classe String para permitir colocar 
// o primeiro caractere em maiúsculo de uma dada string
String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

// Função que retorna um dicionário contendo as opções mais comuns que utilizamos
// para configurar o datatable. 
function dtConfigPadrao(nomeDado) {
    return {
        autoWidth: false,
        bAutoWidth: false,
        lengthMenu: [[10, 50, -1], [10, 50, "Todos"]],
        pagingType: "full_numbers",
        order: [[0, "asc"]],
        language: {
            "search": "_INPUT_",
            "searchPlaceholder": `Procurar ${nomeDado}`,
            "lengthMenu": `Mostrar _MENU_ ${nomeDado}s por página`,
            "zeroRecords": `Não encontrei nenhum ${nomeDado} cadastrado`,
            "info": "Mostrando página _PAGE_ de _PAGES_",
            "infoEmpty": "Sem registros disponíveis",
            "infoFiltered": `${nomeDado.capitalize()}s filtrados a partir do total de _MAX_ ${nomeDado}s)`,
            "paginate": {
                "first": "Primeira",
                "last": "Última",
                "next": "Próxima",
                "previous": "Anterior"
            },
        },
        dom: 'lfrtipB',
    }
}

// Semelhante a função de configuração padrão do datatables, mas utiliza 
// palavras-chave no 
function dtConfigPadraoFem(nomeDado) {
    return {...dtConfigPadrao(nomeDado),
            ...{
                language: {
                    "zeroRecords": `Não encontrei nenhuma ${nomeDado} cadastrada`,
                    "infoFiltered": `${nomeDado.capitalize()}s filtradas a partir do total de _MAX_ ${nomeDado}s)`,
                }
            }
        }
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

// Esta função function limit the number of characters shown in a datatable row column
function renderAtMostXCharacters(x = 50) {
    return function (data, type, row) {
        return data.length > x ? data.substr(0, x) + '…' : data;
    }
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