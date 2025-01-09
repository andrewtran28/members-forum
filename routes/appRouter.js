const { Router } = require("express");
const appRouter = Router();
const indexController = require("../controllers/indexController");

appRouter.get("/", indexController.getIndex);

module.exports = appRouter;
