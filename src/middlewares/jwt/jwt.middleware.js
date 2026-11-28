import { jwtUtils } from "../../utils/index.utils.js";

const verificarToken = (req, res, next) => {
  try {
    const token = req.headers["x-token"];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Token de autenticación requerido" });
    }

    req.user = jwtUtils.validarToken(token);
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
};

export { verificarToken };
