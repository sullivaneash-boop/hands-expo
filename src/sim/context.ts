import type { Tuning } from '../config/tuning';
import type { Content } from '../data/schema';

export interface SimContext {
  tuning: Tuning;
  content: Content;
}
