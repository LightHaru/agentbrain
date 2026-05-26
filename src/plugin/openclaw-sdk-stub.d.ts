/**
 * Type stub for openclaw/plugin-sdk/plugin-entry
 * At runtime, OpenClaw provides this module. This stub allows TypeScript to compile.
 */

export interface PluginApi {
  on(event: string, handler: (...args: any[]) => any, options?: { priority?: number }): void;
  registerTool(name: string, definition: {
    description: string;
    parameters?: any;
    handler: (params: any, ctx: any) => Promise<any>;
  }): void;
}

export interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  register(api: PluginApi): void;
}

export function definePluginEntry(definition: PluginDefinition): PluginDefinition {
  return definition;
}
