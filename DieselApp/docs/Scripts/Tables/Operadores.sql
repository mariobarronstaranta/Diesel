create table public."Operadores" (
  "IDPersonal" bigint not null,
  "CvePersonal" text null,
  "Nombre" text null,
  "APaterno" text null,
  "AMaterno" text null,
  "TipoPersonal" text null,
  "Puesto" text null,
  "CveCiudad" text null,
  "IdPlanta" bigint null,
  "Area" text null,
  "Ubicacion" text null,
  "Tipo" text null,
  constraint Operadores_pkey primary key ("IDPersonal")
) TABLESPACE pg_default;