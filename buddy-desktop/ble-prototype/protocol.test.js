import assert from 'node:assert/strict';
import test from 'node:test';

import * as fixtures from './fixtures.js';
import {
  BleLineBuffer,
  parseLine,
  serializeFrame,
  permissionResponse,
  commandAck,
  statusAck,
} from './protocol.js';

test('parses heartbeat fixture', () => {
  const parsed = parseLine(JSON.stringify(fixtures.heartbeat));

  assert.equal(parsed.type, 'heartbeat');
  assert.equal(parsed.value.total, 3);
  assert.equal(parsed.value.running, 1);
  assert.equal(parsed.value.waiting, 0);
  assert.deepEqual(parsed.value.entries, ['10:41 yarn test', '10:39 reading file...']);
});

test('parses prompt heartbeat fixture', () => {
  const parsed = parseLine(JSON.stringify(fixtures.promptHeartbeat));

  assert.equal(parsed.type, 'prompt');
  assert.equal(parsed.value.waiting, 1);
  assert.deepEqual(parsed.value.prompt, {
    id: 'req_abc123',
    tool: 'Bash',
    hint: 'rm -rf /tmp/foo',
  });
});

test('parses status, name, owner, and unpair command variants', () => {
  const cases = [
    [fixtures.statusCommand, 'status'],
    [fixtures.nameCommand, 'name'],
    [fixtures.ownerCommand, 'owner'],
    [fixtures.unpairCommand, 'unpair'],
  ];

  for (const [fixture, command] of cases) {
    const parsed = parseLine(JSON.stringify(fixture));
    assert.equal(parsed.type, 'command');
    assert.equal(parsed.command, command);
    assert.deepEqual(parsed.value, fixture);
  }
});

test('line buffer emits complete newline-delimited JSON from fragmented input', () => {
  const first = serializeFrame(fixtures.heartbeat);
  const second = serializeFrame(fixtures.statusCommand);
  const buffer = new BleLineBuffer();

  assert.deepEqual(buffer.push(first.slice(0, 12)), []);
  assert.deepEqual(buffer.push(Buffer.from(first.slice(12, 35))), []);

  const firstLines = buffer.push(first.slice(35) + second.slice(0, 5));
  assert.deepEqual(firstLines, [JSON.stringify(fixtures.heartbeat)]);

  const secondLines = buffer.push(second.slice(5));
  assert.deepEqual(secondLines, [JSON.stringify(fixtures.statusCommand)]);
});

test('serializes permission responses as newline-delimited JSON', () => {
  const approve = serializeFrame(permissionResponse('req_abc123', 'once'));
  const deny = serializeFrame(permissionResponse('req_abc123', 'deny'));

  assert.equal(approve, '{"cmd":"permission","id":"req_abc123","decision":"once"}\n');
  assert.equal(deny, '{"cmd":"permission","id":"req_abc123","decision":"deny"}\n');
  assert.equal(parseLine(approve.trimEnd()).type, 'permission');
});

test('serializes generic command ack', () => {
  assert.equal(serializeFrame(commandAck('name')), '{"ack":"name","ok":true,"n":0}\n');
  assert.equal(
    serializeFrame(commandAck('unpair', { ok: false, error: 'bond erase failed' })),
    '{"ack":"unpair","ok":false,"n":0,"error":"bond erase failed"}\n',
  );
});

test('serializes and parses status ack fixture', () => {
  const frame = serializeFrame(statusAck(fixtures.statusAck.data));
  const parsed = parseLine(frame.trimEnd());

  assert.equal(frame, `${JSON.stringify(fixtures.statusAck)}\n`);
  assert.equal(parsed.type, 'ack');
  assert.equal(parsed.ack, 'status');
  assert.equal(parsed.value.data.sec, true);
  assert.equal(parsed.value.data.bat.mA, -120);
});
