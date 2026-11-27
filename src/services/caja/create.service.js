import { Cajas } from "../../lib/db.lib.js";
import { scopeUtils } from "../../utils/index.utils.js";

const abrirCaja = async (data, usuario = null) => {
  const alcance = usuario
    ? scopeUtils.resolverAlcanceUsuario(usuario, data.PuntoVentaId)
    : null;

  if (
    alcance?.esAdminPuntoVenta &&
    data.PuntoVentaId &&
    data.PuntoVentaId !== alcance.puntoVentaIdEfectivo
  ) {
    return {
      code: 403,
      message: "No puedes abrir caja en otro punto de venta",
    };
  }

  const PuntoVentaId = alcance?.esAdminPuntoVenta
    ? alcance.puntoVentaIdEfectivo
    : data.PuntoVentaId;

  const cajaAbierta = await Cajas.findOne({
    where: {
      PuntoVentaId,
      estado: "Abierta",
    },
  });

  if (cajaAbierta)
    return {
      code: 400,
      message: "Ya existe una caja abierta para este punto de venta",
    };

  const cajaData = {
    ...data,
    PuntoVentaId,
    saldoActual: data.montoApertura,
    totalInyecciones: 0.0,
    estado: "Abierta",
  };

  const caja = await Cajas.create(cajaData);

  return {
    code: 201,
    message: "Caja abierta exitosamente para la jornada",
    caja,
  };
};

export { abrirCaja };
