// import { Op } from 'sequelize'
// import {
//   Catalogos,
//   Cifras,
//   DetallesResultado,
//   DetallesSuerte,
//   DetallesTicket,
//   PuntosVenta,
//   Resultados,
//   Sorteos,
//   Suertes,
//   Tickets,
//   Usuarios,
// } from '../../lib/db.lib.js'

// const listarTickets = async (queryParams = {}) => {
//   try {
//     const page = parseInt(queryParams.page, 10) || 1
//     const limit = parseInt(queryParams.limit, 10) || 8
//     const offset = (page - 1) * limit

//     const { PuntoVentaId, estadoLiquidacion, codigo, fechaInicio, fechaFin } =
//       queryParams

//     const whereTicket = {}
//     if (codigo) {
//       whereTicket.codigo = { [Op.iLike]: `%${codigo}%` }
//     }
//     if (PuntoVentaId && PuntoVentaId !== 'Todos') {
//       whereTicket.PuntoVentaId = PuntoVentaId
//     }

//     if (estadoLiquidacion && estadoLiquidacion !== 'Todos') {
//       if (estadoLiquidacion === 'Ganador_Pendiente') {
//         whereTicket.resultado = 'Ganador'
//         whereTicket.estado = 'Pendiente'
//       } else if (estadoLiquidacion === 'Ganador_Pagado') {
//         whereTicket.resultado = 'Ganador'
//         whereTicket.estado = 'Pagado'
//       } else if (
//         estadoLiquidacion === 'Pendiente' ||
//         estadoLiquidacion === 'No Ganador'
//       ) {
//         whereTicket.resultado = estadoLiquidacion
//       }
//     }

//     if (fechaInicio && fechaFin) {
//       whereTicket.createdAt = {
//         [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
//       }
//     } else if (fechaInicio) {
//       whereTicket.createdAt = {
//         [Op.gte]: new Date(fechaInicio),
//       }
//     } else if (fechaFin) {
//       whereTicket.createdAt = {
//         [Op.lte]: new Date(fechaFin),
//       }
//     }

//     const { count, rows } = await Tickets.findAndCountAll({
//       where: whereTicket,
//       attributes: [
//         'id',
//         'codigo',
//         'estado',
//         'resultado',
//         'montoTotalPremio',
//         'createdAt',
//         'PuntoVentaId',
//       ],
//       include: [
//         {
//           model: Sorteos,
//           attributes: [
//             'id',
//             'numero',
//             'jornada',
//             'fechaSorteo',
//             'horaSorteo',
//             'CatalogoId',
//             'CifraId',
//           ],
//           include: [
//             { model: Catalogos, attributes: ['id', 'nombre', 'pais'] },
//             { model: Cifras, attributes: ['id', 'cantidad'] },
//             /*{
//               model: Resultados,
//               attributes: ['id'],
//               include: [
//                 {
//                   model: DetallesResultado,
//                   attributes: ['id'],
//                   include: [
//                     {
//                       model: Suertes,
//                       attributes: ['id'],
//                       include: [{ model: DetallesSuerte, required: false }],
//                     },
//                   ],
//                 },
//               ],
//             },*/
//           ],
//         },
//         { model: PuntosVenta, attributes: ['id', 'nombre'] },
//         { model: Usuarios, attributes: ['id', 'nombresCompletos'] },
//         {
//           model: DetallesTicket,
//           attributes: ['id', 'numeroJugado', 'montoApostado', 'TicketId'],
//         },
//       ],
//       order: [['createdAt', 'DESC']],
//       limit: limit,
//       offset: offset,
//       distinct: true,
//     })

//     return {
//       code: 200,
//       data: {
//         tickets: rows,
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: page,
//       },
//     }
//   } catch (error) {
//     console.error('[BACKEND ERROR - listarTickets]:', error)
//     return { code: 500, message: error.message }
//   }
// }

// const listarPorPuntoDeVenta = async (id, queryParams = {}) => {
//   try {
//     const puntoVenta = await PuntosVenta.findByPk(id)
//     if (!puntoVenta)
//       return { code: 400, message: 'Punto de venta no encontrado' }

//     const {
//       page = 1,
//       limit = 8,
//       codigo,
//       estado,
//       fechaInicio,
//       fechaFin,
//     } = queryParams
//     const offset = (page - 1) * limit

//     // 1. Construcción dinámica del WHERE
//     const whereConditions = { PuntoVentaId: id }

//     console.log(codigo)

//     if (codigo) {
//       whereConditions.codigo = { [Op.iLike]: `%${codigo}%` }
//     }

//     if (estado && estado !== 'Todos') {
//       if (estado === 'Ganador_Pendiente') {
//         whereConditions.resultado = 'Ganador'
//         whereConditions.estado = 'Pendiente'
//       } else if (estado === 'Ganador_Pagado') {
//         whereConditions.resultado = 'Ganador'
//         whereConditions.estado = 'Pagado'
//       } else if (estado === 'Pendiente' || estado === 'No Ganador') {
//         whereConditions.resultado = estado
//       }
//     }

//     // Lógica de fechas (solo fechaInicio y fechaFin)
//     if (fechaInicio && fechaFin) {
//       whereConditions.createdAt = {
//         [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
//       }
//     } else if (fechaInicio) {
//       whereConditions.createdAt = { [Op.gte]: new Date(fechaInicio) }
//     } else if (fechaFin) {
//       whereConditions.createdAt = { [Op.lte]: new Date(fechaFin) }
//     }

//     // 2. Consulta a la base de datos
//     const { count, rows } = await Tickets.findAndCountAll({
//       where: whereConditions,
//       include: [
//         {
//           model: Sorteos,
//           include: [
//             Catalogos,
//             Cifras,
//             {
//               model: Resultados,
//               include: [
//                 {
//                   model: DetallesResultado,
//                   include: [
//                     {
//                       model: Suertes,
//                       include: [
//                         {
//                           model: DetallesSuerte,
//                           where: { PuntoVentaId: id },
//                           required: false,
//                         },
//                       ],
//                     },
//                   ],
//                 },
//               ],
//             },
//           ],
//         },
//         { model: PuntosVenta },
//         { model: Usuarios },
//         { model: DetallesTicket },
//       ],
//       order: [['createdAt', 'DESC']],
//       limit: parseInt(limit, 10),
//       offset: offset,
//       distinct: true,
//     })

//     return {
//       code: 200,
//       data: {
//         tickets: rows,
//         totalItems: count,
//         totalPages: Math.ceil(count / limit),
//         currentPage: parseInt(page, 10),
//       },
//     }
//   } catch (error) {
//     console.error('[BACKEND ERROR - listarPorPuntoDeVenta]:', error)
//     return { code: 500, message: error.message }
//   }
// }
// export { listarPorPuntoDeVenta, listarTickets }

import { Op } from 'sequelize'
import {
  Catalogos,
  Cifras,
  DetallesResultado,
  DetallesSuerte,
  DetallesTicket,
  PuntosVenta,
  Resultados,
  Sorteos,
  Suertes,
  Tickets,
  Usuarios,
} from '../../lib/db.lib.js'

const listarTickets = async (queryParams = {}) => {
  try {
    const page = parseInt(queryParams.page, 10) || 1
    const limit = parseInt(queryParams.limit, 10) || 8
    const offset = (page - 1) * limit

    const { PuntoVentaId, estadoLiquidacion, codigo, fechaInicio, fechaFin } =
      queryParams

    const whereTicket = {}
    if (codigo) {
      whereTicket.codigo = { [Op.iLike]: `%${codigo}%` }
    }
    if (PuntoVentaId && PuntoVentaId !== 'Todos') {
      whereTicket.PuntoVentaId = PuntoVentaId
    }

    if (estadoLiquidacion && estadoLiquidacion !== 'Todos') {
      if (estadoLiquidacion === 'Ganador_Pendiente') {
        whereTicket.resultado = 'Ganador'
        whereTicket.estado = 'Pendiente'
      } else if (estadoLiquidacion === 'Ganador_Pagado') {
        whereTicket.resultado = 'Ganador'
        whereTicket.estado = 'Pagado'
      } else if (
        estadoLiquidacion === 'Pendiente' ||
        estadoLiquidacion === 'No Ganador'
      ) {
        whereTicket.resultado = estadoLiquidacion
      }
    }

    if (fechaInicio && fechaFin) {
      whereTicket.createdAt = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    } else if (fechaInicio) {
      whereTicket.createdAt = {
        [Op.gte]: new Date(fechaInicio),
      }
    } else if (fechaFin) {
      whereTicket.createdAt = {
        [Op.lte]: new Date(fechaFin),
      }
    }

    // PASO 1: Contar y obtener SOLO los IDs paginados (Súper rápido y sin bloqueos)
    const { count, rows: ticketRows } = await Tickets.findAndCountAll({
      where: whereTicket,
      attributes: ['id'],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
      distinct: true,
    })

    if (ticketRows.length === 0) {
      return {
        code: 200,
        data: {
          tickets: [],
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
        },
      }
    }

    const ticketIds = ticketRows.map((t) => t.id)

    // PASO 2: Traer los registros completos con todas sus relaciones solo para la página actual
    const rows = await Tickets.findAll({
      where: { id: ticketIds },
      include: [
        {
          model: Sorteos,
          attributes: [
            'id',
            'numero',
            'jornada',
            'fechaSorteo',
            'horaSorteo',
            'CatalogoId',
            'CifraId',
          ],
          include: [
            { model: Catalogos, attributes: ['id', 'nombre', 'pais'] },
            { model: Cifras, attributes: ['id', 'cantidad'] },
          ],
        },
        { model: PuntosVenta, attributes: ['id', 'nombre'] },
        { model: Usuarios, attributes: ['id', 'nombresCompletos'] },
        {
          model: DetallesTicket,
          attributes: ['id', 'numeroJugado', 'montoApostado', 'TicketId'],
        },
      ],
      order: [['createdAt', 'DESC']],
    })

    return {
      code: 200,
      data: {
        tickets: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      },
    }
  } catch (error) {
    console.error('[BACKEND ERROR - listarTickets]:', error)
    return { code: 500, message: error.message }
  }
}

const listarPorPuntoDeVenta = async (id, queryParams = {}) => {
  try {
    const puntoVenta = await PuntosVenta.findByPk(id)
    if (!puntoVenta)
      return { code: 400, message: 'Punto de venta no encontrado' }

    const {
      page = 1,
      limit = 8,
      codigo,
      estado,
      fechaInicio,
      fechaFin,
    } = queryParams
    const offset = (page - 1) * limit

    const whereConditions = { PuntoVentaId: id }

    if (codigo) {
      whereConditions.codigo = { [Op.iLike]: `%${codigo}%` }
    }

    if (estado && estado !== 'Todos') {
      if (estado === 'Ganador_Pendiente') {
        whereConditions.resultado = 'Ganador'
        whereConditions.estado = 'Pendiente'
      } else if (estado === 'Ganador_Pagado') {
        whereConditions.resultado = 'Ganador'
        whereConditions.estado = 'Pagado'
      } else if (estado === 'Pendiente' || estado === 'No Ganador') {
        whereConditions.resultado = estado
      }
    }

    if (fechaInicio && fechaFin) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      }
    } else if (fechaInicio) {
      whereConditions.createdAt = { [Op.gte]: new Date(fechaInicio) }
    } else if (fechaFin) {
      whereConditions.createdAt = { [Op.lte]: new Date(fechaFin) }
    }

    // PASO 1: Contar y obtener SOLO los IDs paginados para este punto de venta
    const { count, rows: ticketRows } = await Tickets.findAndCountAll({
      where: whereConditions,
      attributes: ['id'],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: offset,
      distinct: true,
    })

    if (ticketRows.length === 0) {
      return {
        code: 200,
        data: {
          tickets: [],
          totalItems: count,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page, 10),
        },
      }
    }

    const ticketIds = ticketRows.map((t) => t.id)

    // PASO 2: Hidratar el árbol completo de relaciones exclusivamente para los IDs de la página actual
    const rows = await Tickets.findAll({
      where: { id: ticketIds },
      include: [
        {
          model: Sorteos,
          include: [
            Catalogos,
            Cifras,
            {
              model: Resultados,
              include: [
                {
                  model: DetallesResultado,
                  include: [
                    {
                      model: Suertes,
                      include: [
                        {
                          model: DetallesSuerte,
                          where: { PuntoVentaId: id },
                          required: false,
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
        { model: PuntosVenta },
        { model: Usuarios },
        { model: DetallesTicket },
      ],
      order: [['createdAt', 'DESC']],
    })

    return {
      code: 200,
      data: {
        tickets: rows,
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
      },
    }
  } catch (error) {
    console.error('[BACKEND ERROR - listarPorPuntoDeVenta]:', error)
    return { code: 500, message: error.message }
  }
}

export { listarPorPuntoDeVenta, listarTickets }
