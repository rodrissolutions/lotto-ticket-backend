import { Roles, Usuarios } from "../../lib/db.lib.js";
import { bcrypUtils, scopeUtils } from "../../utils/index.utils.js";
const actualizarUsuario = async (id, data, user) => {
  const { RolId, clave, PuntoVentaId, ...datosParaActualizar } = data;
  const alcanceEjecutor = user ? scopeUtils.resolverAlcanceUsuario(user) : null;

  const usuario = await Usuarios.findByPk(id);
  if (!usuario) return { code: 404, message: "Usuario no encontrado." };

  if (
    alcanceEjecutor?.esAdminPuntoVenta &&
    usuario.PuntoVentaId !== alcanceEjecutor.puntoVentaUsuario
  ) {
    return {
      code: 403,
      message:
        "No tienes permisos para modificar usuarios de otro punto de venta",
    };
  }

  if (clave) {
    const esLaMisma = await bcrypUtils.compararClave(clave, usuario.clave);
    if (esLaMisma) {
      return {
        code: 400,
        message: "La nueva contraseña no puede ser igual a la anterior.",
      };
    }
    datosParaActualizar.clave = await bcrypUtils.hashearClave(clave);
  }

  let rolDestino = null;
  if (RolId) {
    rolDestino = await Roles.findByPk(RolId);
    if (!rolDestino)
      return { code: 400, message: "El rol especificado no existe." };

    if (rolDestino.nombre === "ADMINISTRADOR") {
      const rolEjecutor = await Roles.findByPk(user.RolId);
      if (!rolEjecutor || rolEjecutor.nombre !== "ADMINISTRADOR") {
        return {
          code: 403,
          message: "Permisos insuficientes para asignar roles de administrador",
        };
      }
      if (
        alcanceEjecutor?.esAdminPuntoVenta &&
        !(PuntoVentaId ?? usuario.PuntoVentaId)
      ) {
        return {
          code: 403,
          message:
            "Solo un administrador general puede crear administradores globales",
        };
      }
    }
    datosParaActualizar.RolId = RolId;
  }

  if (PuntoVentaId !== undefined) {
    const nuevoPvId = PuntoVentaId || null;
    if (
      alcanceEjecutor?.esAdminPuntoVenta &&
      nuevoPvId !== alcanceEjecutor.puntoVentaUsuario
    ) {
      return {
        code: 403,
        message: "No puedes reasignar usuarios a otro punto de venta",
      };
    }
    if (nuevoPvId) {
      const pvExiste = await PuntosVenta.findByPk(nuevoPvId);
      if (!pvExiste)
        return {
          code: 400,
          message: "El punto de venta especificado no existe",
        };
    }
    datosParaActualizar.PuntoVentaId = nuevoPvId;
  }

  await usuario.update(datosParaActualizar);

  const usuarioSinClave = usuario.toJSON();
  delete usuarioSinClave.clave;

  return {
    code: 200,
    message: "Usuario actualizado con éxito",
    data: usuarioSinClave,
  };
};

const actualizarClave = async (id, claveActual, nuevaClave) => {
  const usuario = await Usuarios.findByPk(id);

  if (!usuario) {
    return { code: 404, message: "Usuario no encontrado" };
  }

  const esCorrecta = await bcrypUtils.compararClave(claveActual, usuario.clave);

  if (!esCorrecta) {
    return {
      code: 401, // Unauthorized
      message: "La clave actual es incorrecta",
    };
  }

  // 3. Si la clave es correcta, hasheamos la nueva
  const claveCifrada = await bcrypUtils.hashearClave(nuevaClave);

  // 4. Actualizamos
  await usuario.update({
    clave: claveCifrada,
  });

  return { code: 200, message: "Tu contraseña ha sido actualizada con éxito" };
};

const restaurarUsuario = async (id) => {
  const usuario = await Usuarios.findByPk(id);
  if (!usuario) return { code: 400, message: "Usuario no encontrado" };

  if (usuario.activo)
    return { code: 400, message: "El usuario ya esta activo" };

  await usuario.update({
    activo: true,
  });

  return { code: 200, message: "Usuario restaurado con éxito" };
};

export { actualizarClave, actualizarUsuario, restaurarUsuario };
