import jwt from "jsonwebtoken";
import { envsConfig } from "../../config/index.config.js";

const generarToken = (usuario) => {
  const rolNombre = usuario.Role?.nombre || usuario.Rol?.nombre || null;
  const payload = {
    id: usuario.id,
    nombresCompletos: usuario.nombresCompletos,
    alias: usuario.alias,
    RolId: usuario.RolId,
    rolNombre,
    PuntoVentaId: usuario.PuntoVentaId ?? null,
  };
  const token = jwt.sign(payload, envsConfig.SECRET_WORD);

  return token;
};

const validarToken = (token) => {
  return jwt.verify(token, envsConfig.SECRET_WORD);
};

export { generarToken, validarToken };
