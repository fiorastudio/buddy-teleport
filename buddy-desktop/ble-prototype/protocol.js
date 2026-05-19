const COMMANDS = new Set(['status', 'name', 'owner', 'unpair']);
const DECISIONS = new Set(['once', 'deny']);

class BleLineBuffer {
  constructor() {
    this.pending = '';
  }

  push(chunk) {
    this.pending += Buffer.isBuffer(chunk) ? chunk.toString('utf8') : String(chunk);

    const lines = [];
    let newlineIndex = this.pending.indexOf('\n');
    while (newlineIndex !== -1) {
      const rawLine = this.pending.slice(0, newlineIndex).replace(/\r$/, '');
      this.pending = this.pending.slice(newlineIndex + 1);
      if (rawLine.length > 0) {
        lines.push(rawLine);
      }
      newlineIndex = this.pending.indexOf('\n');
    }

    return lines;
  }
}

function parseLine(line) {
  const value = JSON.parse(line);

  if (isHeartbeat(value)) {
    return { type: value.prompt ? 'prompt' : 'heartbeat', value };
  }

  if (isCommand(value)) {
    return { type: 'command', command: value.cmd, value };
  }

  if (isAck(value)) {
    return { type: 'ack', ack: value.ack, value };
  }

  if (isPermissionResponse(value)) {
    return { type: 'permission', value };
  }

  return { type: 'unknown', value };
}

function serializeFrame(value) {
  return `${JSON.stringify(value)}\n`;
}

function permissionResponse(id, decision) {
  if (!id || typeof id !== 'string') {
    throw new TypeError('permission id must be a non-empty string');
  }
  if (!DECISIONS.has(decision)) {
    throw new TypeError('permission decision must be "once" or "deny"');
  }

  return { cmd: 'permission', id, decision };
}

function commandAck(command, options = {}) {
  const { ok = true, n = 0, error } = options;
  const ack = { ack: command, ok, n };
  if (error !== undefined) {
    ack.error = error;
  }
  return ack;
}

function statusAck(data = {}) {
  return {
    ack: 'status',
    ok: true,
    data,
  };
}

function isHeartbeat(value) {
  return isObject(value)
    && Number.isInteger(value.total)
    && Number.isInteger(value.running)
    && Number.isInteger(value.waiting)
    && typeof value.msg === 'string'
    && Array.isArray(value.entries)
    && Number.isInteger(value.tokens)
    && Number.isInteger(value.tokens_today);
}

function isCommand(value) {
  return isObject(value) && COMMANDS.has(value.cmd);
}

function isAck(value) {
  return isObject(value) && typeof value.ack === 'string' && typeof value.ok === 'boolean';
}

function isPermissionResponse(value) {
  return isObject(value)
    && value.cmd === 'permission'
    && typeof value.id === 'string'
    && DECISIONS.has(value.decision);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export {
  BleLineBuffer,
  parseLine,
  serializeFrame,
  permissionResponse,
  commandAck,
  statusAck,
};
