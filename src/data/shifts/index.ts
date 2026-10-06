import type { ShiftDef } from '../schema';
import { night1 } from './night1';
import { night2 } from './night2';
import { night3 } from './night3';
import { night4 } from './night4';
import { night5 } from './night5';

export const shifts: readonly ShiftDef[] = [night1, night2, night3, night4, night5];
