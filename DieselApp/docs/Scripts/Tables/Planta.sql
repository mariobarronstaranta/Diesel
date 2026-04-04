create table public."Planta" (
  "IDPlanta" bigint not null,
  "Nombre" text null,
  "CveCiudad" text null,
  "IDCiudad" bigint null,
  constraint Planta_pkey primary key ("IDPlanta"),
  constraint Planta_IDCiudad_fkey foreign KEY ("IDCiudad") references "Ciudad" ("IDCiudad")
) TABLESPACE pg_default;