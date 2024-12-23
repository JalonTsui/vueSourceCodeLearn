import { Dep } from "./dep";
import { ReactiveEffect } from "./effect";
import { toRaw } from "./reactive";
import { trackRefValue, triggerRefValue } from "./ref";
import { isFunction } from "@vue/shared";

type ComputedGetter<T> = (...args: any[]) => T;

export class ComputedRefImpl<T> {
  public dep?: Dep;
  private _value!: T;
  public readonly __v_isRef = true;
  public readonly effect: ReactiveEffect<T>;
  public _dirty = true;

  constructor(getter: ComputedGetter<T>) {
    this.effect = new ReactiveEffect(getter, () => {
      if (!this._dirty) {
        this._dirty = true;
        triggerRefValue(this);
      }
    });
  }

  get value() {
    const self = toRaw(this);
    trackRefValue(self);
    if (this._dirty) {
      this._dirty = false;
      self._value = self.effect.run()!;
    }
    return this._value;
  }
}

export function computed<T>(getterOperation: ComputedGetter<T>) {
  let getter: ComputedGetter<T>;
  if (isFunction(getterOperation)) {
    getter = getterOperation;
  }
  const cRef = new ComputedRefImpl(getter!);
  return cRef;
}
