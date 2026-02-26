import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || "8080", 10);

app.use(express.json());

// Cloud Run Health Check
app.get("/health", (req, res) => res.status(200).send("OK"));

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || "slt-chatbot";
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function saveToFirestore(collection, data) {
  if (!FIREBASE_API_KEY) {
    console.warn("FIREBASE_API_KEY is not set.");
    return { error: "API Key missing" };
  }

  try {
    const fields = {};
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
}

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

/* SERVE FRONTEND */
const distPath = path.resolve(__dirname, "dist");

// Serve static files from the dist directory
app.use(express.static(distPath));

// Fallback route for SPA - serves index.html for any unknown routes
app.get("*", (req, res) => {
  const indexPath = path.join(distPath, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send("Production build not found. Please run 'npm run build' first.");
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on ${PORT}`);
});