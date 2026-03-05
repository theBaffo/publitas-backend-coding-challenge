import { ServiceCallError } from "../errors/errors.js";

/**
 * Accumulates products into batches not exceeding maxBatchSize bytes and
 * forwards each completed batch to the provided service.
 *
 * @param {object} service - An object with a `call(batchJson)` method.
 * @param {number} maxBatchSize - Maximum batch size in bytes.
 * @returns {{ add(product: object): void, flush(): void }}
 */
export default function ProductBatcher(service, maxBatchSize) {
  let batch = [];
  let batchSize = 2; // Start with 2 bytes for the array brackets "[]"

  function flush() {
    if (batch.length === 0) {
      return;
    }

    try {
      const batchJson = `[${batch.join(",")}]`;
      service.call(batchJson);
    } catch (err) {
      throw new ServiceCallError(err.message, { cause: err });
    }

    batch = [];
    batchSize = 2;
  }

  function add(product) {
    const productJson = JSON.stringify(product);
    const productBytes = Buffer.byteLength(productJson, "utf8");
    const separatorBytes = batch.length > 0 ? 1 : 0; // comma between elements
    const addedBytes = productBytes + separatorBytes;

    if (batchSize + addedBytes > maxBatchSize) {
      flush();

      // After flush batch is empty, no separator is needed
      batch.push(productJson);
      batchSize += productBytes;
    } else {
      batch.push(productJson);
      batchSize += addedBytes;
    }
  }

  return { add, flush };
}
