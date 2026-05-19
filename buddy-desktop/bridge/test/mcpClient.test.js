"use strict";

const assert = require("node:assert/strict");
const { PassThrough } = require("node:stream");
const readline = require("node:readline");
const test = require("node:test");
const { McpJsonRpcClient } = require("../src/mcpClient");

function createStreamPair() {
  return {
    clientInput: new PassThrough(),
    clientOutput: new PassThrough(),
  };
}

function writeResponse(stream, id, result) {
  stream.write(`${JSON.stringify({ jsonrpc: "2.0", id, result })}\n`);
}

test("initialize sends initialize request and initialized notification", async () => {
  const { clientInput, clientOutput } = createStreamPair();
  const received = [];
  const serverLines = readline.createInterface({ input: clientInput, crlfDelay: Infinity });
  serverLines.on("line", (line) => {
    const message = JSON.parse(line);
    received.push(message);
    if (message.method === "initialize") {
      writeResponse(clientOutput, message.id, { protocolVersion: message.params.protocolVersion });
    }
  });

  const client = new McpJsonRpcClient({ input: clientInput, output: clientOutput, timeoutMs: 100 });
  const result = await client.initialize();

  assert.equal(result.protocolVersion, "2024-11-05");
  assert.equal(received[0].method, "initialize");
  assert.equal(received[1].method, "notifications/initialized");
  assert.equal(Object.prototype.hasOwnProperty.call(received[1], "id"), false);
  client.close();
  serverLines.close();
});

test("callTool resolves the matching JSON-RPC id", async () => {
  const { clientInput, clientOutput } = createStreamPair();
  const serverLines = readline.createInterface({ input: clientInput, crlfDelay: Infinity });
  serverLines.on("line", (line) => {
    const message = JSON.parse(line);
    if (message.method === "tools/call") {
      writeResponse(clientOutput, message.id, {
        content: [{ type: "text", text: "ok" }],
      });
    }
  });

  const client = new McpJsonRpcClient({ input: clientInput, output: clientOutput, timeoutMs: 100 });
  const result = await client.callTool("buddy_status", {});

  assert.deepEqual(result, { content: [{ type: "text", text: "ok" }] });
  client.close();
  serverLines.close();
});

test("malformed JSON rejects pending requests with a controlled parse error", async () => {
  const { clientInput, clientOutput } = createStreamPair();
  const client = new McpJsonRpcClient({ input: clientInput, output: clientOutput, timeoutMs: 100 });

  const pending = client.request("tools/list", {});
  clientOutput.write("{not-json\n");

  await assert.rejects(pending, (error) => error.code === "parse_error");
  client.close();
});

test("timeout rejects pending requests with a controlled timeout error", async () => {
  const { clientInput, clientOutput } = createStreamPair();
  const client = new McpJsonRpcClient({ input: clientInput, output: clientOutput, timeoutMs: 20 });

  await assert.rejects(client.request("tools/list", {}), (error) => error.code === "timeout");
  client.close();
});
