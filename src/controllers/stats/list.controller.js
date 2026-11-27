import { statsServices } from "../../services/index.services.js";

const getDashboardStats = async (req, res) => {
  try {
    const { code, stats } = await statsServices.getStatsByUsuario(
      req.user,
      req.query.puntoVentaId,
    );

    res.status(code).json({
      stats,
    });
  } catch (error) {
    console.error("Error en getDashboardStats:", error);
    res.status(500).json({
      message: "Error al procesar las estadísticas del dashboard",
    });
  }
};

const getVendedorDashboardStats = async (req, res) => {
  try {
    const { id } = req.params;

    const { stats } = await statsServices.getVendedorStats(id);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error en getVendedorDashboardStats:", error);
    res.status(500).json({
      message: "Error al obtener estadísticas del punto de venta",
    });
  }
};

const getReportStats = async (req, res) => {
  try {
    const { fechaInicio, fechaFin, puntoVentaId } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        message:
          "Es necesario especificar una fecha de inicio y una fecha de fin.",
      });
    }

    const result = await statsServices.getReporteFinanciero(
      {
        fechaInicio,
        fechaFin,
        puntoVentaId,
      },
      req.user,
    );

    res.status(result.code).json({
      stats: result.stats,
      sucursales: result.sucursales,
    });
  } catch (error) {
    console.error("Error en getReportStats:", error);
    res.status(500).json({
      message: "Error al procesar el reporte financiero solicitado.",
    });
  }
};

export { getDashboardStats, getReportStats, getVendedorDashboardStats };
