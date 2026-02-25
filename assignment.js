import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import sax from "sax";
import ExternalService from "./external-service.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FEED_PATH = path.join(__dirname, "feed.xml");

const MAX_BATCH_SIZE = 5 * 1_048_576; // 5 MB in bytes

const service = ExternalService();

let currentItem = null;
let currentTag = null;
let batch = [];
let batchSize = 2; // JSON array overhead: "[]"

function flushBatch() {
  if (batch.length === 0) return;
  service.call(JSON.stringify(batch));
  batch = [];
  batchSize = 2;
}

function addProduct(product) {
  const productJson = JSON.stringify(product);
  const productBytes = Buffer.byteLength(productJson, "utf8");
  const separatorBytes = batch.length > 0 ? 1 : 0; // comma between elements
  const addedBytes = productBytes + separatorBytes;

  if (batchSize + addedBytes > MAX_BATCH_SIZE) {
    flushBatch();

    // After flush batch is empty, no separator needed
    batch.push(product);
    batchSize += productBytes;
  } else {
    batch.push(product);
    batchSize += addedBytes;
  }
}

// Initialize SAX parser in strict mode
const saxStream = sax.createStream(true);

saxStream.on("opentag", (node) => {
  if (node.name === "item") {
    currentItem = { id: null, title: null, description: null };
  }
  currentTag = node.name;
});

saxStream.on("text", (text) => {
  if (!currentItem) return;

  switch (currentTag) {
    case "g:id":
      currentItem.id = (currentItem.id ?? "") + text;
      break;
    case "title":
      currentItem.title = (currentItem.title ?? "") + text;
      break;
    case "description":
      currentItem.description = (currentItem.description ?? "") + text;
      break;
  }
});

saxStream.on("closetag", (name) => {
  if (name === "item" && currentItem) {
    addProduct(currentItem);
    currentItem = null;
  }
  currentTag = null;
});

saxStream.on("end", () => {
  flushBatch();
});

saxStream.on("error", (err) => {
  console.error("XML parse error:", err);
  process.exit(1);
});

fs.createReadStream(FEED_PATH).pipe(saxStream);
