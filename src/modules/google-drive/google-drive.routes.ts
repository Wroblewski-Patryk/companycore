import { Router } from "express";
import { z } from "zod";
import { IntegrationError } from "../../integrations/errors";
import {
  createGoogleDoc,
  createGoogleSheet,
  listGoogleDriveFiles,
  readGoogleDriveFileContent,
  updateGoogleDoc,
  updateGoogleSheetValues
} from "../../integrations/google-drive/google-drive.content";
import { asyncHandler } from "../../middleware/async-handler";

const createDocSchema = z.object({
  name: z.string().min(1),
  parentId: z.string().min(1).optional(),
  initialText: z.string().optional()
}).strict();

const updateDocSchema = z.object({
  requests: z.array(z.unknown()),
  writeControl: z.record(z.unknown()).optional()
}).strict();

const createSheetSchema = z.object({
  title: z.string().min(1),
  range: z.string().min(1).optional(),
  values: z.array(z.array(z.unknown())).optional()
}).strict();

const updateSheetValuesSchema = z.object({
  range: z.string().min(1),
  values: z.array(z.array(z.unknown()))
}).strict();

export const googleDriveRouter = Router();

googleDriveRouter.get("/files", asyncHandler(async (req, res) => {
  const files = await listGoogleDriveFiles(req.auth!.workspaceId);
  res.json({ data: files });
}));

googleDriveRouter.get("/files/:id/content", asyncHandler(async (req, res) => {
  try {
    const snapshot = await readGoogleDriveFileContent({
      workspaceId: req.auth!.workspaceId,
      fileId: String(req.params.id),
      range: typeof req.query.range === "string" ? req.query.range : undefined
    });
    res.json({ data: snapshot });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

googleDriveRouter.post("/docs", asyncHandler(async (req, res) => {
  const input = createDocSchema.parse(req.body);
  try {
    const result = await createGoogleDoc({
      workspaceId: req.auth!.workspaceId,
      ...input
    });
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

googleDriveRouter.patch("/docs/:id", asyncHandler(async (req, res) => {
  const input = updateDocSchema.parse(req.body);
  try {
    const result = await updateGoogleDoc({
      workspaceId: req.auth!.workspaceId,
      fileId: String(req.params.id),
      ...input
    });
    res.json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

googleDriveRouter.post("/sheets", asyncHandler(async (req, res) => {
  const input = createSheetSchema.parse(req.body);
  try {
    const result = await createGoogleSheet({
      workspaceId: req.auth!.workspaceId,
      ...input
    });
    res.status(201).json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));

googleDriveRouter.put("/sheets/:id/values", asyncHandler(async (req, res) => {
  const input = updateSheetValuesSchema.parse(req.body);
  try {
    const result = await updateGoogleSheetValues({
      workspaceId: req.auth!.workspaceId,
      fileId: String(req.params.id),
      ...input
    });
    res.json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));
