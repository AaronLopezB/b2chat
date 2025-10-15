create table client
{
    id              char(36)            default (uuid())                null,
    nombre_empresa  varchar(100)                                        not null,
    api_key         varchar(36)                                         not null,
    b2_token        varchar(36)                                         null,
    activo          enum ('Activo', 'Inactivo', 'Cancelado')            null,
    created_at      timestamp           default CURRENT_TIMESTAMP       null,
}