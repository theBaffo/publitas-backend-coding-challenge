export class XmlParseError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "XmlParseError";
  }
}

export class FeedStreamError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = "FeedStreamError";
  }
}
