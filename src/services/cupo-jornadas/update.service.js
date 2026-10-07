import { CupoJornadas, Sorteos, Tickets } from "../../lib/db.lib.js";

export const actualizarCupo = async (id, cupoMaximo) => {
  const cupoJornada = await CupoJornadas.findByPk(id);

  if (!cupoJornada) {
    return {
      code: 404,
      message: "El cupo que desea actualizar no existe.",
    };
  }

  const { jornada, CatalogoId, CifraId } = cupoJornada;

  const sorteo = await Sorteos.findOne({
    where: {
      jornada,
      CatalogoId,
      CifraId,
    },
  });

  console.log("Sorteo: ",sorteo);

  if (sorteo) {
    const ticket = await Tickets.findAll({
      where: {
        SorteoId: sorteo.id,
      },
    });

    console.log("Tickets: ", ticket.length);

    if (ticket.length > 0) {
      return {
        code: 400,
        message:
          "No se puede actualizar el cupo ya que existen tickets vendidos para la jornada y cifra correspondiente",
      };
    }
  }

  await CupoJornadas.update(
    {
      cupoMaximo,
    },
    {
      where: {
        id,
      },
    },
  );

  return {
    code: 200,
    message: "Se actualizado el valor del cupo exitosamente",
  };
};
