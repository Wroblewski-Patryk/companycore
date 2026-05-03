import { Router } from "express";
import { IntegrationError } from "../../integrations/errors";
import { acceptGoogleDriveNotification } from "../../integrations/google-drive/google-drive.webhooks";
import { asyncHandler } from "../../middleware/async-handler";

export const googleDriveWebhooksRouter = Router();

googleDriveWebhooksRouter.post("/", asyncHandler(async (req, res) => {
  try {
    const result = await acceptGoogleDriveNotification(req);
    return res.status(202).json({ data: result });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return res.status(error.status).json({ error: error.code });
    }
    throw error;
  }
}));
