import { createDep, Dep } from "./dep";
import { isArray } from "@vue/shared";
// 当前运行的作用域
export let activeEffect: ReactiveEffect | undefined;

export type EffectScheduler = (...args: any[]) => any;
// 响应式数据的作用域
export class ReactiveEffect<T = any> {
  constructor(
    public fn: () => T,
    public scheduler: EffectScheduler | null = null
  ) {}

  run() {
    activeEffect = this;
    return this.fn();
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

export function trackEffects(dep: Dep) {
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

export function triggerEffects(dep: Dep) {
  const effects = isArray(dep) ? dep : [...dep];

  // computed收集依赖的时候会把自己也收集进去(当在一个effect里面调用两次computed的时候)，配合_dirty参数，防止死循环，先执行computed的依赖
  for (const effect of effects) {
    if (effect.scheduler) {
      triggerEffect(effect);
    }
  }

  for (const effect of effects) {
    if (!effect.scheduler) {
      triggerEffect(effect);
    }
  }
}

function triggerEffect(effect: ReactiveEffect) {
  if (effect.scheduler) {
    effect.scheduler();
  } else {
    effect.fn();
  }
}
