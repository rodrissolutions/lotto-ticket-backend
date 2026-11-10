import { Sequelize } from 'sequelize'
import { libsConfig } from '../config/index.config.js'
import { models } from '../models/index.models.js'

const sq = new Sequelize(libsConfig.DATABASE_CONFIG.URI, {
  ...libsConfig.DATABASE_CONFIG.OPTIONS,
  logging: console.log, // Útil temporalmente para ver la query exacta que falla en Render logs
  pool: {
    max: 5,         // Límite de conexiones simultáneas acorde al plan de Render
    min: 0,
    acquire: 60000, // Aumentar a 60 segundos el tiempo de espera si la BD está bajo carga
    idle: 10000
  }
});

models.forEach((m) => m(sq))

const {
  Cajas,
  Catalogos,
  Cifras,
  Clientes,
  DetallesResultado,
  DetallesTicket,
  Movimientos,
  PuntosVenta,
  Resultados,
  Roles,
  Sorteos,
  Suertes,
  Tickets,
  Usuarios,
  SaldosCupo,
  Ganadores,
  DetallesSuerte,
  Backups,
  CupoJornadas
} = sq.models

Roles.hasMany(Usuarios, { foreignKey: 'RolId' })
Usuarios.belongsTo(Roles, { foreignKey: 'RolId' })

PuntosVenta.hasMany(Usuarios, { foreignKey: 'PuntoVentaId' })
Usuarios.belongsTo(PuntosVenta, { foreignKey: 'PuntoVentaId' })

PuntosVenta.hasMany(Clientes, { foreignKey: 'PuntoVentaId' })
Clientes.belongsTo(PuntosVenta, { foreignKey: 'PuntoVentaId' })

Catalogos.hasMany(Sorteos, { foreignKey: 'CatalogoId' })
Sorteos.belongsTo(Catalogos, { foreignKey: 'CatalogoId' })

Cifras.hasMany(Sorteos, { foreignKey: 'CifraId' })
Sorteos.belongsTo(Cifras, { foreignKey: 'CifraId' })

Cifras.hasMany(Suertes, { foreignKey: 'CifraId' })
Suertes.belongsTo(Cifras, { foreignKey: 'CifraId' })

Sorteos.hasMany(Tickets, { foreignKey: 'SorteoId' })
Tickets.belongsTo(Sorteos, { foreignKey: 'SorteoId' })

PuntosVenta.hasMany(Tickets, { foreignKey: 'PuntoVentaId' })
Tickets.belongsTo(PuntosVenta, { foreignKey: 'PuntoVentaId' })

Tickets.hasMany(DetallesTicket, { foreignKey: 'TicketId' })
DetallesTicket.belongsTo(Tickets, { foreignKey: 'TicketId' })

Usuarios.hasMany(Tickets, { foreignKey: 'UsuarioId' })
Tickets.belongsTo(Usuarios, { foreignKey: 'UsuarioId' })

Clientes.hasMany(Tickets, { foreignKey: 'ClienteId' })
Tickets.belongsTo(Clientes, { foreignKey: 'ClienteId' })

PuntosVenta.hasMany(Cajas, { foreignKey: 'PuntoVentaId' })
Cajas.belongsTo(PuntosVenta, { foreignKey: 'PuntoVentaId' })

Usuarios.hasMany(Cajas, { foreignKey: 'UsuarioId' })
Cajas.belongsTo(Usuarios, { foreignKey: 'UsuarioId' })

Cajas.hasMany(Movimientos, { foreignKey: 'CajaId' })
Movimientos.belongsTo(Cajas, { foreignKey: 'CajaId' })

PuntosVenta.hasMany(Movimientos, { foreignKey: 'PuntoVentaId' })
Movimientos.belongsTo(PuntosVenta, { foreignKey: 'PuntoVentaId' })

Usuarios.hasOne(Movimientos, { foreignKey: 'UsuarioId' })
Movimientos.belongsTo(Usuarios, { foreignKey: 'UsuarioId' })

Sorteos.hasOne(Resultados, { foreignKey: 'SorteoId' })
Resultados.belongsTo(Sorteos, { foreignKey: 'SorteoId' })

Resultados.hasMany(DetallesResultado, { foreignKey: 'ResultadoId' })
DetallesResultado.belongsTo(Resultados, { foreignKey: 'ResultadoId' })

// Tickets.hasMany(Resultados, { foreignKey: 'TicketId' })
// Resultados.belongsTo(Tickets, { foreignKey: 'TicketId' })

Sorteos.hasMany(SaldosCupo, { foreignKey: 'SorteoId' })
SaldosCupo.belongsTo(Sorteos, { foreignKey: 'SorteoId' })

Tickets.hasOne(Ganadores, { foreignKey: 'TicketId' })
Ganadores.belongsTo(Tickets, { foreignKey: 'TicketId' })

DetallesResultado.hasMany(Ganadores, { foreignKey: 'DetalleResultadoId' })
Ganadores.belongsTo(DetallesResultado, { foreignKey: 'DetalleResultadoId' })

Suertes.hasMany(DetallesResultado, { foreignKey: 'SuerteId' })
DetallesResultado.belongsTo(Suertes, { foreignKey: 'SuerteId' })

Suertes.hasMany(DetallesSuerte, { foreignKey: 'SuerteId' })
DetallesSuerte.belongsTo(Suertes, { foreignKey: 'SuerteId' })

PuntosVenta.hasMany(DetallesSuerte, { foreignKey: 'PuntoVentaId' })
DetallesSuerte.belongsTo(PuntosVenta, { foreignKey: 'PuntoVentaId' })


Catalogos.hasMany(CupoJornadas, { foreignKey: "CatalogoId" })
CupoJornadas.belongsTo(Catalogos, { foreignKey: "CatalogoId" })


Cifras.hasMany(CupoJornadas, { foreignKey: "CifraId" })
CupoJornadas.belongsTo(Cifras, { foreignKey: "CifraId" })


export {
  Backups,
  Cajas,
  Catalogos,
  Cifras,
  Clientes,
  CupoJornadas,
  DetallesResultado,
  DetallesSuerte,
  DetallesTicket,
  Ganadores,
  Movimientos,
  PuntosVenta,
  Resultados,
  Roles,
  SaldosCupo,
  Sorteos,
  sq,
  Suertes,
  Tickets,
  Usuarios,
}
