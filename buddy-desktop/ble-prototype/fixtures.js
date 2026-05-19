const heartbeat = {
  total: 3,
  running: 1,
  waiting: 0,
  msg: 'working: yarn test',
  entries: ['10:41 yarn test', '10:39 reading file...'],
  tokens: 184502,
  tokens_today: 31200,
};

const promptHeartbeat = {
  total: 3,
  running: 1,
  waiting: 1,
  msg: 'approve: Bash',
  entries: ['10:42 git push', '10:41 yarn test', '10:39 reading file...'],
  tokens: 184502,
  tokens_today: 31200,
  prompt: {
    id: 'req_abc123',
    tool: 'Bash',
    hint: 'rm -rf /tmp/foo',
  },
};

const statusCommand = { cmd: 'status' };
const nameCommand = { cmd: 'name', name: 'Clawd' };
const ownerCommand = { cmd: 'owner', name: 'Felix' };
const unpairCommand = { cmd: 'unpair' };

const statusAck = {
  ack: 'status',
  ok: true,
  data: {
    name: 'Clawd',
    sec: true,
    bat: { pct: 87, mV: 4012, mA: -120, usb: true },
    sys: { up: 8412, heap: 84200 },
    stats: { appr: 42, deny: 3, vel: 8, nap: 12, lvl: 5 },
  },
};

export {
  heartbeat,
  promptHeartbeat,
  statusCommand,
  nameCommand,
  ownerCommand,
  unpairCommand,
  statusAck,
};
