import { cajaServices } from "../../services/index.services.js";

const abrirCaja = async (req, res) => {
  try {
    const data = req.body;
    const { code, message, caja } = await cajaServices.abrirCaja(
      data,
      req.user,
    );
    res.status(code).json(caja ? { caja, message } : { message });
  } catch (error) {
    const msg =
      error.message ||
      "Error interno en el servidor. Intente de nuevo o contacte con un administrador.";

    res.status(500).json({
      message: msg,
    });
  }
};

export { abrirCaja };
