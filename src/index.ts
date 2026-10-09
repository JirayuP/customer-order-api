import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import customerRoutes from "./routes/customerRoutes";
import orderRoutes from "./routes/orderRoutes";
import { prisma } from "./db/prisma";

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
const shouldAutoSeed = process.env.AUTO_SEED_ON_EMPTY_DB !== "false";

app.use(cors());
app.use(express.json());

// API Info / Health Check
app.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "Customer & Order Management Web API",
    status: "running",
    version: "1.0.0",
    database: "MySQL (smart_delivery)",
    endpoints: {
      customers: {
        listAll: "GET /api/customers",
        searchPartialName: "GET /api/customers/search?name=พลอย",
        nearby1km: "GET /api/customers/nearby?lat=16.246825&lng=103.252072&radius=1",
        getById: "GET /api/customers/:id",
        create: "POST /api/customers",
        update: "PUT|PATCH /api/customers/:id",
        delete: "DELETE /api/customers/:id",
      },
      orders: {
        seed20to30: "POST /api/orders/seed?count=25",
        listAll: "GET /api/orders",
        nearby2km: "GET /api/orders/nearby?lat=16.246825&lng=103.252072&radius=2",
        getById: "GET /api/orders/:id",
        create: "POST /api/orders",
        updateBoxAmount: "PUT|PATCH /api/orders/:id",
        deleteSingle: "DELETE /api/orders/:id",
        clearAll: "DELETE /api/orders",
      },
    },
  });
});

// Routes
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);

// 404 Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global Error Handling Middleware (ป้องกัน Express Crash จาก JSON ผิดรูปแบบ หรือ Runtime Error)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400) {
    return res.status(400).json({
      error: "รูปแบบข้อมูล JSON ใน Request Body ไม่ถูกต้อง (Invalid JSON payload format)",
    });
  }
  console.error("Server Error:", err);
  return res.status(500).json({
    error: err.message || "เกิดข้อผิดพลาดภายในระบบเซิร์ฟเวอร์",
  });
});

/**
 * Populate a newly provisioned database with 25 demonstration orders.
 * Existing orders are never replaced. Set AUTO_SEED_ON_EMPTY_DB=false to disable.
 */
const seedDemoOrdersIfNeeded = async () => {
  if (!shouldAutoSeed) return;

  try {
    const orderCount = await prisma.order.count();
    if (orderCount > 0) {
      console.log(`Skipping demo seed: ${orderCount} order(s) already exist.`);
      return;
    }

    const response = await fetch(`http://127.0.0.1:${port}/api/orders/seed?count=25`, {
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(`Seed API returned HTTP ${response.status}`);
    }

    console.log("Created 25 demo orders for the empty database.");
  } catch (err) {
    console.error("Unable to seed demo orders automatically:", err);
  }
};

const server = app.listen(port, () => {
  void seedDemoOrdersIfNeeded();
  console.log(`====================================================`);
  console.log(`🚀 Customer & Order Web API running at:`);
  console.log(`👉 http://localhost:${port}`);
  console.log(`📋 API Docs & Endpoints: http://localhost:${port}/`);
  console.log(`====================================================`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("\nShutting down gracefully...");
  await prisma.$disconnect();
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export default app;
