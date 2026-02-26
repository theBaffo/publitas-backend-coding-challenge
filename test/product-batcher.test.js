import { test, expect } from "@jest/globals";
import ProductBatcher from "../src/services/product-batcher.js";
import { ONE_MEGA_BYTE } from "../src/utils/constants.js";

function mockService() {
  const calls = [];

  return {
    call: (batch) => calls.push(JSON.parse(batch)),
    calls,
  };
}

test("sends a batch when flush is called", () => {
  const service = mockService();
  const batcher = ProductBatcher(service, ONE_MEGA_BYTE);

  batcher.add({ id: "1", title: "Foo", description: "Bar" });
  batcher.flush();

  expect(service.calls).toHaveLength(1);
  expect(service.calls[0]).toHaveLength(1);
  expect(service.calls[0][0].id).toBe("1");
});

test("does not call service on flush when batch is empty", () => {
  const service = mockService();
  const batcher = ProductBatcher(service, ONE_MEGA_BYTE);

  batcher.flush();

  expect(service.calls).toHaveLength(0);
});

test("keeps multiple products in the same batch when under the limit", () => {
  const service = mockService();
  const batcher = ProductBatcher(service, ONE_MEGA_BYTE);

  batcher.add({ id: "1", title: "Foo", description: "Bar" });
  batcher.add({ id: "2", title: "Baz", description: "Qux" });
  batcher.flush();

  expect(service.calls).toHaveLength(1);
  expect(service.calls[0]).toHaveLength(2);
});

test("splits into a new batch when the size limit is exceeded", () => {
  const service = mockService();

  const product = { id: "1", title: "Foo", description: "Bar" };
  const productBytes = Buffer.byteLength(JSON.stringify(product), "utf8");

  // Limit: enough for exactly one product (array overhead is 2 bytes)
  const limit = 2 + productBytes;

  const batcher = ProductBatcher(service, limit);

  batcher.add(product);
  batcher.add({ id: "2", title: "Baz", description: "Qux" });
  batcher.flush();

  expect(service.calls).toHaveLength(2);
  expect(service.calls[0]).toHaveLength(1);
  expect(service.calls[1]).toHaveLength(1);
});

test("each batch does not exceed the size limit", () => {
  const service = mockService();
  const limit = 512;
  const batcher = ProductBatcher(service, limit);

  for (let i = 0; i < 20; i++) {
    batcher.add({
      id: String(i),
      title: `Product ${i}`,
      description: `Description ${i}`,
    });
  }

  batcher.flush();

  for (const batch of service.calls) {
    const size = Buffer.byteLength(JSON.stringify(batch), "utf8");
    expect(size).toBeLessThanOrEqual(limit);
  }
});
