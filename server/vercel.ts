import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Internal Server Error:", err);
  if (!res.headersSent) {
    res.status(status).json({ message });
  }
});

const initPromise = registerRoutes(httpServer, app);

const handler = async (req: Request, res: Response) => {
  await initPromise;
  return app(req, res);
};

export default handler;
