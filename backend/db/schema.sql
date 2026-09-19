-- Create sequence for scores id
-- Sequences for F_SCO_* tables
CREATE SEQUENCE F_SCO_PESOS_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_BURO_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_PERSONAS_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_SECTOR_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_PRODUCTOS_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_SCORE_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_CAEDEC_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_MUNICIPIOS_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_COMPLEJIDADES_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_CALPROD_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_CLIMA_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE F_SCO_SOLICITUD_seq START WITH 1 INCREMENT BY 1;

-- Useful Table: the weight for each factor used to calculate our final score
CREATE TABLE F_SCO_PESOS (
  id NUMBER(10) PRIMARY KEY,
  perfil_financiero NUMBER(10),  -- weight for the financial score
  viabilidad NUMBER(10),         -- weight for the product viability from complejidades
  adopcion NUMBER(10),           -- weight for the scale and adoption from sectores
  mercado NUMBER(10),            -- weight for the market access from municipios
  riesgo_climatico NUMBER(10),   -- weight for the weather aspect of the score
  fecha     DATE                 -- date of register
);


-- Reference Table: showing the financial profile score by client provided by an external bureau
CREATE TABLE F_SCO_BURO (
    id        NUMBER(10)      PRIMARY KEY,  -- unique identifier
    ci        VARCHAR2(20),     -- identification number
    calif     VARCHAR2(2),      -- rating (A/B/etc.)
    fecha     DATE              -- date
);


-- Reference Table: showing details of the prospective client
CREATE TABLE F_SCO_PERSONAS (
    id            NUMBER(10)       PRIMARY KEY,  -- unique identifier
    nombre        VARCHAR2(100),                 -- first name(s)
    primer_apellido VARCHAR2(100),               -- first surname
    segundo_apellido VARCHAR2(100),              -- second surname
    fechanac      DATE,                          -- date of birth
    genero        VARCHAR2(10),                  -- gender (M/F/etc.)
    ci            VARCHAR2(20),                  -- identity number
    direccion     VARCHAR2(200),                 -- address
    codmunicipio  VARCHAR2(10)                   -- municipality code
);

-- Reference Table: showing how much money was earned by product and municipio
CREATE TABLE F_SCO_SECTOR (
    id            NUMBER(10)       PRIMARY KEY,  -- unique identifier
    codmunicipio  VARCHAR2(10),                  -- municipality code
    grupo         VARCHAR2(100),                 -- grupo
    producto      VARCHAR2(100),                 -- producto
    unidad        VARCHAR2(10),                  -- municipality code
    periodo       VARCHAR2(100),                 -- grupo
    valor         VARCHAR2(10)                   -- producto
);

/*THIS IS OUR OBJECT OF STUDY*/
CREATE TABLE F_SCO_SCORE (
    id            NUMBER(10) PRIMARY KEY,  -- unique identifier
    ci            VARCHAR2(20),      -- identification number
    codmunicipio  VARCHAR2(10),      -- municipality code
    caedec        VARCHAR2(20),      -- CAEDEC code
    idproducto    NUMBER(5),         -- id del producto
    idburo        NUMBER(5),         -- id del score de infocred
    score         NUMBER(5),         -- numeric score
    scoreletra   VARCHAR2(2),       -- letter score (A, B, etc.)
    fecha         DATE               -- date
);

-- Reference Table: showing description of business types
CREATE TABLE F_SCO_CAEDEC (
    id              NUMBER(10) PRIMARY KEY,  -- unique identifier
    caedec          VARCHAR2(20),       -- CAEDEC code
    actividad       VARCHAR2(500)       -- economic activity description
);

-- Reference Table: showing description of products available in the country
CREATE TABLE F_SCO_PRODUCTOS (
    id              NUMBER(10) PRIMARY KEY,  -- unique identifier
    idproducto      VARCHAR2(20),       -- product code
    descripcion     VARCHAR2(500)       -- product description
);

-- Reference Table: showing basic information of municipios
CREATE TABLE F_SCO_MUNICIPIOS (
    id            NUMBER(10) PRIMARY KEY,  -- unique identifier
    codmunicipio VARCHAR2(10),       -- municipality code
    municipio     VARCHAR2(100),      -- municipality name
    provincia     VARCHAR2(100),      -- province name
    departamento  VARCHAR2(100),      -- department name
    superficie    NUMBER(12,2),       -- area (km2)
    poblacion     NUMBER(12),         -- population
    densidad      NUMBER(12,2)        -- population density
);

-- Reference Table: showing the amount of money earned by a product in the last year by municipio
CREATE TABLE F_SCO_COMPLEJIDADES (
    id            NUMBER(10)       PRIMARY KEY,  -- unique identifier
    codmunicipio  VARCHAR2(10),                  -- municipality code
    grupo         VARCHAR2(100),                 -- grupo
    subgrupo      VARCHAR2(100),                 -- subgrupo
    fecha         DATE,                          -- fecha de obtencion de esta data
    producto      VARCHAR2(10),                  -- producto
    bs            NUMBER(10),                    -- valor de produccion el ultimo anio
    vcr           NUMBER(10),                    -- ventaja competitiva relativa
    caedec        VARCHAR2(20)                   -- codigo de caedec
);

-- Reference Table: Master crop windows based on MDRyT guidelines
CREATE TABLE F_SCO_CALPROD (
    id NUMBER(10) PRIMARY KEY,
    macroregion VARCHAR2(50) NOT NULL,       -- Altiplano, Valles, Llanos, Amazonia, Chaco
    producto VARCHAR2(50) NOT NULL,          -- Papa, Soya, Maiz, Quinua, Arroz
    estacion VARCHAR2(30) NOT NULL,          -- Verano, Invierno, Unica
    duracionminima NUMBER(10) NOT NULL,            -- e.g., 4 (for Potatoes)
    duracionmaxima NUMBER(10) NOT NULL,            -- e.g., 6 (for Potatoes)
    mesiniciooptimo NUMBER(10) NOT NULL,           -- 1 (Jan) to 12 (Dec)
    mesfinaloptimo NUMBER(10) NOT NULL             -- Last safe month to plant
);

-- Analytics Table: 10-year historic weather probabilities per month per municipality
CREATE TABLE F_SCO_CLIMA (
    id NUMBER(10) PRIMARY KEY,
    codmunicipio VARCHAR2(10),              -- municipality code
    mes NUMBER(10) CHECK (mes BETWEEN 1 AND 12),
    probhelada NUMBER(5,2),                  -- Percentage (0.00 to 100.00) for heladas
    probinundacion NUMBER(5,2),              -- Percentage for inundaciones / drowning
    probsequia NUMBER(5,2)                   -- Percentage for sequias
);