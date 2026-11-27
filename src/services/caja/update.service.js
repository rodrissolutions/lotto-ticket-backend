import { Cajas, Movimientos, sq } from "../../lib/db.lib.js";
import { scopeUtils } from "../../utils/index.utils.js";

const cerrarCaja = async (id, data, usuario = null) => {
  const caja = await Cajas.findByPk(id);
  if (!caja) return { code: 400, message: "Caja no encontrada" };

  const alcance = usuario
    ? scopeUtils.resolverAlcanceUsuario(usuario, caja.PuntoVentaId)
    : null;
  if (
    alcance?.esAdminPuntoVenta &&
    caja.PuntoVentaId !== alcance.puntoVentaIdEfectivo
  ) {
    return {
      code: 403,
      message: "No puedes cerrar una caja de otro punto de venta",
    };
  }

  if (caja.estado === "Cerrada")
    return { code: 400, message: "La caja ya se encuentra cerrad" };

  try {
    const saldoSistemaFisico = parseFloat(caja.saldoActual);
    const montoContado = parseFloat(data.montoCierre);

    const diferencia = Number((montoContado - saldoSistemaFisico).toFixed(2));

    const inyecciones =
      (await Movimientos.sum("monto", {
        where: {
          CajaId: id,
          tipo: "Ingreso",
          categoria: "Bancos",
        },
      })) || 0;

    await caja.update({
      fechaCierre: new Date(),
      totalInyecciones: parseFloat(inyecciones),
      montoCierre: montoContado,
      diferencia: diferencia,
      estado: "Cerrada",
      observaciones:
        data.observaciones ||
        `Cierre realizado. Diferencia $${diferencia.toFixed(2)}`,
    });

    return {
      code: 200,
      message: "Caja cerrada y arqueda con éxito",
    };
  } catch (error) {
    const msg =
      error.message || "Error crítico en el servidor. Intente de nuevo";
    return { code: 500, message: msg };
  }
};

const registrarInyeccion = async (data, usuario = null) => {
  const { monto, descripcion, CajaId, UsuarioId, PuntoVentaId } = data;

  const t = await sq.transaction();

  try {
    const caja = await Cajas.findOne({
      where: {
        id: CajaId,
        estado: "Abierta",
      },
    });

    if (!caja) {
      await t.rollback();
      return {
        code: 400,
        message: "No existe una caja abierta para esta operación",
      };
    }

    const alcance = usuario
      ? scopeUtils.resolverAlcanceUsuario(usuario, caja.PuntoVentaId)
      : null;
    if (
      alcance?.esAdminPuntoVenta &&
      caja.PuntoVentaId !== alcance.puntoVentaIdEfectivo
    ) {
      await t.rollback();
      return {
        code: 403,
        message:
          "No puedes registrar movimientos en una caja de otro punto de venta",
      };
    }

    const pvEfectivo = alcance?.esAdminPuntoVenta
      ? alcance.puntoVentaIdEfectivo
      : PuntoVentaId || caja.PuntoVentaId;

    await Movimientos.create(
      {
        monto: parseFloat(monto),
        tipo: "Ingreso",
        categoria: "Bancos",
        descripcion: descripcion || "Inyección de capital a caja",
        CajaId,
        UsuarioId,
        PuntoVentaId: pvEfectivo,
      },
      {
        transaction: t,
      },
    );

    await caja.increment("saldoActual", {
      by: parseFloat(monto),
      transaction: t,
    });

    await t.commit();

    const cajaActualizada = await Cajas.findByPk(CajaId);

    return {
      code: 201,
      message: "Dinero inyectado a caja correctamente",
      caja: cajaActualizada,
    };
  } catch (error) {
    await t.rollback();
    const msg =
      error.message || "Error crítico dels servidor. Intente de nuevo.";
    return { code: 500, message: msg };
  }
};

export { cerrarCaja, registrarInyeccion };
