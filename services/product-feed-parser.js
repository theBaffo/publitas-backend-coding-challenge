import fs from "fs";
import { EventEmitter } from "events";
import sax from "sax";

/**
 * Parses a product feed XML file and emits each product as a 'product' event.
 * Emits 'end' when the feed is fully parsed and 'error' on parse failures.
 *
 * @param {string} filePath - Path to the XML feed file.
 * @returns {EventEmitter}
 */
export default function ProductFeedParser(filePath) {
  const emitter = new EventEmitter();

  let currentItem = null;
  let currentTag = null;

  const saxStream = sax.createStream(true /* strict */);

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
      emitter.emit("product", currentItem);
      currentItem = null;
    }
    currentTag = null;
  });

  saxStream.on("end", () => emitter.emit("end"));

  saxStream.on("error", (err) => emitter.emit("error", err));

  fs.createReadStream(filePath).pipe(saxStream);

  return emitter;
}
