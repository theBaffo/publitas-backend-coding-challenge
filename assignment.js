import fs from "fs";
import { fileURLToPath } from "url";
import ExternalService from "./src/services/external-service.js";
import ProductFeedParser from "./src/services/product-feed-parser.js";
import ProductBatcher from "./src/services/product-batcher.js";
import { FEED_PATH, MAX_BATCH_SIZE } from "./src/configs/config.js";

export function run(stream, service, maxBatchSize) {
  return new Promise((resolve, reject) => {
    const batcher = ProductBatcher(service, maxBatchSize);
    const feed = ProductFeedParser(stream);

    feed.on("product", (product) => batcher.add(product));
    feed.on("end", () => {
      batcher.flush();
      resolve();
    });
    feed.on("error", reject);
  });
}

// Only execute when run directly, not when imported by tests
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run(fs.createReadStream(FEED_PATH), ExternalService(), MAX_BATCH_SIZE).catch(
    (err) => {
      console.error("XML parse error:", err);
      process.exit(1);
    },
  );
}
