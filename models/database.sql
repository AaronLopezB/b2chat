create table users
(

    id              char(36)            default (uuid())                null,
    nombre_user     varchar(100)                                        not null,
    email_user      varchar(100)        unique                                not null,
    api_key         varchar(255)        unique                              null,
    b2_token        varchar(36)                                         null,
    activo          enum ('Activo', 'Inactivo', 'Cancelado')            null,
    created_at      timestamp           default CURRENT_TIMESTAMP       null
)