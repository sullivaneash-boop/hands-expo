import { describe, expect, it } from 'vitest';
import { content } from '../../data';
import { iconKeys } from './Icon';

describe('icon set', () => {
  it('has an icon for every dish and every non-doneness modifier in the data', () => {
    const needed = new Set([
      ...content.menu.map((m) => m.icon),
      ...content.mods.flatMap((m) => (m.icon ? [m.icon] : [])),
    ]);
    const missing = [...needed].filter((k) => !iconKeys.includes(k));
    expect(missing).toEqual([]);
  });
});
