import { PuntosVenta, Roles, Usuarios } from "../../lib/db.lib.js";
import { scopeUtils } from "../../utils/index.utils.js";

const listarUsuarios = async (usuarioEjecutor = null) => {
  const alcance = usuarioEjecutor
    ? scopeUtils.resolverAlcanceUsuario(usuarioEjecutor)
    : null;

  const where = {};
  if (alcance?.esAdminPuntoVenta && alcance.puntoVentaIdEfectivo) {
    where.PuntoVentaId = alcance.puntoVentaIdEfectivo;
  }

  const usuarios = await Usuarios.findAll({
    where,
    include: [Roles, PuntosVenta],
    order: [["createdAt", "DESC"]],
  });

  return { code: 200, usuarios };
};

export { listarUsuarios };
