import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { ONE_MEGA_BYTE } from "../utils/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const FEED_PATH = process.env.FEED_PATH
  ? path.resolve(process.env.FEED_PATH)
  : path.join(__dirname, "../../feeds/feed.xml");

export const MAX_BATCH_SIZE = process.env.MAX_BATCH_SIZE
  ? parseInt(process.env.MAX_BATCH_SIZE, 10)
  : 5 * ONE_MEGA_BYTE;
