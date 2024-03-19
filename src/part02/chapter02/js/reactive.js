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
    console.log("effect invoke");
    clearup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);
    const res = fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
    return res;
  };
  effectFn.options = options;
  // 存储于该副作用函数关联的依赖集合
  effectFn.deps = [];
  if (!options.lazy) {
    effectFn();
  }
  return effectFn;
}

function watch(target, cb, options = {}) {
  let getter;
  if (typeof target === "function") {
    getter = target;
  } else {
    getter = () => {
      return traverse(target);
    };
  }
  // 解决watch的竞态问题
  let cleanup;
  function onVaildate(fn) {
    cleanup = fn;
  }
  let oldValue, newValue;
  function job() {
    if (cleanup) cleanup();
    newValue = effectFn();
    cb(newValue, oldValue, onVaildate);
    oldValue = newValue;
  }
  const effectFn = effect(
    () => {
      return getter();
    },
    {
      lazy: true,
      scheduler() {
        if (options.flush === "post") {
          const p = Promise.resolve();
          p.then(job);
        } else {
          job();
        }
      },
    }
  );
  if (options.immediate) {
    job();
  } else {
    oldValue = effectFn();
  }
}

function traverse(obj, seen = new Set()) {
  if (typeof obj !== "object" || obj === null || seen.has(obj)) return;
  seen.add(obj);
  for (let k in obj) {
    traverse(obj[k], seen);
  }
  return obj;
}

function computed(getter) {
  let isOldValue = true;
  let value;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      isOldValue = true;
      trigger(obj, "value");
    },
  });
  const obj = {
    get value() {
      if (isOldValue) {
        value = effectFn();
        track(obj, "value");
        isOldValue = false;
      }
      return value;
    },
  };
  return obj;
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
    get(target, key, receiver) {
      track(target, key);
      return Reflect.get(target, key, receiver);
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
  if (!effects) return;
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
  computed,
  watch,
};
