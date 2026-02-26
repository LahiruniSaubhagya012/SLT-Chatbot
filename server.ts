import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  // Cloud Run sets PORT=8080. Fallback to 8080 for production-ready default.
  const PORT = parseInt(process.env.PORT || "8080", 10);
  const IS_PROD = process.env.NODE_ENV === "production";
  
  app.use(express.json());

  const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
  const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "slt-chatbot";
  const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

  const saveToFirestore = async (collection: string, data: any) => {
    if (!FIREBASE_API_KEY) {
      console.warn("FIREBASE_API_KEY is not set.");
      return { error: "API Key missing" };
    }
    try {
      const fields: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") fields[key] = { stringValue: value };
        else if (typeof value === "number") fields[key] = { doubleValue: value };
        else if (typeof value === "boolean") fields[key] = { booleanValue: value };
        else if (value instanceof Date) fields[key] = { timestampValue: value.toISOString() };
        else fields[key] = { stringValue: JSON.stringify(value) };
      }
      const response = await fetch(`${FIRESTORE_BASE_URL}/${collection}?key=${FIREBASE_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields }),
      });
      if (!response.ok) {
        const error = await response.json();
        console.error(`Firestore Error (${collection}):`, error);
        return { error };
      }
      return await response.json();
    } catch (err) {
      console.error(`Network Error (${collection}):`, err);
      return { error: "Network error" };
    }
  };

  app.post("/api/firestore/chat_history", async (req, res) => {
    const result = await saveToFirestore("chat_history", req.body);
    res.json(result);
  });
  app.post("/api/firestore/feedback", async (req, res) => {
    const result = await saveToFirestore("feedback", req.body);
    res.json(result);
  });
  app.post("/api/firestore/reports", async (req, res) => {
    const result = await saveToFirestore("reports", req.body);
    res.json(result);
  });

  if (!IS_PROD) {
    console.log("Starting in development mode with Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in production mode...");
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} (${IS_PROD ? "production" : "development"})`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});