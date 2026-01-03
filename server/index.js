import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 5175;

// Persist to a volume-mounted folder
const DATA_DIR = "/data";
const DATA_PATH = path.join(DATA_DIR, "tree.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    // If an image-based seed was copied at build time, use it; else create empty.
    const seedPath = path.resolve("./tree.json");
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, DATA_PATH);
    } else {
      fs.writeFileSync(
        DATA_PATH,
        JSON.stringify({ people: [], relationships: [], meta: { title: "Family Tree" } }, null, 2),
        "utf-8"
      );
    }
  }
}

function readTree() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
}

function writeTree(tree) {
  ensureDataFile();
  // Use compact JSON for faster writes, write async to not block the response
  fs.writeFile(DATA_PATH, JSON.stringify(tree), "utf-8", (err) => {
    if (err) console.error("Error writing tree:", err);
  });
}

app.get("/api/tree", (req, res) => {
  res.json(readTree());
});

app.put("/api/tree", (req, res) => {
  const tree = req.body;
  if (!tree || !Array.isArray(tree.people) || !Array.isArray(tree.relationships)) {
    return res.status(400).json({ error: "Invalid tree shape" });
  }
  writeTree(tree);
  res.json({ ok: true });
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`API listening on :${PORT}`);
});

