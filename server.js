// server.js - backend for FreshTrack
// handles AI recipe requests and serves the static HTML/CSS/JS files

/*
====================================================================
HOW THE SERVER WORKS - EXAM PSEUDOCODE:
====================================================================
1. LOAD environment variables from .env file
2. CREATE HTTP server to handle incoming requests
3. ROUTE "/api/recipes" to AI recipe generation
4. ROUTE "/api/prices" to price comparison via Python script
5. ROUTE "everything else" to static files
====================================================================
*/

import http from "node:http";
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Mistral } from "@mistralai/mistralai";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = 3000;
const host = "127.0.0.1";


function loadEnv() {
  const file = path.join(root, ".env");
  if (!fs.existsSync(file)) return;

  fs.readFileSync(file, "utf8").split("\n").forEach(function (line) {
    const [name, ...valueParts] = line.split("=");
    const value = valueParts.join("=").trim();
    if (name && value && !process.env[name.trim()]) process.env[name.trim()] = value;
  });

}

loadEnv();

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

function readBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";
    request.on("data", function (chunk) { body += chunk; });
    request.on("end", function () {
      try { resolve(JSON.parse(body || "{}")); }
      catch (error) { reject(error); }
    });
    request.on("error", reject);
  });
}

function buildRecipeMessage(inventory, weather) {
  return [
    "You are a chef assistant. Create 2 to 4 simple recipes based on the user's groceries.",
    "Prioritise ingredients that are already in the inventory.",
    "Return ONLY a raw JSON array. Do not include markdown code fences (like ```json), intro text, or extra text.",
    "Each object in the array must strictly use these keys:",
    '- "title": name of the dish',
    '- "description": a short one-sentence summary',
    '- "prep_time": total estimated time (e.g. "25 mins")',
    '- "used_ingredients": array of ingredients found in the inventory',
    '- "missing_ingredients": array of extra ingredients needed',
    '- "instructions": array of short, sequential cooking steps',
    "Inventory: " + JSON.stringify(inventory),
    weather ? "Weather: " + JSON.stringify(weather) : ""
  ].filter(Boolean).join("\n");
}

function normalizeMessageContent(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(function (part) {
      if (typeof part === "string") return part;
      if (part && typeof part === "object") return part.text || JSON.stringify(part);
      return "";
    }).join(" ");
  }
  if (content && typeof content === "object") {
    if (typeof content.text === "string") return content.text;
    if (typeof content.content === "string") return content.content;
    return JSON.stringify(content);
  }
  return "";
}

function cleanRecipes(text) {
  const rawText = normalizeMessageContent(text);
  const withoutMarkdown = rawText.replace(/```json|```/g, "").trim();
  const start = withoutMarkdown.indexOf("[");
  const end = withoutMarkdown.lastIndexOf("]");
  if (start === -1 || end === -1) throw new Error("Mistral did not return a recipe list.");

  const recipes = JSON.parse(withoutMarkdown.slice(start, end + 1));
  if (!Array.isArray(recipes)) throw new Error("Recipe response was not a list.");
  return recipes.slice(0, 4).map(function (recipe) {
    return {
      name: String(recipe.name || "Recipe"),

      description: String(recipe.description || "A simple meal from your groceries."),
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.map(String) : [],
      steps: Array.isArray(recipe.steps) ? recipe.steps.map(String) : [],
      time: String(recipe.time || "30 minutes")
    };
  });
}

async function createRecipes(request, response) {
  if (!process.env.MISTRAL_API_KEY || process.env.MISTRAL_API_KEY === "your_mistral_api_key_here") {
    sendJson(response, 500, { error: "Add your Mistral API key to .env first." });
    return;
  }

  let body;
  try {
    body = await readBody(request);
  } catch (error) {
    sendJson(response, 400, { error: "Please send valid JSON." });
    return;
  }

  const inventory = Array.isArray(body.inventory) ? body.inventory.slice(0, 50) : [];
  if (inventory.length === 0) {
    sendJson(response, 400, { error: "Add at least one grocery item first." });
    return;
  }

  try {
    const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });
    const result = await mistral.chat.complete({
      model: "mistral-small-latest",
      messages: [{ role: "user", content: buildRecipeMessage(inventory, body.weather) }],
      temperature: 0.4
    });
    const message = result.choices?.[0]?.message;
    const text = normalizeMessageContent(message?.content ?? "");
    if (!text) {
      throw new Error("Mistral returned an empty recipe response.");
    }
    sendJson(response, 200, { recipes: cleanRecipes(text) });
  } catch (error) {
    console.error("Recipe request failed:", error.message);
    if (error.statusCode === 401 || error.status === 401) {
      sendJson(response, 502, { error: "The Mistral API key is invalid. Replace MISTRAL_API_KEY in .env with a current key, then restart the server." });
      return;
    }
    sendJson(response, 502, { error: error.message || "Mistral could not create recipes right now." });
  }
}

function searchPrices(request, response) {
  const query = new URL(request.url, "http://127.0.0.1").searchParams.get("q")?.trim();
  if (!query) {
    sendJson(response, 400, { error: "Add an item to search for." });
    return;
  }

  const scriptPath = path.join(root, "shopping_list", "compare.py");
  const python = spawn(process.env.PYTHON_EXECUTABLE || "/usr/local/bin/python3", [scriptPath, "--json", query]);
  let output = "";
  let errorOutput = "";

  python.stdout.on("data", function (chunk) { output += chunk.toString(); });
  python.stderr.on("data", function (chunk) { errorOutput += chunk.toString(); });
  python.on("error", function (error) {
    console.error("Price comparison failed:", error.message);
    sendJson(response, 502, { error: "The price comparison service is unavailable." });
  });

  python.on("close", function (code) {
    if (code !== 0) {
      console.error("Price comparison script failed:", errorOutput.trim());
      sendJson(response, 502, { error: "Could not compare prices right now." });
      return;
    }
    try {
      sendJson(response, 200, { products: JSON.parse(output || "[]") });
    } catch (error) {
      console.error("Price comparison returned invalid JSON:", error.message);
      sendJson(response, 502, { error: "The price comparison returned an invalid response." });
    }
  });
}

function serveFile(request, response) {
  const requested = request.url === "/" ? "/index.html" : request.url;
  const requestPath = requested.split("?")[0];
  const isAsset = /\.(png|jpg|jpeg|gif|webp)$/.test(requestPath);
  const filePath = path.resolve(isAsset ? root : path.join(root, "frontend"), "." + requestPath);
  const frontendRoot = path.resolve(root, "frontend");
  if (!filePath.startsWith(frontendRoot) && !isAsset) {
    response.writeHead(403); response.end("Forbidden"); return;
  }

  fs.readFile(filePath, function (error, data) {
    if (error) { response.writeHead(404); response.end("Not found"); return; }
    const extension = path.extname(filePath);
    const types = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg" };
    response.writeHead(200, {
      "Content-Type": extension === ".html"
        ? "text/html; charset=utf-8"
        : types[extension] || "application/octet-stream",
      "Cache-Control": "no-store"
    });
    response.end(data);
  });
}

const server = http.createServer(function (request, response) {
  if (request.method === "POST" && request.url === "/api/recipes") {
    createRecipes(request, response);
    return;
  }
  if (request.method === "GET" && request.url.startsWith("/api/prices")) {
    searchPrices(request, response);
    return;
  }
  if (request.method === "GET") serveFile(request, response);
  else sendJson(response, 405, { error: "Method not allowed." });
});

server.listen(port, host, function () {
  console.log("TrackFresh running at http://localhost:" + port);
});
