import { EventEmitter } from "events";
import sax from "sax";
import { XmlParseError, FeedStreamError } from "../errors/errors.js";

/**
 * Parses a product feed XML stream and emits:
 *   - 'product' for each parsed item
 *   - 'end'     when the feed is fully parsed
 *   - 'error'   with XmlParseError on malformed XML, FeedStreamError on I/O failures
 */
export default class ProductFeedParser extends EventEmitter {
  constructor(stream) {
    super();

    let currentItem = null;
    let currentTag = null;

    // Create a SAX stream parser in strict mode
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
        this.emit("product", currentItem);
        currentItem = null;
      }

      currentTag = null;
    });

    saxStream.on("end", () => this.emit("end"));

    saxStream.on("error", (err) =>
      this.emit("error", new XmlParseError(err.message, { cause: err })),
    );

    stream.on("error", (err) =>
      this.emit("error", new FeedStreamError(err.message, { cause: err })),
    );

    stream.pipe(saxStream);
  }
}
