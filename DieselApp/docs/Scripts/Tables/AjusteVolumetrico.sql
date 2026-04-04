create table public."AjusteVolumetrico" (
  "IDAjusteVolumetrico" bigint not null,
  "Temperatura" real not null,
  "FactorAjuste" real null,
  "FactorEstimado" real null,
  "Densidad" real null,
  "DensidadEstimada" real null,
  constraint AjusteVolumetrico_pkey primary key ("IDAjusteVolumetrico")
) TABLESPACE pg_default;