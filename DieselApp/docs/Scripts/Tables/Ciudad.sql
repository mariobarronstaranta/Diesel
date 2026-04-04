create table public."Ciudad" (
  "IDCiudad" bigint not null,
  "Descripcion" character varying not null,
  "CveCiudad" character varying null,
  constraint Ciudad_pkey primary key ("IDCiudad")
) TABLESPACE pg_default;