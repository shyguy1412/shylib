
import { BrowserWindow, contextBridge, ipcMain, ipcRenderer } from "electron";
/**
 * Needs to be called both in render and in main
 * @param module Module to bridge
 */
export function bridge<T extends Record<string, unknown>>(): void;
export function bridge<T extends Record<string, unknown>>(module: T, namespace: string): void;
export function bridge<T extends Record<string, unknown>>(moduleOrNamespace?: T, namespace?: string) {

  if (ipcMain) {
    const module = moduleOrNamespace;
    if (typeof module != "object") {
      throw new TypeError("Expected 'module' to be an object, got " + typeof module);
    }
    if (typeof namespace != "string") {
      throw new TypeError("Expected 'namespace' to be a string, got " + typeof namespace);
    }

    bridgeMain(module, namespace);
    return;
  }

  if (ipcRenderer) {
    contextBridge.exposeInMainWorld("__module_bridge_init", new Promise<void>(async resolve => {
      ipcRenderer.invoke('__module_bridge_get_namespaces')
        .then(namespaces => Promise.all(namespaces.map(bridgeRender)))
        .catch(_ => _)
        .finally(resolve);
    }));
    return;
  }

  throw new Error("Running in unknown context");
}

async function bridgeRender(namespace: string) {
  const methods: string[] = await ipcRenderer.invoke(`__module_bridge_get_api_methods_${namespace}`);
  const constants: string[] = await ipcRenderer.invoke(`__module_bridge_get_constants_${namespace}`);
  const bridge: Record<string, any> = {};

  methods.reduce((prev, cur) => {
    prev[cur] = (...args: any[]) => {
      return ipcRenderer.invoke(`__module_bridge_${namespace}_${cur}`, ...args.map(serialize));
    };
    return prev;
  }, bridge);


  await constants.reduce(async (prev, cur) => {
    (await prev)[cur] = await ipcRenderer.invoke(`__module_bridge_${namespace}_${cur}`);
    return prev;
  }, Promise.resolve(bridge));


  contextBridge.exposeInMainWorld(namespace, bridge);
}

const namespaces = new Set<string>();

function bridgeMain<T extends Record<string, unknown>>(module: T, namespace: string) {
  const methods: string[] = [];
  const constants: string[] = [];

  namespaces.add(namespace);

  for (const key in module) {
    const value = module[key];

    if (typeof value != "function") {
      ipcMain.handle(`__module_bridge_${namespace}_${key}`, () => {
        return value;
      });
      constants.push(key);

      continue;
    };

    methods.push(key);
    ipcMain.handle(`__module_bridge_${namespace}_${key}`, (_, ...args) => {
      return value(...args.map(deserialize));
    });
  }

  ipcMain.handle(`__module_bridge_get_api_methods_${namespace}`, () => methods);
  ipcMain.handle(`__module_bridge_get_constants_${namespace}`, () => constants);
}

(async () => {
  if (!ipcMain) return;
  ipcMain.handle(`__module_bridge_get_namespaces`, () => namespaces[Symbol.iterator]().toArray());
})().catch();

let serialized_value_id = 1;
function serialize(arg: any) {
  if (typeof arg != "function") return arg;
  const callback_token = {
    __module_bridge_tag: "function",
    name: `__module_bridge_serialized_${serialized_value_id++}`
  };

  ipcRenderer.once(callback_token.name, (e, ...args) => arg(...args));

  return callback_token;
}

function deserialize(arg: any) {
  if (!arg || typeof arg != "object" || !("__module_bridge_tag" in arg)) return arg;

  switch (arg["__module_bridge_tag"]) {
    case "function": return (...args: any[]) => {
      for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send(arg.name, ...args);
      }
    };
    default: throw new Error("Invalid token tag " + arg["__module_bridge_tag"]);
  }
}