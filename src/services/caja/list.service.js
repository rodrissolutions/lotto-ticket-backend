import { Op } from "sequelize";
import {
  Cajas,
  Movimientos,
  PuntosVenta,
  sq,
  Tickets,
  Usuarios,
} from "../../lib/db.lib.js";
import { scopeUtils } from "../../utils/index.utils.js";

const obtenerCajasAbiertas = async (usuario = null) => {
  const alcance = usuario ? scopeUtils.resolverAlcanceUsuario(usuario) : null;
  const where = { estado: "Abierta" };

  if (alcance?.esAdminPuntoVenta && alcance.puntoVentaIdEfectivo) {
    where.PuntoVentaId = alcance.puntoVentaIdEfectivo;
  }

  const cajas = await Cajas.findAll({
    where,
    order: [["createdAt", "DESC"]],
  });

  return { code: 200, cajas };
};

const obtenerCajaAbierta = async (PuntoVentaId, usuario = null) => {
  const alcance = usuario
    ? scopeUtils.resolverAlcanceUsuario(usuario, PuntoVentaId)
    : null;
  const pvEfectivo = alcance?.esAdminPuntoVenta
    ? alcance.puntoVentaIdEfectivo
    : PuntoVentaId;

  const puntoVenta = await PuntosVenta.findByPk(pvEfectivo);
  if (!puntoVenta)
    return { code: 400, message: "No se encontró el punto de venta indicado" };

  const caja = await Cajas.findOne({
    where: {
      PuntoVentaId: pvEfectivo,
      estado: "Abierta",
    },
    attributes: {
      include: [
        [
          sq.literal(`(
            SELECT COUNT(*)
            FROM "Movimientos" AS m
            WHERE m."CajaId" = "Cajas"."id"
          )`),
          "totalMovimientos",
        ],
      ],
    },
    include: [
      {
        model: Usuarios,
        attributes: ["id", "nombresCompletos", "PuntoVentaId"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return { code: 200, caja };
};

const listarTodas = async (usuario = null) => {
  const alcance = usuario ? scopeUtils.resolverAlcanceUsuario(usuario) : null;
  const where = {};

  if (alcance?.esAdminPuntoVenta && alcance.puntoVentaIdEfectivo) {
    where.PuntoVentaId = alcance.puntoVentaIdEfectivo;
  }

  const cajas = await Cajas.findAll({
    where,
    include: [
      {
        model: Movimientos,
        include: [Usuarios],
      },
      {
        model: Usuarios,
      },
      {
        model: PuntosVenta,
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return { code: 200, cajas };
};

const listarPorPuntoDeVenta = async (id, options = {}, usuario = null) => {
  try {
    const alcance = usuario
      ? scopeUtils.resolverAlcanceUsuario(usuario, id)
      : null;
    const pvEfectivo = alcance?.esAdminPuntoVenta
      ? alcance.puntoVentaIdEfectivo
      : id;

    const { fechaInicio, fechaFin, page = 1, limit = 10 } = options;
    const offset = (page - 1) * parseInt(limit);

    const fechaFiltro = {};
    if (fechaInicio && fechaFin) {
      fechaFiltro.fechaApertura = {
        [Op.between]: [new Date(fechaInicio), new Date(fechaFin)],
      };
    } else if (fechaInicio) {
      fechaFiltro.fechaApertura = { [Op.gte]: new Date(fechaInicio) };
    }

    const totalCajas = await Cajas.count({
      where: { PuntoVentaId: pvEfectivo, ...fechaFiltro },
    });

    const cajas = await Cajas.findAll({
      where: { PuntoVentaId: pvEfectivo, ...fechaFiltro },
      include: [{ model: Movimientos }],
      order: [["fechaApertura", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const todasLasCajas = await Cajas.findAll({
      where: { PuntoVentaId: pvEfectivo },
      attributes: ["id"],
    });
    const cajaIds = todasLasCajas.map((c) => c.id);

    const totalVentasGeneral =
      (await Movimientos.sum("monto", {
        where: { CajaId: { [Op.in]: cajaIds }, categoria: "Venta Ticket" },
      })) || 0;

    const totalPagadoGeneral =
      (await Movimientos.sum("monto", {
        where: { CajaId: { [Op.in]: cajaIds }, categoria: "Pago Premio" },
      })) || 0;

    const totalDeudaGeneral =
      (await Tickets.sum("montoTotalPremio", {
        where: {
          PuntoVentaId: pvEfectivo,
          estado: "Pendiente",
          resultado: "Ganador",
        },
      })) || 0;

    const cajasProcesadas = cajas.map((caja) => {
      const c = caja.toJSON();
      const v = c.Movimientos.filter(
        (m) => m.categoria === "Venta Ticket",
      ).reduce((s, m) => s + parseFloat(m.monto), 0);
      const p = c.Movimientos.filter(
        (m) => m.categoria === "Pago Premio",
      ).reduce((s, m) => s + parseFloat(m.monto), 0);
      return {
        ...c,
        stats: { totalVentas: v, totalPagado: p, balanceNeto: v - p },
      };
    });

    return {
      code: 200,
      cajas: cajasProcesadas,
      pagination: {
        totalItems: totalCajas,
        totalPages: Math.ceil(totalCajas / limit),
        currentPage: parseInt(page),
      },
      resumenGlobal: {
        totalVentasGeneral,
        totalPagadoGeneral,
        totalDeudaGeneral,
        balanceGlobal: totalVentasGeneral - totalPagadoGeneral,
      },
    };
  } catch (error) {
    return { code: 500, message: error.message };
  }
};

export {
  listarPorPuntoDeVenta,
  listarTodas,
  obtenerCajaAbierta,
  obtenerCajasAbiertas,
};
