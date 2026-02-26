import { test, expect } from "@jest/globals";
import { Readable } from "stream";
import ProductFeedParser from "../../src/services/product-feed-parser.js";

function streamFrom(xml) {
  return Readable.from([xml]);
}

function collectProducts(xml) {
  return new Promise((resolve, reject) => {
    const products = [];
    const feed = ProductFeedParser(streamFrom(xml));

    feed.on("product", (p) => products.push(p));
    feed.on("end", () => resolve(products));
    feed.on("error", reject);
  });
}

test("emits one product per <item>", async () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0">
      <channel>
        <item>
          <g:id>1</g:id>
          <title>First</title>
          <description>Desc one</description>
        </item>
        <item>
          <g:id>2</g:id>
          <title>Second</title>
          <description>Desc two</description>
        </item>
      </channel>
    </rss>`;

  const products = await collectProducts(xml);

  expect(products).toHaveLength(2);
});

test("extracts id, title and description correctly", async () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0">
      <channel>
        <item>
          <g:id>42</g:id>
          <title>My Product</title>
          <description>A great product</description>
        </item>
      </channel>
    </rss>`;

  const [product] = await collectProducts(xml);

  expect(product).toEqual({
    id: "42",
    title: "My Product",
    description: "A great product",
  });
});

test("ignores unrelated tags", async () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0">
      <channel>
        <item>
          <g:id>7</g:id>
          <title>Widget</title>
          <description>Blue widget</description>
          <g:price>9.99</g:price>
          <link>https://example.com</link>
        </item>
      </channel>
    </rss>`;

  const [product] = await collectProducts(xml);

  expect(product).toEqual({
    id: "7",
    title: "Widget",
    description: "Blue widget",
  });
});

test("emits no products for an empty channel", async () => {
  const xml = `<?xml version="1.0" encoding="utf-8"?>
    <rss xmlns:g="http://base.google.com/ns/1.0">
      <channel></channel>
    </rss>`;

  const products = await collectProducts(xml);

  expect(products).toHaveLength(0);
});

test("emits an error for malformed XML", async () => {
  await expect(
    collectProducts("<rss><channel><item><unclosed>"),
  ).rejects.toThrow();
});

test("emits an error when the source stream errors", async () => {
  const stream = new Readable({ read() {} });
  process.nextTick(() => stream.emit("error", new Error("read error")));

  const promise = new Promise((resolve, reject) => {
    const feed = ProductFeedParser(stream);
    feed.on("end", resolve);
    feed.on("error", reject);
  });

  await expect(promise).rejects.toThrow("read error");
});
