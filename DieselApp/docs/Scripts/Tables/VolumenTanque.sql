create table public."VolumenTanque" (
  "IDVolumenTanque" bigint not null,
  "IDTanque" bigint not null,
  "Volumen" double precision null,
  "Altura" double precision null,
  constraint VolumenTanque_pkey primary key ("IDVolumenTanque")
) TABLESPACE pg_default;