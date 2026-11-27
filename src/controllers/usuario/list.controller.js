import { usuarioServices } from "../../services/index.services.js";

const listarUsuarios = async (req, res) => {
  try {
    const { code, usuarios } = await usuarioServices.listarUsuarios(req.user);
    res.status(code).json({ usuarios });
  } catch (error) {
    const msg =
      error.message ||
      "Error interno en el servidor. Intente de nuevo o contacte con un administrador.";

    res.status(500).json({
      message: msg,
    });
  }
};

export { listarUsuarios };
