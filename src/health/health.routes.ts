import { Router } from "express";
import { env } from "../config/env";

export const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "companycore",
    name: "LuckySparrow Company Core",
    build: {
      commit: env.buildCommit,
      image: env.buildImage
    }
  });
});
