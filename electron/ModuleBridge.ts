
import { BrowserWindow, contextBridge, ipcMain, ipcRenderer } from "electron";
/**
 * Needs to be called both in render and in main
 * @param module Module to bridge
 */
export function bridge<T extends Record<string, unknown>>(namespace: string): void;
export function bridge<T extends Record<string, unknown>>(module: T, namespace: string): void;
export function bridge<T extends Record<string, unknown>>(moduleOrNamespace: T | string, namespace?: string) {

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
    const namespace = moduleOrNamespace;

    if (typeof namespace != "string") {
      throw new TypeError("Expected 'namespace' to be a string, got " + typeof namespace);
    }

    bridgeRender(namespace);
    return;
  }

  throw new Error("Running in unknown context");
}

async function bridgeRender(namespace: string) {
  const methods: string[] = await ipcRenderer.invoke(`__module_bridge_get_api_methods_${namespace}`);
  let id = 1;
  contextBridge.exposeInMainWorld(namespace, methods.reduce((prev, cur) => {
    prev[cur] = (...args: any[]) => {
      ipcRenderer.invoke(`__module_bridge_${namespace}_${cur}`, ...args.map((arg) => {
        if (typeof arg != "function") return arg;
        const callback_token = {
          __module_bridge_tag: "function",
          name: `__module_bridge_${namespace}_${cur}_callback_${id++}`
        };

        ipcRenderer.on(callback_token.name, (...args) => arg(...args));

        return callback_token;
      }));
    };
    return prev;
  }, {} as Record<string, Function>));
}

function bridgeMain<T extends Record<string, unknown>>(module: T, namespace: string) {
  const methods: string[] = [];

  for (const key in module) {
    const value = module[key];
    if (typeof value != "function") continue;
    methods.push(key);
    ipcMain.handle(`__module_bridge_${namespace}_${key}`, (_, ...args) => {
      return value(...args.map((arg) => {
        if (!("__module_bridge_tag" in arg)) return arg;

        switch (arg["__module_bridge_tag"]) {
          case "function": return (...args: any[]) => {
            for (const window of BrowserWindow.getAllWindows()) {
              window.webContents.send(arg.name, ...args);
            }
          };
          default: throw new Error("Invalid token tag");
        }
      }));
    });
  }

  ipcMain.handleOnce(`__module_bridge_get_api_methods_${namespace}`, () => methods);
}