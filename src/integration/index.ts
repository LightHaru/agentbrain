/**
 * Integration module barrel export
 */
export { createOpenClawPlugin, type OpenClawPluginInstance, type BrainStatus } from './openclaw-plugin.js';
export { PriorityEnforcer, PRIORITY_HIERARCHY, type ConflictResolution } from './priority-enforcer.js';
export { ContextInjector, type InjectionContext, type InjectionOptions } from './context-injector.js';
