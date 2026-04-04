create table public."Usuarios" (
  "IDUsuario" uuid not null default gen_random_uuid (),
  "CveUsuario" character varying not null,
  "Password" character varying null,
  "Nombre" character varying null,
  "APaterno" character varying null,
  "AMaterno" character varying null,
  "Correo" character varying null,
  "Activo" boolean null,
  "Id_Usuario" bigint null,
  "IDCiudad" bigint null,
  "CveCiudad" character varying null,
  "IDPerfil" bigint null,
  "NombrePerfil" character varying null,
  constraint Usuarios_pkey primary key ("IDUsuario")
) TABLESPACE pg_default;