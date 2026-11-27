import { cajaServices } from "../../services/index.services.js";

const listarTodas = async (req, res) => {
  try {
    const { code, cajas } = await cajaServices.listarTodas(req.user);
    res.status(code).json({ cajas });
  } catch (error) {
    const msg =
      error.message ||
      "Error interno en el servidor. Intente de nuevo o contacte con un administrador.";

    res.status(500).json({
      message: msg,
    });
  }
};

const listarPorPuntoDeVenta = async (req, res) => {
  try {
    const { id } = req.params;
    // Extraemos filtros y paginación de la URL (ej: /listar/punto-de-venta/123?fechaInicio=2026-06-01&page=1)
    const { fechaInicio, fechaFin, page, limit } = req.query;

    // Llamamos al servicio pasando el ID y las opciones
    const result = await cajaServices.listarPorPuntoDeVenta(
      id,
      {
        fechaInicio,
        fechaFin,
        page,
        limit,
      },
      req.user,
    );

    const { code, cajas, pagination, resumenGlobal, message } = result;

    // Si todo salió bien, enviamos toda la data, incluyendo la info de paginación
    if (code === 200) {
      return res.status(200).json({
        cajas,
        pagination, // <--- Nuevo: crucial para que el frontend sepa cuantas páginas hay
        resumenGlobal,
      });
    }

    res.status(code).json({ message });
  } catch (error) {
    console.error("ERROR EN CONTROLADOR CAJAS:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

const obtenerCajaAbierta = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, message, caja } = await cajaServices.obtenerCajaAbierta(
      id,
      req.user,
    );
    res.status(code).json(caja ? { caja } : { message });
  } catch (error) {
    console.log(error);
    const msg =
      error.message ||
      "Error interno en el servidor. Intente de nuevo o contacte con un administrador.";

    res.status(500).json({
      message: msg,
    });
  }
};

const obtenerCajasAbiertas = async (req, res) => {
  try {
    const { code, cajas } = await cajaServices.obtenerCajasAbiertas(req.user);
    res.status(code).json({ cajas });
  } catch (error) {
    const msg =
      error.message ||
      "Error interno en el servidor. Intente de nuevo o contacte con un administrador.";

    res.status(500).json({
      message: msg,
    });
  }
};

export {
  listarPorPuntoDeVenta,
  listarTodas,
  obtenerCajaAbierta,
  obtenerCajasAbiertas,
};
