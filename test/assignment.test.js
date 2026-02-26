import { test, expect } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { run } from "../assignment.js";
import { ONE_MEGA_BYTE } from "../src/utils/constants.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = path.join(__dirname, "fixtures/feed.xml");
const MAX_BATCH_SIZE = 5 * ONE_MEGA_BYTE;

function mockService() {
  const calls = [];
  return {
    call: (batch) => calls.push(JSON.parse(batch)),
    calls,
  };
}

test("processes every product in the feed", async () => {
  const service = mockService();

  await run(fs.createReadStream(FIXTURE_PATH), service, MAX_BATCH_SIZE);

  const allProducts = service.calls.flat();
  expect(allProducts).toHaveLength(3);
});

test("each product has id, title and description", async () => {
  const service = mockService();

  await run(fs.createReadStream(FIXTURE_PATH), service, MAX_BATCH_SIZE);

  for (const product of service.calls.flat()) {
    expect(product).toMatchObject({
      id: expect.any(String),
      title: expect.any(String),
      description: expect.any(String),
    });
  }
});

test("products are correct and in order", async () => {
  const service = mockService();

  await run(fs.createReadStream(FIXTURE_PATH), service, MAX_BATCH_SIZE);

  const allProducts = service.calls.flat();
  expect(allProducts[0]).toEqual({
    id: "1001",
    title: "Blue Jeans - Skinny Fit",
    description:
      "Classic blue jeans in a skinny fit. Made from stretch denim for all-day comfort.",
  });
  expect(allProducts[1]).toEqual({
    id: "1002",
    title: "Black Jeans - Straight Fit",
    description:
      "Versatile black jeans in a straight fit. Goes with everything in your wardrobe.",
  });
  expect(allProducts[2]).toEqual({
    id: "1003",
    title: "White Sneakers",
    description:
      "Clean white sneakers with a minimalist design. Comfortable for everyday wear.",
  });
});

test("no batch exceeds the max batch size", async () => {
  const service = mockService();

  await run(fs.createReadStream(FIXTURE_PATH), service, MAX_BATCH_SIZE);

  for (const batch of service.calls) {
    const size = Buffer.byteLength(JSON.stringify(batch), "utf8");
    expect(size).toBeLessThanOrEqual(MAX_BATCH_SIZE);
  }
});

test("splits products into multiple batches when the limit is tight", async () => {
  const service = mockService();

  // Force one product per batch
  const tinyLimit = 1;

  await run(fs.createReadStream(FIXTURE_PATH), service, tinyLimit);

  expect(service.calls).toHaveLength(3);
});
