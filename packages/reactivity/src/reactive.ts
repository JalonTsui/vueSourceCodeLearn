import { mutableHandler } from "./baseHandlers";

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
