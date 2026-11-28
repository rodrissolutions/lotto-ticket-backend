import { Router } from "express";
import { statsControllers } from "../../controllers/index.controllers.js";
import { jwtMiddlewares } from "../../middlewares/index.middlewares.js";

const statsRouter = Router();

statsRouter.use(jwtMiddlewares.verificarToken);

statsRouter.get("/listar/", statsControllers.getDashboardStats);
statsRouter.get(
  "/listar/punto-venta/:id",
  statsControllers.getVendedorDashboardStats,
);

statsRouter.get("/reporte-financiero/", statsControllers.getReportStats);

export default statsRouter;
