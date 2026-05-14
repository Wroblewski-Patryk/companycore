import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "validation_error",
      details: error.flatten()
    });
  }

  if (error.message === "cors_origin_not_allowed") {
    return res.status(403).json({
      error: "cors_origin_not_allowed"
    });
  }

  console.error(error);

  return res.status(500).json({
    error: "internal_server_error"
  });
}
