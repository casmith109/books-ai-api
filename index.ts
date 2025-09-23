// src/index.ts
import 'dotenv/config';
import http from 'node:http';
import process from 'node:process';
import mongoose from 'mongoose';
import { app } from './app.js';

// ---- 1) Environment (validated) ---------------------------------------------
function getEnv() {
  const {
    NODE_ENV = 'development',
    PORT = '4000',
    MONGO_URI,
    CORS_ORIGIN,
  } = process.env;

  if (!MONGO_URI) throw new Error('MONGO_URI is required');

  return {
    nodeEnv: NODE_ENV,
    port: Number(PORT),
    mongoUri: MONGO_URI,
    corsOrigin: CORS_ORIGIN ?? 'http://localhost:4200',
  } as const;
}

const env = getEnv();

// ---- 2) Mongo connection -----------------------------------------------------
async function connectMongo(uri: string) {
  // Optional: tweak Mongoose options here for performance/telemetry if needed
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  // Attach basic listeners (helpful in dev/ops)
  mongoose.connection.on('connected', () => {
    console.log('[db] connected');
  });
  mongoose.connection.on('error', (err: any) => {
    console.error('[db] error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });
}

// ---- 3) HTTP server boot -----------------------------------------------------
async function main() {
  await connectMongo(env.mongoUri);

  const server = http.createServer(app);

  // Lower idle time to shed stuck keep-alives in production (optional)
  server.keepAliveTimeout = 60_000;
  server.headersTimeout = 65_000;

  server.listen(env.port, () => {
    console.log(`[api] ${env.nodeEnv} listening on :${env.port}`);
  });

  // ---- 4) Graceful shutdown --------------------------------------------------
  const shutdown = async (signal: string) => {
    console.log(`[lifecycle] ${signal} received, shutting down...`);
    server.close((err?: Error) => {
      if (err) {
        console.error('[lifecycle] server close error:', err);
        process.exitCode = 1;
      }
    });
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error('[lifecycle] mongo disconnect error:', e);
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    console.error('[fatal] uncaughtException:', err);
    void shutdown('uncaughtException');
  });
  process.on('unhandledRejection', (reason) => {
    console.error('[fatal] unhandledRejection:', reason);
    void shutdown('unhandledRejection');
  });
}

void main();
