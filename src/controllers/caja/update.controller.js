import { cajaServices } from "../../services/index.services.js";

const cerrarCaja = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { code, message } = await cajaServices.cerrarCaja(id, data, req.user);
    res.status(code).json({ message });
  } catch (error) {
    const msg =
      error.message ||
      "Error interno en el servidor. Intente de nuevo o contacte con un administrador.";

    res.status(500).json({
      message: msg,
    });
  }
};

const registrarInyeccion = async (req, res) => {
  try {
    const data = req.body;
    const { code, message, caja } = await cajaServices.registrarInyeccion(
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

export { cerrarCaja, registrarInyeccion };
