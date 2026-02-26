# Publitas Backend Coding Challenge

## Challenge Description

See [CODING_CHALLENGE.md](CODING_CHALLENGE.md) for more info about the challenge.

## How it works

- Uses a **streaming SAX parser** (`sax`) to process large product XML feed without loading it entirely into memory.
- As each `<item>` is parsed, the product is serialised to JSON and accumulated into the current batch.
- When adding a product would push the batch over the specified MB limit, the current batch is flushed to the external service and a new batch is started.
- Any remaining products are flushed when the stream ends.

## Requirements

- Node.js ≥ 18

## Configuration

### Products file

Copy the products file found [here](http://challenge.publitas.com/backend.html), or another one, into the `feeds/` folder.

### Environment Variables

Copy `.env.sample` to `.env` and adjust the values according to your needs:

```bash
cp .env.sample .env
```

| Variable         | Default            | Description                       |
| ---------------- | ------------------ | --------------------------------- |
| `FEED_PATH`      | `./feeds/feed.xml` | Path to the product feed XML file |
| `MAX_BATCH_SIZE` | `5242880` (5 MB)   | Maximum batch size in bytes       |

## Setup & Run

To setup and run the application, run the following commands:

```bash
npm install
node assignment.js
```

# Tests

To run the tests, run the following command:

```bash
npm test
```
