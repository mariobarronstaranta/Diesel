create table public."LoginBitacora" (
  "Id" bigserial not null,
  "CveUsuario" character varying(50) not null,
  "FechaLogin" timestamp with time zone not null default (now() AT TIME ZONE 'America/Mexico_City'::text),
  "UserAgent" character varying(500) null,
  "Exitoso" boolean not null default true,
  constraint LoginBitacora_pkey primary key ("Id")
) TABLESPACE pg_default;

create index IF not exists idx_login_bitacora_usuario on public."LoginBitacora" using btree ("CveUsuario", "FechaLogin" desc) TABLESPACE pg_default;