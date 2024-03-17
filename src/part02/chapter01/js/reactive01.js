/**
 * |--target1
 *      |--key1-->fn.deps
 *          |--effect1
 *          |--effect2
 *      |--key2-->fn.deps
 *          |--effect1
 *          |--effect2
 *
 * |--target2
 *      |--key1
 *          |--effect1
 *          |--effect2
 *      |--key2
 *          |--effect1
 *          |--effect2
 */
let activeEffect;
const effectStack = [];

const bucket = new WeakMap();

function effect(fn, options = {}) {
  const effectFn = () => {
    clearup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);
    fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  };
  effectFn.options = options;
  // 存储于该副作用函数关联的依赖集合
  effectFn.deps = [];
  effectFn();
}

function clearup(effectFn) {
  for (let i = 0; i < effectFn.deps.length; i++) {
    const deps = effectFn.deps[i];
    deps.delete(effectFn);
  }
  effectFn.deps.length = 0;
}

function reactive(data) {
  return new Proxy(data, {
    get(target, key) {
      track(target, key);
      return target[key];
    },
    set(target, key, newVal) {
      // 赋值
      target[key] = newVal;
      trigger(target, key);
      return true;
    },
  });
}

function track(target, key) {
  // 没有activeEffect直接return；
  if (!activeEffect) return target[key];
  let depsMap = bucket.get(target);
  if (!depsMap) {
    bucket.set(target, (depsMap = new Map()));
  }
  let deps = depsMap.get(key);
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  deps.add(activeEffect);
  activeEffect.deps.push(deps);
}

function trigger(target, key) {
  // 重新执行副作用
  const depsMap = bucket.get(target);
  if (!depsMap) return true;
  const effects = depsMap.get(key);
  const effectsToRun = new Set();
  effects.forEach((effectFn) => {
    if (effectFn !== activeEffect) {
      effectsToRun.add(effectFn);
    }
  });
  effectsToRun.forEach((fn) => {
    if (fn.options.scheduler) {
      fn.options.scheduler(fn);
    } else {
      fn();
    }
  });
}

export default {
  reactive,
  effect,
};
