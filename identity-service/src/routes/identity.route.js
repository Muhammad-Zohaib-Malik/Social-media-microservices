import express from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/identity.controller.js";
import { isAuth } from "../middleware/auth.middleware.js";

const identityRouter = express.Router();

identityRouter.post("/register", registerUser);
identityRouter.post("/login", loginUser);
identityRouter.get("/logout", isAuth,logoutUser);


export default identityRouter;
