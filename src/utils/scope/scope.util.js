/**
 * Resuelve el alcance de acceso según el usuario autenticado.
 * - ADMIN_GENERAL: rol ADMINISTRADOR sin PuntoVentaId
 * - ADMIN_PUNTO_VENTA: rol ADMINISTRADOR con PuntoVentaId asignado
 * - VENDEDOR: rol VENDEDOR con PuntoVentaId asignado
 */
const resolverAlcanceUsuario = (usuario = {}, puntoVentaSolicitado = null) => {
  const rolNombre =
    usuario?.rolNombre ||
    usuario?.Role?.nombre ||
    usuario?.Rol?.nombre ||
    usuario?.rol ||
    "";
  const esAdmin = rolNombre === "ADMINISTRADOR";
  const esVendedor = rolNombre === "VENDEDOR";
  const puntoVentaUsuario = usuario?.PuntoVentaId ?? null;

  const esAdminGeneral = esAdmin && !puntoVentaUsuario;
  const esAdminPuntoVenta = esAdmin && Boolean(puntoVentaUsuario);

  let puntoVentaIdEfectivo = null;

  if (esAdminGeneral) {
    // Puede consultar todos ("Todos" / null / undefined) o filtrar por uno específico
    puntoVentaIdEfectivo =
      puntoVentaSolicitado && puntoVentaSolicitado !== "Todos"
        ? puntoVentaSolicitado
        : null;
  } else if (esAdminPuntoVenta || esVendedor) {
    // Siempre forzado a su propio punto de venta
    puntoVentaIdEfectivo = puntoVentaUsuario;
  }

  return {
    esAdmin,
    esAdminGeneral,
    esAdminPuntoVenta,
    esVendedor,
    puntoVentaUsuario,
    puntoVentaIdEfectivo,
  };
};

export { resolverAlcanceUsuario };
