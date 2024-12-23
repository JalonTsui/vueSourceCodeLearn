import { createDep } from "./dep";
import {
  activeEffect,
  ReactiveEffect,
  trackEffects,
  triggerEffects
} from "./effect";
import { toRaw, toReactive } from "./reactive";
import { hasChanged } from "@vue/shared";

export function ref(value?: unknown) {
  return createRef(value, false);
}

export type Dep = Set<ReactiveEffect>;

export interface Ref<T = any> {
  value: T;
}

function createRef(rawValue: unknown, shallow: boolean) {
  if (isRef(rawValue)) {
    return rawValue;
  }
  return new RefImpl(rawValue, shallow);
}

export function isRef(r: any): r is Ref {
  return !!(r && r.__v_isRef === true);
}

class RefImpl<T> {
  private _value: T;
  private _rawValue: T;
  public dep?: Dep = undefined;
  public readonly __v_isRef = true;

  constructor(value: T, public readonly __v_isShallow: boolean) {
    this._rawValue = __v_isShallow ? value : toRaw(value);
    this._value = __v_isShallow ? value : toReactive(value);
  }

  get value() {
    trackRefValue(this);
    return this._value;
  }

  set value(newVal) {
    newVal = this.__v_isShallow ? newVal : toRaw(newVal);
    if (hasChanged(newVal, this._rawValue)) {
      this._rawValue = newVal;
      this._value = this.__v_isShallow ? newVal : toReactive(newVal);
      triggerRefValue(this, newVal);
    }
  }
}

type RefBase<T> = {
  dep?: Dep;
  value: T;
};

export function trackRefValue(ref: RefBase<any>) {
  if (activeEffect) {
    trackEffects(ref.dep || (ref.dep = createDep()));
  }
}

export function triggerRefValue(ref: RefBase<any>, newVal?: any) {
  ref = toRaw(ref);
  if (ref.dep) {
    triggerEffects(ref.dep);
  }
}
