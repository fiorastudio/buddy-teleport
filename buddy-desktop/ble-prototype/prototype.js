import {
  BleLineBuffer,
  commandAck,
  parseLine,
  permissionResponse,
  serializeFrame,
  statusAck,
} from "./protocol.js";

const NUS_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_RX_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
const NUS_TX_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

function createAdvertisementConfig(suffix = "0000") {
  return {
    name: `Claude-${suffix}`,
    serviceUuid: NUS_SERVICE_UUID,
    rxUuid: NUS_RX_UUID,
    txUuid: NUS_TX_UUID,
  };
}

function createPrototypePeripheral({ send }) {
  const lineBuffer = new BleLineBuffer();
  let lastHeartbeat = null;

  async function receive(chunk) {
    const frames = [];
    for (const line of lineBuffer.push(chunk)) {
      const frame = parseLine(line);
      frames.push(frame);

      if (frame.type === "heartbeat" || frame.type === "prompt") {
        lastHeartbeat = frame.value;
      }

      if (frame.type === "command") {
        if (frame.command === "status") {
          await send(serializeFrame(statusAck({
            name: "Buddy Desktop",
            sec: false,
            sys: { up: 0 },
          })));
        } else {
          await send(serializeFrame(commandAck(frame.command)));
        }
      }
    }
    return frames;
  }

  async function approvePrompt(decision = "once") {
    const id = lastHeartbeat?.prompt?.id;
    if (!id) {
      throw new Error("no pending prompt to approve");
    }
    await send(serializeFrame(permissionResponse(id, decision)));
  }

  return {
    advertisement: createAdvertisementConfig(),
    receive,
    approvePrompt,
    getLastHeartbeat() {
      return lastHeartbeat;
    },
  };
}

export {
  NUS_SERVICE_UUID,
  NUS_RX_UUID,
  NUS_TX_UUID,
  createAdvertisementConfig,
  createPrototypePeripheral,
};
