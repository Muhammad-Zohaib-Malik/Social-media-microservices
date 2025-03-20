import express from "express";
import { loginUser, registerUser } from "../controllers/identity.controller.js";

const identityRouter = express.Router();

identityRouter.post("/register", registerUser);
identityRouter.post("/login", loginUser);

export default identityRouter;
