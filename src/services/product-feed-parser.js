import { EventEmitter } from "events";
import sax from "sax";
import { XmlParseError, FeedStreamError } from "../errors/errors.js";

/**
 * Parses a product feed XML stream and emits each product as a 'product' event.
 * Emits 'end' when the feed is fully parsed and 'error' on parse failures.
 *
 * @param {import('stream').Readable} stream - Readable stream of the XML feed.
 * @returns {EventEmitter}
 */
export default function ProductFeedParser(stream) {
  const emitter = new EventEmitter();

  let currentItem = null;
  let currentTag = null;

  // Create a SAX parser stream in strict mode
  const saxStream = sax.createStream(true);

  saxStream.on("opentag", (node) => {
    if (node.name === "item") {
      currentItem = { id: null, title: null, description: null };
    }

    currentTag = node.name;
  });

  saxStream.on("text", (text) => {
    if (!currentItem) {
      return;
    }

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

  // Track errors from both the SAX parser and the input stream
  saxStream.on("error", (err) =>
    emitter.emit("error", new XmlParseError(err.message, { cause: err })),
  );

  stream.on("error", (err) =>
    emitter.emit("error", new FeedStreamError(err.message, { cause: err })),
  );

  stream.pipe(saxStream);

  return emitter;
}
