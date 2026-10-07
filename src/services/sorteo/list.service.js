import { Op } from 'sequelize'
import {
  Catalogos,
  Cifras,
  DetallesTicket,
  Sorteos,
  Tickets,
  sq,
} from '../../lib/db.lib.js'

const listarTodos = async (params = {}) => {
  const page = parseInt(params.page, 10) || 1
  const limit = parseInt(params.limit, 10) || 10
  const offset = (page - 1) * limit

  const { CatalogoId, jornada, CifraId, estado, fechaSorteo, numero } = params

  const whereConditions = {}
  if (CatalogoId && CatalogoId !== 'Todos')
    whereConditions.CatalogoId = CatalogoId
  if (jornada && jornada !== 'Todos') whereConditions.jornada = jornada
  if (CifraId && CifraId !== 'Todos') whereConditions.CifraId = CifraId
  if (estado && estado !== 'Todos') whereConditions.estado = estado
  if (numero && numero !== 'Todos') whereConditions.numero = numero
  if (fechaSorteo) whereConditions.fechaSorteo = fechaSorteo

  const { count, rows: sorteos } = await Sorteos.findAndCountAll({
    where: whereConditions,
    include: [
      { model: Catalogos },
      { model: Cifras },
      {
        model: Tickets,
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset,
    distinct: true,
  })

  const totalPages = Math.ceil(count / limit)
  console.log(sorteos)
  return {
    code: 200,
    sorteos,
    totalItems: count,
    totalPages,
    currentPage: page,
  }
}

const listarPorPuntoOld = async (puntoVentaId, params = {}) => {
  const page = parseInt(params.page, 10) || 1
  const limit = parseInt(params.limit, 10) || 10
  const offset = (page - 1) * limit

  // 1. Construcción dinámica del filtro
  const whereSorteo = {}

  if (params.CatalogoId && params.CatalogoId !== 'Todos') {
    whereSorteo.CatalogoId = params.CatalogoId
  }
  if (params.jornada && params.jornada !== 'Todos') {
    whereSorteo.jornada = params.jornada
  }
  if (params.CifraId && params.CifraId !== 'Todos') {
    whereSorteo.CifraId = params.CifraId
  }
  if (params.estado && params.estado !== 'Todos') {
    whereSorteo.estado = params.estado
  }
  // CORRECCIÓN: Agregamos el filtro de fechaSorteo
  if (params.fechaDesde || params.fechaHasta) {
    whereSorteo.fechaSorteo = {}

    if (params.fechaDesde && params.fechaHasta) {
      // Ambos presentes: usamos Op.between
      whereSorteo.fechaSorteo = {
        [Op.between]: [params.fechaDesde, params.fechaHasta],
      }
    } else if (params.fechaDesde) {
      // Solo desde: mayor o igual
      whereSorteo.fechaSorteo = { [Op.gte]: params.fechaDesde }
    } else if (params.fechaHasta) {
      // Solo hasta: menor o igual
      whereSorteo.fechaSorteo = { [Op.lte]: params.fechaHasta }
    }
  }

  // 2. Consulta de sorteos con el filtro aplicado
  const { count, rows } = await Sorteos.findAndCountAll({
    where: whereSorteo,
    include: [
      {
        model: Tickets,
        where: { PuntoVentaId: puntoVentaId },
        attributes: [],
        required: true, // Asegura que solo traiga sorteos con tickets en ese punto
      },
      Catalogos,
      Cifras,
    ],
    distinct: true,
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  })

  // ... (el resto de tu lógica de stats permanece igual)
  const sorteosData = await Promise.all(
    rows.map(async (sorteo) => {
      const json = sorteo.get({ plain: true })

      const statsRecaudado = await DetallesTicket.findOne({
        attributes: [[sq.fn('SUM', sq.col('montoApostado')), 'total']],
        include: [
          {
            model: Tickets,
            attributes: [],
            where: { SorteoId: sorteo.id, PuntoVentaId: puntoVentaId },
          },
        ],
        raw: true,
      })

      const statsTickets = await Tickets.findOne({
        where: { SorteoId: sorteo.id, PuntoVentaId: puntoVentaId },
        attributes: [
          [sq.fn('SUM', sq.col('montoTotalPremio')), 'totalPremios'],
          [sq.fn('COUNT', sq.col('id')), 'totalTickets'],
        ],
        raw: true,
      })

      const recaudado = parseFloat(statsRecaudado?.total || 0)
      const premios = parseFloat(statsTickets?.totalPremios || 0)

      return {
        ...json,
        totalRecaudado: recaudado.toFixed(2),
        totalPremios: premios.toFixed(2),
        utilidadNeta: (recaudado - premios).toFixed(2),
        totalTickets: parseInt(statsTickets?.totalTickets || 0),
      }
    }),
  )

  return {
    code: 200,
    sorteos: sorteosData,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  }
}

const listarParaVenderTickets = async () => {
  const sorteos = await Sorteos.findAll({
    where: {
      estado: "Abierto"
    },
    include: [Catalogos, Cifras, Tickets]
  })
  return {
    code: 200,
    sorteos
  }
}

const listarPorPunto = async (puntoVentaId, params = {}) => {
  const page = parseInt(params.page, 10) || 1
  const limit = parseInt(params.limit, 10) || 10
  const offset = (page - 1) * limit

  // 1. PRIMERO: Obtenemos de forma ligera los SorteoId únicos en los que este punto de venta ha vendido tickets.
  // Esto evita hacer un JOIN pesado en la tabla principal de Sorteos al paginar.
  const ticketsDelPunto = await Tickets.findAll({
    attributes: [[sq.fn('DISTINCT', sq.col('SorteoId')), 'SorteoId']],
    where: { PuntoVentaId: puntoVentaId },
    raw: true,
  })

  const sorteoIdsPermitidos = ticketsDelPunto.map(t => t.SorteoId)

  // Si el punto de venta no tiene ningún ticket vendido, retornamos vacío de una vez
  if (sorteoIdsPermitidos.length === 0) {
    return { code: 200, sorteos: [], totalItems: 0, totalPages: 0, currentPage: page }
  }

  // 2. Construimos los filtros normales del sorteo
  const whereSorteo = {
    id: sorteoIdsPermitidos, // Limitamos solo a los sorteos donde este punto participó
  }

  if (params.CatalogoId && params.CatalogoId !== 'Todos') {
    whereSorteo.CatalogoId = params.CatalogoId
  }
  if (params.jornada && params.jornada !== 'Todos') {
    whereSorteo.jornada = params.jornada
  }
  if (params.CifraId && params.CifraId !== 'Todos') {
    whereSorteo.CifraId = params.CifraId
  }
  if (params.estado && params.estado !== 'Todos') {
    whereSorteo.estado = params.estado
  }

  if (params.fechaDesde || params.fechaHasta) {
    if (params.fechaDesde && params.fechaHasta) {
      whereSorteo.fechaSorteo = { [Op.between]: [params.fechaDesde, params.fechaHasta] }
    } else if (params.fechaDesde) {
      whereSorteo.fechaSorteo = { [Op.gte]: params.fechaDesde }
    } else if (params.fechaHasta) {
      whereSorteo.fechaSorteo = { [Op.lte]: params.fechaHasta }
    }
  }

  // 3. SEGUNDO: Hacemos el findAndCountAll limpio sobre Sorteos SIN hacer JOINs pesados en la paginación
  const { count, rows } = await Sorteos.findAndCountAll({
    where: whereSorteo,
    include: [
      Catalogos,
      Cifras,
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
    distinct: true,
  })

  const sorteoIdsPagina = rows.map(s => s.id)

  if (sorteoIdsPagina.length === 0) {
    return { code: 200, sorteos: [], totalItems: count, totalPages: Math.ceil(count / limit), currentPage: page }
  }

  // 4. TERCERO: Consultamos las estadísticas solo para los IDs de la página actual (rápido y directo)
  const statsRecaudadoList = await DetallesTicket.findAll({
    attributes: [
      [sq.col('Ticket.SorteoId'), 'SorteoId'],
      [sq.fn('SUM', sq.col('montoApostado')), 'total']
    ],
    include: [{
      model: Tickets,
      attributes: [],
      where: { SorteoId: sorteoIdsPagina, PuntoVentaId: puntoVentaId }
    }],
    group: [sq.col('Ticket.SorteoId')],
    raw: true
  })

  const statsTicketsList = await Tickets.findAll({
    attributes: [
      'SorteoId',
      [sq.fn('SUM', sq.col('montoTotalPremio')), 'totalPremios'],
      [sq.fn('COUNT', sq.col('id')), 'totalTickets']
    ],
    where: { SorteoId: sorteoIdsPagina, PuntoVentaId: puntoVentaId },
    group: ['SorteoId'],
    raw: true
  })

  const recaudadoMap = Object.fromEntries(statsRecaudadoList.map(item => [item.SorteoId, parseFloat(item.total || 0)]))
  const ticketsMap = Object.fromEntries(statsTicketsList.map(item => [item.SorteoId, {
    premios: parseFloat(item.totalPremios || 0),
    count: parseInt(item.totalTickets || 0)
  }]))

  const sorteosData = rows.map((sorteo) => {
    const json = sorteo.get({ plain: true })
    const recaudado = recaudadoMap[sorteo.id] || 0
    const premios = ticketsMap[sorteo.id]?.premios || 0
    const totalTickets = ticketsMap[sorteo.id]?.count || 0

    return {
      ...json,
      totalRecaudado: recaudado.toFixed(2),
      totalPremios: premios.toFixed(2),
      utilidadNeta: (recaudado - premios).toFixed(2),
      totalTickets,
    }
  })

  return {
    code: 200,
    sorteos: sorteosData,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  }
}

const listarAbiertos = async (params = {}) => {
  const p = params || {}
  const page = parseInt(p.page, 10) || 1
  const limit = parseInt(p.limit, 10) || 10
  const offset = (page - 1) * limit

  // 1. Definimos los estados válidos según tu modelo
  const estadosValidos = ['Abierto', 'Cerrado', 'Finalizado']

  const whereConditions = {}

  // 2. Solo filtramos por estado si viene uno válido
  // Si p.estado es 'Todos' o cualquier otra cosa que no sea Abierto/Cerrado/Finalizado,
  // simplemente ignoramos el filtro de estado y traerá todos.
  if (p.estado && estadosValidos.includes(p.estado)) {
    whereConditions.estado = p.estado
  }

  // 3. Resto de filtros
  if (p.CatalogoId && p.CatalogoId !== 'Todos')
    whereConditions.CatalogoId = p.CatalogoId
  if (p.jornada && p.jornada !== 'Todos') whereConditions.jornada = p.jornada
  if (p.CifraId && p.CifraId !== 'Todos') whereConditions.CifraId = p.CifraId
  if (p.fechaSorteo) whereConditions.fechaSorteo = p.fechaSorteo

  const { count, rows: sorteos } = await Sorteos.findAndCountAll({
    where: whereConditions,
    include: [Catalogos, Cifras, Tickets],
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset,
    distinct: true,
  })

  return {
    code: 200,
    sorteos,
    totalItems: count,
    totalPages: Math.ceil(count / limit),
    currentPage: page,
  }
}

const listarCerrados = async (params = {}) => {
  const page = parseInt(params.page, 10) || 1
  const limit = parseInt(params.limit, 10) || 10
  const offset = (page - 1) * limit

  const { CatalogoId, jornada, CifraId, fechaSorteo } = params

  // Forzamos que el estado siempre sea 'Cerrado'
  const whereConditions = { estado: 'Cerrado' }
  if (CatalogoId && CatalogoId !== 'Todos')
    whereConditions.CatalogoId = CatalogoId
  if (jornada && jornada !== 'Todos') whereConditions.jornada = jornada
  if (CifraId && CifraId !== 'Todos') whereConditions.CifraId = CifraId
  if (fechaSorteo) whereConditions.fechaSorteo = fechaSorteo

  const { count, rows: sorteos } = await Sorteos.findAndCountAll({
    where: whereConditions,
    include: [Catalogos, Cifras, Tickets],
    order: [['createdAt', 'DESC']],
    limit: limit,
    offset: offset,
    distinct: true,
  })

  const totalPages = Math.ceil(count / limit)

  return {
    code: 200,
    sorteos,
    totalItems: count,
    totalPages,
    currentPage: page,
  }
}

export { listarAbiertos, listarCerrados, listarPorPunto, listarTodos, listarParaVenderTickets }
