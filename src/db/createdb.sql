DROP TABLE IF EXISTS Usuarios;
CREATE TABLE Usuarios (
    ID         VARCHAR UNIQUE NOT NULL,
    NOME       VARCHAR NOT NULL,
    CPF        VARCHAR,
    TELEFONE   VARCHAR,
    EMAIL      VARCHAR NOT NULL,
    PASSWORD   VARCHAR NOT NULL,
    CIDADE     VARCHAR NOT NULL,
    COD_CIDADE INTEGER NOT NULL,
    ESTADO     VARCHAR NOT NULL,
    COD_ESTADO INTEGER NOT NULL,
    INIT       BOOLEAN DEFAULT (0),
    PRIMARY KEY (ID)
);

DROP TABLE IF EXISTS FazTransporte;
CREATE TABLE FazTransporte (
    ID_USUARIO         VARCHAR NOT NULL,
    COD_CIDADE_ORIGEM  INTEGER NOT NULL,
    COD_CIDADE_DESTINO INTEGER NOT NULL,
    CIDADE_ORIGEM      VARCHAR,
    CIDADE_DESTINO     VARCHAR,
    COD_ESTADO_ORIGEM  INTEGER,
    ESTADO_ORIGEM      VARCHAR,
    COD_ESTADO_DESTINO INTEGER,
    ESTADO_DESTINO     VARCHAR,

    PRIMARY KEY ( ID_USUARIO, COD_CIDADE_ORIGEM, COD_CIDADE_DESTINO )
);

DROP TABLE IF EXISTS Municipios;
CREATE TABLE Municipios (
    ID_USUARIO         VARCHAR NOT NULL,
    COD_CIDADE         INTEGER NOT NULL,
    TEM_RODOVIARIO     BOOLEAN DEFAULT (0),
    TEM_AQUAVIARIO     BOOLEAN DEFAULT (0),
    TEM_BICICLETA      BOOLEAN DEFAULT (0),
    TEM_MONITOR        BOOLEAN DEFAULT (0),
    TEM_OUTRAS_CIDADES BOOLEAN DEFAULT (0),
    DIST_MINIMA        REAL,
    PRIMARY KEY ( ID_USUARIO, COD_CIDADE ),
    FOREIGN KEY ( ID_USUARIO ) REFERENCES Usuarios ( ID )
);