// src/app.ts
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import crypto from 'node:crypto';
import rateLimit from 'express-rate-limit';

// Create and configure the Express application
export const app = express();

// ---- 1) Trust proxy if behind a reverse proxy (DO App Platform, Nginx, etc.)
app.set('trust proxy', true);

// ---- 2) Small request-ID middleware (useful for logs & tracing)
app.use((req, _res, next) => {
  // Attach a stable request id for each incoming request
  // Avoids adding types to Request object; keep it local via symbol
  (req as unknown as Record<string, unknown>)._rid = crypto.randomUUID();
  next();
});

// ---- 3) Security & compression
app.use(helmet({ xPoweredBy: false }));
app.use(compression());

// ---- 4) Logging (dev-friendly). In prod, consider pino-http for JSON logs.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('tiny'));
}

// ---- 5) Body parsers with sane limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());

// ---- 6) CORS (tighten this to your Angular app origin)
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
app.use(
  cors({
    origin: corsOrigin,
    credentials: true, // allow cookies for JWT cookie workflows
  })
);

// ---- 7) Basic rate limiting (tune per needs)
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120, // 120 req/min per IP
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ---- 8) Health endpoints (for k8s, App Platform, uptime monitors)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get('/ready', (_req, res) => {
  // If you need to check Mongo readiness, you can inspect mongoose.connection.readyState
  res.status(200).json({ ready: true });
});

// ---- 9) API routes (mount feature routers under /api)
app.get('/api/v1/hello', (_req, res) => {
  res.json({ message: '👋 Hello from Express API' });
});

// Example: mount auth, users, etc. (keep routers in feature folders)
// import { authRouter } from './features/auth/auth.routes.js';
// app.use('/api/v1/auth', authRouter);

// ---- 10) 404 handler (after all routes)
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// ---- 11) Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Keep responses generic; log details server-side
  const status = typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 500;
  const message =
    typeof (err as { message?: string }).message === 'string' ? (err as { message: string }).message : 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[error]', err);
  }

  res.status(status).json({ error: message });
});
