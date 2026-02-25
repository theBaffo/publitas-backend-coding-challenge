# Publitas Backend Coding Challenge

## Overview

Parses a product feed XML file, extracts `id`, `title`, and `description` from each product, and sends them in batches of up to 5 MB to an external service.

## How it works

- Uses a **streaming SAX parser** (`sax`) to process the 42 MB XML feed without loading it entirely into memory.
- As each `<item>` is parsed, the product is serialised to JSON and accumulated into the current batch.
- When adding a product would push the batch over the 5 MB limit, the current batch is flushed to the external service and a new batch is started.
- Any remaining products are flushed when the stream ends.

## Requirements

- Node.js ≥ 18

## Setup & Run

```bash
npm install
node assignment.js
```
