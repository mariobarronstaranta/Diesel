create table public."Tanque" (
  "IDTanque" integer not null,
  "Nombre" text not null,
  "CveCiudad" text not null,
  "IDPlanta" integer not null,
  "Capacidad" bigint null,
  "IDTipoCombustible" integer null,
  "TipoCombustible" text null,
  "Forma" text null,
  "DiametroA" bigint null,
  "Largo" bigint null,
  idciudad character varying null,
  constraint Tanque_pkey primary key ("IDTanque"),
  constraint Tanque_IDTanque_key unique ("IDTanque"),
  constraint Tanque_IDPlanta_fkey foreign KEY ("IDPlanta") references "Planta" ("IDPlanta")
) TABLESPACE pg_default;