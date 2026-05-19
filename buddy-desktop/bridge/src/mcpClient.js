"use strict";

const readline = require("node:readline");
const {
  createInitializeParams,
  createJsonRpcNotification,
  createJsonRpcRequest,
  serializeLine,
} = require("./protocol");

class McpClientError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = "McpClientError";
    this.code = code;
    this.cause = cause;
  }
}

class McpJsonRpcClient {
  constructor({ input, output, timeoutMs = 5000, clientInfo } = {}) {
    if (!input || typeof input.write !== "function") {
      throw new McpClientError("invalid_stream", "MCP client requires a writable input stream");
    }
    if (!output || typeof output.on !== "function") {
      throw new McpClientError("invalid_stream", "MCP client requires a readable output stream");
    }

    this.input = input;
    this.output = output;
    this.timeoutMs = timeoutMs;
    this.clientInfo = clientInfo || {};
    this.nextRequestId = 1;
    this.pending = new Map();
    this.closed = false;

    this.lines = readline.createInterface({ input: output, crlfDelay: Infinity });
    this.lines.on("line", (line) => this.handleLine(line));
    this.lines.on("close", () => this.rejectAll(new McpClientError("stream_closed", "MCP output stream closed")));
    this.output.on("error", (error) => {
      this.rejectAll(new McpClientError("stream_error", error.message, error));
    });
    this.input.on?.("error", (error) => {
      this.rejectAll(new McpClientError("stream_error", error.message, error));
    });
  }

  async initialize() {
    const result = await this.request("initialize", createInitializeParams(this.clientInfo));
    this.notify("notifications/initialized", {});
    return result;
  }

  callTool(name, args = {}) {
    return this.request("tools/call", { name, arguments: args });
  }

  request(method, params = {}) {
    if (this.closed) {
      return Promise.reject(new McpClientError("client_closed", "MCP client is closed"));
    }

    const id = this.nextRequestId++;
    const message = createJsonRpcRequest(id, method, params);

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new McpClientError("timeout", `MCP request ${id} timed out after ${this.timeoutMs}ms`));
      }, this.timeoutMs);

      this.pending.set(id, { resolve, reject, timer });
      this.writeMessage(message).catch((error) => {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(error);
      });
    });
  }

  notify(method, params = {}) {
    return this.writeMessage(createJsonRpcNotification(method, params));
  }

  async writeMessage(message) {
    const line = serializeLine(message);
    await new Promise((resolve, reject) => {
      this.input.write(line, "utf8", (error) => {
        if (error) {
          reject(new McpClientError("write_failed", error.message, error));
          return;
        }
        resolve();
      });
    });
  }

  handleLine(line) {
    if (!line.trim()) {
      return;
    }

    let message;
    try {
      message = JSON.parse(line);
    } catch (error) {
      this.rejectAll(new McpClientError("parse_error", `Malformed JSON-RPC line: ${error.message}`, error));
      return;
    }

    if (Object.prototype.hasOwnProperty.call(message, "id")) {
      const pending = this.pending.get(message.id);
      if (!pending) {
        return;
      }
      clearTimeout(pending.timer);
      this.pending.delete(message.id);

      if (message.error) {
        pending.reject(new McpClientError("rpc_error", JSON.stringify(message.error)));
        return;
      }
      pending.resolve(message.result);
    }
  }

  rejectAll(error) {
    for (const [id, pending] of this.pending.entries()) {
      clearTimeout(pending.timer);
      this.pending.delete(id);
      pending.reject(error);
    }
  }

  close() {
    this.closed = true;
    this.rejectAll(new McpClientError("client_closed", "MCP client is closed"));
    this.lines.close();
  }
}

function createMcpClient(streams) {
  return new McpJsonRpcClient(streams);
}

module.exports = {
  McpClientError,
  McpJsonRpcClient,
  createMcpClient,
};
