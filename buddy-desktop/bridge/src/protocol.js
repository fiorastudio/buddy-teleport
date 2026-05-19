"use strict";

const JSONRPC_VERSION = "2.0";
const MCP_PROTOCOL_VERSION = "2024-11-05";

function createJsonRpcRequest(id, method, params = {}) {
  return {
    jsonrpc: JSONRPC_VERSION,
    id,
    method,
    params,
  };
}

function createJsonRpcNotification(method, params = {}) {
  return {
    jsonrpc: JSONRPC_VERSION,
    method,
    params,
  };
}

function createInitializeParams(clientInfo = {}) {
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    capabilities: {},
    clientInfo: {
      name: clientInfo.name || "buddy-desktop-bridge",
      version: clientInfo.version || "0.1.0",
    },
  };
}

function serializeLine(message) {
  return `${JSON.stringify(message)}\n`;
}

module.exports = {
  JSONRPC_VERSION,
  MCP_PROTOCOL_VERSION,
  createInitializeParams,
  createJsonRpcNotification,
  createJsonRpcRequest,
  serializeLine,
};
