import { Op } from 'sequelize'
import {
  Catalogos,
  Cifras,
  DetallesResultado,
  DetallesSuerte,
  DetallesTicket,
  Ganadores,
  Resultados,
  Sorteos,
  sq,
  Suertes,
  Tickets,
} from '../../lib/db.lib.js'

export const actualizarResultados = async (data) => {
  const { SorteoId, resultadosArr } = data
  const t = await sq.transaction()

  try {
    // 1. Validaciones
    const sorteo = await Sorteos.findByPk(SorteoId, { transaction: t })
    if (!sorteo || sorteo.estado !== 'Finalizado') {
      throw new Error('Sorteo no encontrado o no está finalizado.')
    }

    const hayPagos = await Ganadores.count({
      include: [{ model: Tickets, where: { SorteoId, estado: 'Pagado' } }],
      transaction: t,
    })
    //if (hayPagos > 0) throw new Error('No se puede editar: existen tickets pagados.')

    // 2. Limpieza (Reversión)
    const resExistente = await Resultados.findOne({ where: { SorteoId }, transaction: t })
    if (resExistente) {
      await Ganadores.destroy({
        where: {
          DetalleResultadoId: {
            [Op.in]: (
              await DetallesResultado.findAll({
                where: { ResultadoId: resExistente.id },
                attributes: ['id'],
              })
            ).map((r) => r.id),
          },
        },
        transaction: t,
      })
      await DetallesResultado.destroy({ where: { ResultadoId: resExistente.id }, transaction: t })
      await resExistente.destroy({ transaction: t })
    }

    await Tickets.update(
      { resultado: 'Pendiente', estado: 'Pendiente', montoTotalPremio: 0 },
      { where: { SorteoId }, transaction: t }
    )

    await DetallesTicket.update(
      { montoPremio: 0 },
      {
        where: {
          TicketId: {
            [Op.in]: (await Tickets.findAll({ where: { SorteoId }, attributes: ['id'] })).map(
              (t) => t.id
            ),
          },
        },
        transaction: t,
      }
    )

    // 3. Re-procesamiento
    const nuevoResultado = await Resultados.create({ SorteoId }, { transaction: t })
    let totalPremiosSorteo = 0

    for (const res of resultadosArr) {
      const detalleRes = await DetallesResultado.create(
        {
          ResultadoId: nuevoResultado.id,
          SuerteId: res.SuerteId,
          numeroGanador: res.numeroSorteado,
        },
        { transaction: t }
      )

      const detallesGanadores = await DetallesTicket.findAll({
        include: [
          {
            model: Tickets,
            where: { SorteoId, estado: 'Pendiente' },
            attributes: ['id', 'PuntoVentaId'],
          },
        ],
        where: { numeroJugado: res.numeroSorteado },
        transaction: t,
      })

      for (const detalle of detallesGanadores) {
        const config = await DetallesSuerte.findOne({
          where: { SuerteId: res.SuerteId, PuntoVentaId: detalle.Ticket.PuntoVentaId },
          transaction: t,
        })

        const valor = parseFloat(detalle.montoApostado) * (config ? parseFloat(config.premio) : 0)

        await detalle.update({ montoPremio: valor }, { transaction: t })
        await Tickets.update(
          { resultado: 'Ganador', montoTotalPremio: sq.literal(`"montoTotalPremio" + ${valor}`) },
          { where: { id: detalle.TicketId }, transaction: t }
        )
        await Ganadores.create(
          {
            TicketId: detalle.TicketId,
            DetalleResultadoId: detalleRes.id,
            montoPremio: valor,
            fechaCaducidad: sorteo.fechaSorteo,
            estadoPago: 'Pendiente',
          },
          { transaction: t }
        )

        totalPremiosSorteo += valor
      }
    }

    await Tickets.update(
      { resultado: 'No Ganador', estado: 'Expirado' },
      { where: { SorteoId, resultado: 'Pendiente', estado: 'Pendiente' }, transaction: t }
    )

    await sorteo.update(
      {
        montoPorPagar: totalPremiosSorteo,
        utilidadNeta: parseFloat(sorteo.montoRecaudado || 0) - totalPremiosSorteo,
      },
      { transaction: t }
    )

    await t.commit()

    // 4. Retorno del objeto completo igual que en el original
    const resultadoFinal = await Resultados.findByPk(nuevoResultado.id, {
      include: [
        { model: Sorteos, include: [Catalogos, Cifras] },
        { model: DetallesResultado, include: [Suertes] },
      ],
    })

    return { code: 200, message: 'Resultados actualizados con éxito.', resultado: resultadoFinal }
  } catch (error) {
    if (t && !t.finished) await t.rollback()
    return { code: 500, message: error.message }
  }
}
