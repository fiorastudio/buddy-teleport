import assert from "node:assert/strict";
import test from "node:test";
import { promptHeartbeat } from "./fixtures.js";
import {
  NUS_RX_UUID,
  NUS_SERVICE_UUID,
  NUS_TX_UUID,
  createAdvertisementConfig,
  createPrototypePeripheral,
} from "./prototype.js";

test("advertisement config matches Claude Desktop Hardware Buddy discovery requirements", () => {
  const config = createAdvertisementConfig("ABCD");

  assert.equal(config.name, "Claude-ABCD");
  assert.equal(config.serviceUuid, NUS_SERVICE_UUID);
  assert.equal(config.rxUuid, NUS_RX_UUID);
  assert.equal(config.txUuid, NUS_TX_UUID);
});

test("prototype peripheral receives heartbeat and responds to status command", async () => {
  const sent = [];
  const peripheral = createPrototypePeripheral({
    async send(line) {
      sent.push(JSON.parse(line));
    },
  });

  await peripheral.receive(`${JSON.stringify(promptHeartbeat)}\n`);
  await peripheral.receive(`${JSON.stringify({ cmd: "status" })}\n`);

  assert.equal(peripheral.getLastHeartbeat().prompt.id, "req_abc123");
  assert.equal(sent[0].ack, "status");
  assert.equal(sent[0].ok, true);
});

test("prototype peripheral sends permission response for pending prompt", async () => {
  const sent = [];
  const peripheral = createPrototypePeripheral({
    async send(line) {
      sent.push(JSON.parse(line));
    },
  });

  await peripheral.receive(`${JSON.stringify(promptHeartbeat)}\n`);
  await peripheral.approvePrompt("deny");

  assert.deepEqual(sent[0], {
    cmd: "permission",
    id: "req_abc123",
    decision: "deny",
  });
});
