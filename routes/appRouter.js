const { Router } = require("express");
const appRouter = Router();
const indexController = require("../controllers/indexController");
const { validator, editValidator } = require("../controllers/validator.js");

appRouter.get("/sign-up", indexController.getSignUp);
appRouter.post("/sign-up", validator, indexController.submitSignUp);
appRouter.get("/", indexController.getIndex);

module.exports = appRouter;
