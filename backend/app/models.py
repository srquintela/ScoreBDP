from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, Sequence, Float
from sqlalchemy import Column, Integer, String, Numeric, DateTime, Text, Sequence, Float, CheckConstraint
from sqlalchemy.sql import func
from .db_sa import Base



# Table: F_SCO_PESOS

class F_SCO_PESOS(Base):
    __tablename__ = 'F_SCO_PESOS'

    id = Column(Integer, primary_key=True, autoincrement=True)
    perfil_financiero = Column(Numeric)
    viabilidad = Column(Numeric)
    adopcion = Column(Numeric)
    mercado = Column(Numeric)
    riesgo_climatico = Column(Numeric)
    fecha = Column(DateTime)


# Table: F_SCO_SOLICITUD (records of incoming solicitudes)

class F_SCO_SOLICITUD(Base):
    __tablename__ = 'F_SCO_SOLICITUD'

    id = Column(Integer, primary_key=True, autoincrement=True)
    ci = Column(String(20))
    codmunicipio = Column(String(10))
    caedec = Column(String(20))
    idproducto = Column(Integer)
    monto = Column(Numeric(14,2))
    messiembra = Column(Integer)
    fecha = Column(DateTime)


# Table: F_SCO_BURO
F_SCO_BURO_seq = Sequence('F_SCO_BURO_seq')
class F_SCO_BURO(Base):
    __tablename__ = 'F_SCO_BURO'

    id = Column(Integer, F_SCO_BURO_seq, primary_key=True)
    ci = Column(String(20))
    calif = Column(String(2))
    fecha = Column(DateTime)


# Table: F_SCO_PERSONAS

class F_SCO_PERSONAS(Base):
    __tablename__ = 'F_SCO_PERSONAS'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100))
    primer_apellido = Column(String(100))
    segundo_apellido = Column(String(100))
    fechanac = Column(DateTime)
    genero = Column(String(10))
    ci = Column(String(20))
    direccion = Column(String(200))
    codmunicipio = Column(String(10))


# Table: F_SCO_SECTOR
F_SCO_SECTOR_seq = Sequence('F_SCO_SECTOR_seq')
class F_SCO_SECTOR(Base):
    __tablename__ = 'F_SCO_SECTOR'

    id = Column(Integer, F_SCO_SECTOR_seq, primary_key=True)
    codmunicipio = Column(String(10))
    grupo = Column(String(100))
    producto = Column(String(100))
    unidad = Column(String(10))
    periodo = Column(String(100))
    valor = Column(String(16))


# THIS IS OUR OBJECT OF STUDY

class F_SCO_SCORE(Base):
    __tablename__ = 'F_SCO_SCORE'

    id = Column(Integer, primary_key=True, autoincrement=True)
    idsolicitud = Column(Integer)
    scorefinanciero = Column(Numeric(10,2))
    scoreviabilidad = Column(Numeric(10,2))
    scoreadopcion = Column(Numeric(10,2))
    scoremercado = Column(Numeric(10,2))
    scoreclima = Column(Numeric(10,2))
    score = Column(Numeric(10,2))
    # some DB schemas use `scoreletra` (no underscore); map Python attribute to that column name
    scoreletra = Column(String(2))
    fecha = Column(DateTime)


# Table: F_SCO_CAEDEC
F_SCO_CAEDEC_seq = Sequence('F_SCO_CAEDEC_seq')
class F_SCO_CAEDEC(Base):
    __tablename__ = 'F_SCO_CAEDEC'

    id = Column(Integer, F_SCO_CAEDEC_seq, primary_key=True)
    caedec = Column(String(20))
    actividad = Column(String(500))


# Table: F_SCO_PRODUCTOS
F_SCO_PRODUCTOS_seq = Sequence('F_SCO_PRODUCTOS_seq')
class F_SCO_PRODUCTOS(Base):
    __tablename__ = 'F_SCO_PRODUCTOS'

    id = Column(Integer, F_SCO_PRODUCTOS_seq, primary_key=True)
    idproducto = Column(String(20))
    descripcion = Column(String(500))


# Table: F_SCO_MUNICIPIOS
F_SCO_MUNICIPIOS_seq = Sequence('F_SCO_MUNICIPIOS_seq')
class F_SCO_MUNICIPIOS(Base):
    __tablename__ = 'F_SCO_MUNICIPIOS'

    id = Column(Integer, F_SCO_MUNICIPIOS_seq, primary_key=True)
    codmunicipio = Column(String(10))
    municipio = Column(String(100))
    provincia = Column(String(100))
    departamento = Column(String(100))
    superficie = Column(Numeric(12, 2))
    poblacion = Column(Integer)
    densidad = Column(Numeric(12, 2))


# Table: F_SCO_COMPLEJIDADES
F_SCO_COMPLEJIDADES_seq = Sequence('F_SCO_COMPLEJIDADES_seq')
class F_SCO_COMPLEJIDADES(Base):
    __tablename__ = 'F_SCO_COMPLEJIDADES'

    id = Column(Integer, F_SCO_COMPLEJIDADES_seq, primary_key=True)
    codmunicipio = Column(String(10))
    grupo = Column(String(100))
    subgrupo = Column(String(100))
    fecha = Column(DateTime)
    producto = Column(String(100))
    bs = Column(Numeric(14, 2))
    vcr = Column(Numeric(10, 2))
    caedec = Column(String(20))


# Table: F_SCO_CALPROD
F_SCO_CALPROD_seq = Sequence('F_SCO_CALPROD_seq')
class F_SCO_CALPROD(Base):
    __tablename__ = 'F_SCO_CALPROD'

    id = Column(Integer, F_SCO_CALPROD_seq, primary_key=True)
    macroregion = Column(String(50), nullable=False)
    producto = Column(String(50), nullable=False)
    estacion = Column(String(30), nullable=False)
    duracionminima = Column(Integer, nullable=False)
    duracionmaxima = Column(Integer, nullable=False)
    mesiniciooptimo = Column(Integer, nullable=False)
    mesfinaloptimo = Column(Integer, nullable=False)


# Table: F_SCO_CLIMA
F_SCO_CLIMA_seq = Sequence('F_SCO_CLIMA_seq')
class F_SCO_CLIMA(Base):
    __tablename__ = 'F_SCO_CLIMA'

    id = Column(Integer, F_SCO_CLIMA_seq, primary_key=True)
    codmunicipio = Column(String(10))
    mes = Column(Integer)
    probhelada = Column(Numeric(5, 2))
    probinundacion = Column(Numeric(5, 2))
    probsequia = Column(Numeric(5, 2))

