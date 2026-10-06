import { describe, expect, it } from 'vitest';
import { content } from '.';
import { validateContent } from './validate';
import type { Content } from './schema';

describe('content validation', () => {
  it('shipped content is valid', () => {
    expect(validateContent(content)).toEqual([]);
  });

  it('catches broken references', () => {
    const broken: Content = {
      ...content,
      shifts: [
        {
          id: 1,
          name: 'Broken',
          tagline: 'x',
          clockStartHour: 17,
          features: [],
          beats: [
            {
              atMs: 0,
              type: 'ticket',
              ticket: {
                table: 1,
                server: 'nobody',
                guests: 1,
                courses: [{ kind: 'main', items: [{ seat: 2, menuId: 'burger', mods: ['no_such_mod'] }] }],
              },
            },
            { atMs: 0, type: 'interrupt', interrupt: 'missing' },
          ],
        },
      ],
    };
    const errors = validateContent(broken);
    expect(errors).toEqual(
      expect.arrayContaining([
        expect.stringContaining('unknown server "nobody"'),
        expect.stringContaining('mod "no_such_mod" not legal'),
        expect.stringContaining('seat 2 outside'),
        expect.stringContaining('unknown interrupt "missing"'),
      ]),
    );
  });
});
