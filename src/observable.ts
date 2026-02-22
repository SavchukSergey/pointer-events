/** A handle that stops an active subscription when unsubscribed. */

type Subscriber<T> = (value: T) => void;
type SubscriptionTearDown = () => void;

export class Subscription {
  private readonly _teardowns: SubscriptionTearDown[] = [];
  private _closed = false;

  add(sub: { unsubscribe(): void }): void {
    if (this._closed) {
      sub.unsubscribe();
      return;
    }
    this._teardowns.push(() => sub.unsubscribe());
  }

  unsubscribe(): void {
    if (!this._closed) {
      this._closed = true;
      for (const teardown of this._teardowns) {
        teardown();
      }
      this._teardowns.length = 0;
    }
  }
}

/** A lazy push collection: subscribing runs the setup function and returns a Subscription. */
export class Observable<T> {
  constructor(
    private readonly _setup: (subscriber: { next: Subscriber<T> }) => SubscriptionTearDown | void,
  ) { }

  subscribe(callback: Subscriber<T>): Subscription {
    const sub = new Subscription();
    let active = true;
    const teardown = this._setup({
      next: (value: T) => {
        if (active) callback(value);
      },
    });
    sub.add({
      unsubscribe: () => {
        active = false;
        teardown?.();
      },
    });
    return sub;
  }

  pipe<U>(op: (source: Observable<T>) => Observable<U>): Observable<U> {
    return op(this);
  }
}

/** A multicast observable that pushes values to all current subscribers. */
export class Subject<T> extends Observable<T> {
  private _subscribers: Subscriber<T>[] = [];

  constructor() {
    super((subscriber) => {
      const { next } = subscriber;
      this._subscribers = [...this._subscribers, next];
      return () => {
        this._subscribers = this._subscribers.filter((s) => s !== next);
      };
    });
  }

  next(value: T): void {
    for (const sub of this._subscribers.slice()) {
      sub(value);
    }
  }
}

/** Creates an Observable that emits DOM events from the given target. */
export function fromEvent<T extends Event>(
  target: EventTarget,
  eventName: string,
  options?: AddEventListenerOptions,
): Observable<T> {
  return new Observable<T>((subscriber) => {
    const handler = (event: Event) => subscriber.next(event as T);
    target.addEventListener(eventName, handler, options);
    return () => target.removeEventListener(eventName, handler, options);
  });
}

/** Creates an Observable that emits whenever any of the given Observables emit. */
export function merge<T>(...observables: Observable<T>[]): Observable<T> {
  return new Observable<T>((subscriber) => {
    const subs = observables.map((obs) =>
      obs.subscribe((value) => subscriber.next(value)),
    );

    return () => {
      for (const sub of subs) {
        sub.unsubscribe();
      }
    };
  });
}

/** Transforms each emitted value using the given mapping function. */
export function map<T, U>(fn: (value: T) => U): (source: Observable<T>) => Observable<U> {
  return (source: Observable<T>) => new Observable<U>((subscriber) => {
    const sub = source.subscribe((value) => subscriber.next(fn(value)));

    return () => sub.unsubscribe();
  });
}

/** Passes through only the values for which the predicate returns true. */
export function filter<T>(predicate: (value: T) => boolean): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>) => new Observable<T>((subscriber) => {
    const sub = source.subscribe((value) => {
      if (predicate(value)) subscriber.next(value);
    });

    return () => sub.unsubscribe();
  });
}
