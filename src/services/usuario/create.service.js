import { PuntosVenta, Roles, Usuarios } from "../../lib/db.lib.js";
import { bcrypUtils, scopeUtils } from "../../utils/index.utils.js";

const registrarUsuario = async (data, usuarioEjecutor = null) => {
  const { alias, clave, RolId, PuntoVentaId } = data;
  const alcanceEjecutor = usuarioEjecutor
    ? scopeUtils.resolverAlcanceUsuario(usuarioEjecutor)
    : null;

  const rolExiste = await Roles.findByPk(RolId);
  if (!rolExiste)
    return { code: 400, message: "El rol seleccionado no existe" };

  const puntoVentaIdNormalizado = PuntoVentaId || null;

  if (rolExiste.nombre === "VENDEDOR" && !puntoVentaIdNormalizado) {
    return {
      code: 400,
      message: "El rol VENDEDOR requiere un punto de venta asignado",
    };
  }

  if (puntoVentaIdNormalizado) {
    const puntoVenta = await PuntosVenta.findByPk(puntoVentaIdNormalizado);
    if (!puntoVenta) {
      return {
        code: 400,
        message: "No se encontró el punto de venta seleccionado",
      };
    }
    if (!puntoVenta.activo) {
      return {
        code: 400,
        message: "El punto de venta seleccionado está inactivo",
      };
    }
  }

  // Si un Admin de Punto de Venta crea usuarios, lo acotamos a su sucursal
  if (alcanceEjecutor?.esAdminPuntoVenta) {
    if (rolExiste.nombre === "ADMINISTRADOR" && !puntoVentaIdNormalizado) {
      return {
        code: 403,
        message: "No puedes crear un administrador global sin punto de venta",
      };
    }
    if (puntoVentaIdNormalizado !== alcanceEjecutor.puntoVentaUsuario) {
      return {
        code: 403,
        message: "Solo puedes asignar usuarios a tu propio punto de venta",
      };
    }
  }

  const user = await Usuarios.findOne({ where: { alias } });
  if (user)
    return { code: 400, message: "Ya existe un usuario con este alias" };

  const claveCifrada = await bcrypUtils.hashearClave(clave);

  await Usuarios.create({
    ...data,
    PuntoVentaId: puntoVentaIdNormalizado,
    clave: claveCifrada,
  });

  return { code: 201, message: "Usuario registrado con éxito." };
};

export { registrarUsuario };
