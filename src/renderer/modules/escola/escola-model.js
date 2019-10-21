function GetEscolaFromForm() {
    return {
        "LOC_LATITUDE": $("#reglat").val(), // real
        "LOC_LONGITUDE": $("#reglon").val(), // real
        "MEC_CO_UF": $("#regestado").val(), // int
        "MEC_CO_MUNICIPIO": $("#regcidade").val(), // int
        "LOC_ENDERECO": $("#regend").val(), // string
        "LOC_CEP": $("#regcep").val(), // string
        "MEC_TP_LOCALIZACAO": $("input[name='areaUrbana']:checked").val(), // int
        "MEC_TP_LOCALIZACAO_DIFERENCIADA": $("input[name='locDif']:checked").val(), // int
        "NOME": $("#nomeEscola").val(), // string
        "MEC_NO_ENTIDADE": $("#nomeEscola").val(), // string
        "CONTATO_RESPONSAVEL": $("#nomeContato").val(), // string
        "CONTATO_TELEFONE": $("#telContato").val(), // string
        "MEC_TP_DEPENDENCIA": $("input[name='tipoDependencia']:checked").val(), // int
        "MEC_IN_REGULAR": $("#temEnsinoRegular").is(":checked"), // bool
        "MEC_IN_EJA": $("#temEnsinoEJA").is(":checked"), // bool
        "MEC_IN_PROFISSIONALIZANTE": $("#temEnsinoProf").is(":checked"), // bool
        "ENSINO_FUNDAMENTAL": $("#temEnsinoFundamental").is(":checked"), // bool
        "ENSINO_MEDIO": $("#temEnsinoMedio").is(":checked"), // bool
        "ENSINO_SUPERIOR": $("#temEnsinoUniversitario").is(":checked"), // bool
        "HORARIO_MATUTINO": $("#temHorarioManha").is(":checked"), // bool
        "HORARIO_VESPERTINO": $("#temHorarioTarde").is(":checked"), // bool
        "HORARIO_NOTURNO": $("#temHorarioNoite").is(":checked"), // bool
    };
}
