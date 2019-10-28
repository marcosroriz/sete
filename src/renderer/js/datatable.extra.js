var dtLanguage = {
    "search": "_INPUT_",
    "searchPlaceholder": "Procurar escolas",
    "lengthMenu": "Mostrar _MENU_ escolas por página",
    "zeroRecords": "Não encontrei nenhuma escola cadastrada",
    "info": "Mostrando página _PAGE_ de _PAGES_",
    "infoEmpty": "Sem registros disponíveis",
    "infoFiltered": "(Escolas filtradas a partir do total de _MAX_ escolas)",
    "paginate": {
        "first":      "Primeira",
        "last":       "Última",
        "next":       "Próxima",
        "previous":   "Anterior"
    }
}

function getRowOnClick(t) {
    var $tr = $(t).closest('tr');

    if ($tr.hasClass('child')) {
        $tr = $tr.prev('.parent');
    }

    return $tr;
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
