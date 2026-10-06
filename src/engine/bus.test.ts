import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './bus';

describe('event bus', () => {
  it('delivers typed events to type and any subscribers; unsubscribe works', () => {
    const bus = new EventBus();
    const onSecond = vi.fn();
    const onAny = vi.fn();
    const off = bus.on('secondElapsed', onSecond);
    bus.onAny(onAny);
    bus.emit({ type: 'secondElapsed', second: 1 });
    bus.emit({ type: 'shiftStarted', nightId: 1, seed: 1 });
    expect(onSecond).toHaveBeenCalledTimes(1);
    expect(onSecond).toHaveBeenCalledWith({ type: 'secondElapsed', second: 1 });
    expect(onAny).toHaveBeenCalledTimes(2);
    off();
    bus.emit({ type: 'secondElapsed', second: 2 });
    expect(onSecond).toHaveBeenCalledTimes(1);
  });
});
