import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "reconcilify-api",
    version: "1.0.0",
  });
});

export { router as healthRouter };
