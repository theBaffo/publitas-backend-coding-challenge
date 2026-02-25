import ExternalService from "./services/external-service.js";
import ProductFeedParser from "./services/product-feed-parser.js";
import ProductBatcher from "./services/product-batcher.js";
import { FEED_PATH, MAX_BATCH_SIZE } from "./config.js";

const batcher = ProductBatcher(ExternalService(), MAX_BATCH_SIZE);
const feed = ProductFeedParser(FEED_PATH);

feed.on("product", (product) => batcher.add(product));
feed.on("end", () => batcher.flush());
feed.on("error", (err) => {
  console.error("XML parse error:", err);
  process.exit(1);
});
