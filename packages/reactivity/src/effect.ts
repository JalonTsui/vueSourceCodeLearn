import { createDep, Dep } from "./dep";
// 当前运行的作用域
export let activeEffect: ReactiveEffect | undefined;

// 响应式数据的作用域
export class ReactiveEffect<T = any> {
  constructor(public fn: () => T) {}

  run() {
    activeEffect = this;
    this.fn();
  }
}

export function effect<T = any>(fn: () => T) {
  const _effect = new ReactiveEffect(fn);
  _effect.run();
}

type KeyToDeps = Map<string | symbol, Set<ReactiveEffect>>;

// 依赖关系表
export const targetMap: WeakMap<object, KeyToDeps> = new WeakMap();

/**
 * 跟踪依赖函数
 * @param target
 * @param key
 */
export function track(target: object, key: string | symbol) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (!dep) {
    depsMap.set(key, (dep = createDep()));
  }

  trackEffects(dep);
}

function trackEffects(dep: Dep) {
  activeEffect && dep.add(activeEffect);
}

/**
 * 触发依赖函数
 * @param target
 * @param key
 */
export function trigger(target: object, key: string | symbol) {
  let depsMap = targetMap.get(target);
  if (!depsMap) {
    return;
  }
  let dep = depsMap.get(key);
  if (!dep) {
    return;
  }
  triggerEffects(dep);
}

function triggerEffects(dep: Dep) {
  const effects = Array.isArray(dep) ? dep : [...dep];

  for (const effect of effects) {
    triggerEffect(effect);
  }
}

function triggerEffect(effect: ReactiveEffect) {
  effect.fn();
}
