import type { SimEvent, SimEventOf, SimEventType } from '../sim';

type Handler<E> = (event: E) => void;

/** Tiny typed pub/sub for SimEvents (ARCHITECTURE §6). The sim never subscribes. */
export class EventBus {
  private byType = new Map<SimEventType, Set<Handler<SimEvent>>>();
  private any = new Set<Handler<SimEvent>>();

  on<T extends SimEventType>(type: T, handler: Handler<SimEventOf<T>>): () => void {
    let set = this.byType.get(type);
    if (!set) {
      set = new Set();
      this.byType.set(type, set);
    }
    const h = handler as Handler<SimEvent>;
    set.add(h);
    return () => set.delete(h);
  }

  onAny(handler: Handler<SimEvent>): () => void {
    this.any.add(handler);
    return () => this.any.delete(handler);
  }

  emit(event: SimEvent): void {
    this.byType.get(event.type)?.forEach((h) => h(event));
    this.any.forEach((h) => h(event));
  }
}

export const bus = new EventBus();
