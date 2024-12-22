import { mutableHandler } from "./baseHandlers";
import { isObject } from "@vue/shared";

export const enum ReactiveFlags {
  RAW = "__v_raw"
}

export function toRaw<T>(observed: T): T {
  const raw = observed && observed[ReactiveFlags.RAW];
  return raw ? toRaw(observed) : observed;
}

export function toReactive<T extends unknown>(value: T): T {
  return isObject(value) ? reactive(value) : value;
}

// 记录已经创建的proxy对象 key: 被代理对象，value：代理对象
export const reactiveMap = new WeakMap();

/**
 *  创建响应式对象函数
 * @param target 被代理对象
 * @returns Proxy
 */
export function reactive(target: object) {
  return createReactiveObject(target, mutableHandler, reactiveMap);
}

/**
 * 创建响应式函数
 * @param target 被代理对象
 * @param mutableHandler ProxyHandler，proxy的行为
 * @param reactiveMap  全局的依赖收集Map
 */
function createReactiveObject(
  target: object,
  mutableHandler: ProxyHandler<any>,
  proxyMap: WeakMap<object, any>
) {
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  return new Proxy(target, mutableHandler);
}
