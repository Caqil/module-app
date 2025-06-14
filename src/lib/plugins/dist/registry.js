"use strict";
// Enhanced Plugin Registry with WordPress-like functionality
// src/lib/plugins/registry.ts
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
exports.__esModule = true;
exports.pluginRegistry = exports.PluginRegistry = void 0;
var events_1 = require("events");
var loader_1 = require("./loader");
var utils_1 = require("@/lib/utils");
var mongodb_1 = require("@/lib/database/mongodb");
var plugin_1 = require("@/lib/database/models/plugin");
var PluginRegistry = /** @class */ (function (_super) {
    __extends(PluginRegistry, _super);
    function PluginRegistry() {
        var _this = _super.call(this) || this;
        _this.state = {
            plugins: new Map(),
            activePlugins: new Set(),
            loading: new Set(),
            errors: new Map(),
            lastUpdated: new Date()
        };
        _this.hooks = {
            beforeInstall: [],
            afterInstall: [],
            beforeActivate: [],
            afterActivate: [],
            beforeDeactivate: [],
            afterDeactivate: [],
            beforeUninstall: [],
            afterUninstall: [],
            onConfigure: []
        };
        _this.globalRoutes = new Map();
        _this.globalAdminPages = new Map();
        _this.globalSidebarItems = [];
        _this.globalDashboardWidgets = new Map();
        _this.globalHooks = new Map();
        // WordPress-like features
        _this.isInitialized = false;
        _this.autoSyncEnabled = true;
        _this.syncInterval = null;
        _this.setMaxListeners(50); // Support many plugins
        return _this;
    }
    // WordPress-like initialization
    PluginRegistry.prototype.initialize = function () {
        return __awaiter(this, void 0, Promise, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isInitialized)
                            return [2 /*return*/];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        console.log('🔄 Initializing Plugin Registry...');
                        return [4 /*yield*/, mongodb_1.connectToDatabase()
                            // Auto-sync with database
                        ];
                    case 2:
                        _a.sent();
                        // Auto-sync with database
                        return [4 /*yield*/, this.syncWithDatabase()
                            // Auto-activate plugins marked as active
                        ];
                    case 3:
                        // Auto-sync with database
                        _a.sent();
                        // Auto-activate plugins marked as active
                        return [4 /*yield*/, this.autoActivatePlugins()
                            // Start auto-sync if enabled
                        ];
                    case 4:
                        // Auto-activate plugins marked as active
                        _a.sent();
                        // Start auto-sync if enabled
                        if (this.autoSyncEnabled) {
                            this.startAutoSync();
                        }
                        this.isInitialized = true;
                        console.log("\u2705 Plugin Registry initialized with " + this.state.plugins.size + " plugins (" + this.state.activePlugins.size + " active)");
                        this.emit('registryInitialized', {
                            totalPlugins: this.state.plugins.size,
                            activePlugins: this.state.activePlugins.size
                        });
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('❌ Failed to initialize Plugin Registry:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // WordPress-like database sync
    PluginRegistry.prototype.syncWithDatabase = function () {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var dbPlugins, syncedCount, errorCount, _i, dbPlugins_1, dbPlugin, existingPlugin, shouldReload, error_2, dbPluginIds, registryPluginIds, _b, registryPluginIds_1, pluginId, error_3;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 13, , 14]);
                        console.log('📡 Syncing registry with database...');
                        return [4 /*yield*/, plugin_1.InstalledPluginModel.find({})];
                    case 1:
                        dbPlugins = _c.sent();
                        syncedCount = 0;
                        errorCount = 0;
                        _i = 0, dbPlugins_1 = dbPlugins;
                        _c.label = 2;
                    case 2:
                        if (!(_i < dbPlugins_1.length)) return [3 /*break*/, 8];
                        dbPlugin = dbPlugins_1[_i];
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 6, , 7]);
                        existingPlugin = this.state.plugins.get(dbPlugin.pluginId);
                        shouldReload = !existingPlugin ||
                            (dbPlugin.updatedAt ? new Date(dbPlugin.updatedAt).getTime() : 0) > (((_a = existingPlugin.loadedAt) === null || _a === void 0 ? void 0 : _a.getTime()) || 0);
                        if (!shouldReload) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.loadPluginFromDatabase(dbPlugin)];
                    case 4:
                        _c.sent();
                        syncedCount++;
                        _c.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        error_2 = _c.sent();
                        console.warn("\u26A0\uFE0F Failed to sync plugin " + dbPlugin.pluginId + ":", error_2);
                        errorCount++;
                        return [3 /*break*/, 7];
                    case 7:
                        _i++;
                        return [3 /*break*/, 2];
                    case 8:
                        dbPluginIds = new Set(dbPlugins.map(function (p) { return p.pluginId; }));
                        registryPluginIds = Array.from(this.state.plugins.keys());
                        _b = 0, registryPluginIds_1 = registryPluginIds;
                        _c.label = 9;
                    case 9:
                        if (!(_b < registryPluginIds_1.length)) return [3 /*break*/, 12];
                        pluginId = registryPluginIds_1[_b];
                        if (!!dbPluginIds.has(pluginId)) return [3 /*break*/, 11];
                        console.log("\uD83D\uDDD1\uFE0F Removing deleted plugin from registry: " + pluginId);
                        return [4 /*yield*/, this.unloadPluginInternal(pluginId)];
                    case 10:
                        _c.sent();
                        _c.label = 11;
                    case 11:
                        _b++;
                        return [3 /*break*/, 9];
                    case 12:
                        console.log("\u2705 Registry sync complete: " + syncedCount + " synced, " + errorCount + " errors");
                        this.emit('registrySynced', { syncedCount: syncedCount, errorCount: errorCount });
                        return [3 /*break*/, 14];
                    case 13:
                        error_3 = _c.sent();
                        console.error('❌ Registry sync failed:', error_3);
                        throw error_3;
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    // Load plugin from database record
    PluginRegistry.prototype.loadPluginFromDatabase = function (dbPlugin) {
        var _a;
        return __awaiter(this, void 0, Promise, function () {
            var loadedPlugin, activationError_1, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 7, , 8]);
                        return [4 /*yield*/, loader_1.pluginLoader.loadPlugin(dbPlugin.pluginId)
                            // Update with database info
                        ];
                    case 1:
                        loadedPlugin = _b.sent();
                        // Update with database info
                        loadedPlugin.config = dbPlugin.config || ((_a = loadedPlugin.manifest.settings) === null || _a === void 0 ? void 0 : _a.defaults) || {};
                        loadedPlugin.isActive = dbPlugin.isActive;
                        // Store in registry
                        this.state.plugins.set(dbPlugin.pluginId, loadedPlugin);
                        if (!(dbPlugin.isActive && !this.state.activePlugins.has(dbPlugin.pluginId))) return [3 /*break*/, 6];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 6]);
                        return [4 /*yield*/, this.activatePluginInRegistry(dbPlugin.pluginId, loadedPlugin)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        activationError_1 = _b.sent();
                        console.warn("\u26A0\uFE0F Failed to auto-activate plugin " + dbPlugin.pluginId + ":", activationError_1);
                        // Mark as inactive in database if activation fails
                        return [4 /*yield*/, plugin_1.InstalledPluginModel.findByIdAndUpdate(dbPlugin._id, {
                                isActive: false,
                                $push: { errorLog: "Auto-activation failed: " + activationError_1 }
                            })];
                    case 5:
                        // Mark as inactive in database if activation fails
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 6:
                        this.emit('pluginSynced', { pluginId: dbPlugin.pluginId, plugin: loadedPlugin });
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _b.sent();
                        console.error("Failed to load plugin " + dbPlugin.pluginId + " from database:", error_4);
                        throw error_4;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    // Auto-activate plugins marked as active
    PluginRegistry.prototype.autoActivatePlugins = function () {
        return __awaiter(this, void 0, Promise, function () {
            var pluginsToActivate, _i, pluginsToActivate_1, _a, pluginId, plugin, error_5;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        pluginsToActivate = Array.from(this.state.plugins.entries())
                            .filter(function (_a) {
                            var pluginId = _a[0], plugin = _a[1];
                            return plugin.isActive && !_this.state.activePlugins.has(pluginId);
                        });
                        console.log("\uD83D\uDD0C Auto-activating " + pluginsToActivate.length + " plugins...");
                        _i = 0, pluginsToActivate_1 = pluginsToActivate;
                        _b.label = 1;
                    case 1:
                        if (!(_i < pluginsToActivate_1.length)) return [3 /*break*/, 6];
                        _a = pluginsToActivate_1[_i], pluginId = _a[0], plugin = _a[1];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.activatePluginInRegistry(pluginId, plugin)];
                    case 3:
                        _b.sent();
                        console.log("\u2705 Auto-activated: " + pluginId);
                        return [3 /*break*/, 5];
                    case 4:
                        error_5 = _b.sent();
                        console.warn("\u26A0\uFE0F Failed to auto-activate " + pluginId + ":", error_5);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Start auto-sync timer
    PluginRegistry.prototype.startAutoSync = function () {
        var _this = this;
        if (this.syncInterval)
            return;
        // Sync every 30 seconds
        this.syncInterval = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.syncWithDatabase()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_6 = _a.sent();
                        console.warn('Auto-sync failed:', error_6);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, 300000);
        console.log('🔄 Auto-sync started (5m interval)');
    };
    // Stop auto-sync
    PluginRegistry.prototype.stopAutoSync = function () {
        if (this.syncInterval) {
            clearInterval(this.syncInterval);
            this.syncInterval = null;
            console.log('⏹️ Auto-sync stopped');
        }
    };
    // WordPress-like plugin installation notification
    PluginRegistry.prototype.onPluginInstalled = function (pluginId, dbPlugin) {
        return __awaiter(this, void 0, Promise, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDCE6 Plugin installed notification: " + pluginId);
                        // Load the plugin into registry
                        return [4 /*yield*/, this.loadPluginFromDatabase(dbPlugin)
                            // Emit event for real-time updates
                        ];
                    case 1:
                        // Load the plugin into registry
                        _a.sent();
                        // Emit event for real-time updates
                        this.emit('pluginInstalled', {
                            pluginId: pluginId,
                            plugin: this.state.plugins.get(pluginId),
                            dbData: dbPlugin
                        });
                        // Trigger UI updates
                        this.notifyUIUpdate('installed', pluginId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_7 = _a.sent();
                        console.error("Failed to handle plugin installation: " + pluginId, error_7);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // WordPress-like plugin activation
    PluginRegistry.prototype.onPluginActivated = function (pluginId, config) {
        return __awaiter(this, void 0, Promise, function () {
            var plugin, dbPlugin, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        console.log("\uD83D\uDD0C Plugin activation notification: " + pluginId);
                        plugin = this.state.plugins.get(pluginId);
                        if (!!plugin) return [3 /*break*/, 4];
                        return [4 /*yield*/, plugin_1.InstalledPluginModel.findOne({ pluginId: pluginId })];
                    case 1:
                        dbPlugin = _a.sent();
                        if (!dbPlugin) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.loadPluginFromDatabase(dbPlugin)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3: throw new Error("Plugin " + pluginId + " not found");
                    case 4: 
                    // Activate in registry
                    return [4 /*yield*/, this.activatePluginInRegistry(pluginId, this.state.plugins.get(pluginId), config)
                        // Emit event
                    ];
                    case 5:
                        // Activate in registry
                        _a.sent();
                        // Emit event
                        this.emit('pluginActivated', {
                            pluginId: pluginId,
                            plugin: this.state.plugins.get(pluginId)
                        });
                        // Trigger UI updates
                        this.notifyUIUpdate('activated', pluginId);
                        return [3 /*break*/, 7];
                    case 6:
                        error_8 = _a.sent();
                        console.error("Failed to handle plugin activation: " + pluginId, error_8);
                        throw error_8;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    // WordPress-like plugin deactivation
    PluginRegistry.prototype.onPluginDeactivated = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            var plugin, error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("\uD83D\uDD0C Plugin deactivation notification: " + pluginId);
                        plugin = this.state.plugins.get(pluginId);
                        if (!plugin) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.deactivatePluginInRegistry(pluginId, plugin)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Emit event
                        this.emit('pluginDeactivated', { pluginId: pluginId, plugin: plugin });
                        // Trigger UI updates
                        this.notifyUIUpdate('deactivated', pluginId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        console.error("Failed to handle plugin deactivation: " + pluginId, error_9);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // WordPress-like plugin configuration update
    PluginRegistry.prototype.onPluginConfigured = function (pluginId, newConfig) {
        return __awaiter(this, void 0, Promise, function () {
            var plugin, error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        console.log("\u2699\uFE0F Plugin configuration notification: " + pluginId);
                        plugin = this.state.plugins.get(pluginId);
                        if (!plugin) return [3 /*break*/, 2];
                        // Update config in registry
                        plugin.config = __assign(__assign({}, plugin.config), newConfig);
                        if (!this.state.activePlugins.has(pluginId)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.updatePluginConfig(pluginId, newConfig)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Emit event
                        this.emit('pluginConfigured', { pluginId: pluginId, plugin: plugin, config: newConfig });
                        // Trigger UI updates
                        this.notifyUIUpdate('configured', pluginId);
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        console.error("Failed to handle plugin configuration: " + pluginId, error_10);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    // WordPress-like plugin uninstallation
    PluginRegistry.prototype.onPluginUninstalled = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("\uD83D\uDDD1\uFE0F Plugin uninstallation notification: " + pluginId);
                        // Remove from registry
                        return [4 /*yield*/, this.unloadPluginInternal(pluginId)
                            // Emit event
                        ];
                    case 1:
                        // Remove from registry
                        _a.sent();
                        // Emit event
                        this.emit('pluginUninstalled', { pluginId: pluginId });
                        // Trigger UI updates
                        this.notifyUIUpdate('uninstalled', pluginId);
                        return [3 /*break*/, 3];
                    case 2:
                        error_11 = _a.sent();
                        console.error("Failed to handle plugin uninstallation: " + pluginId, error_11);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Internal registry activation (without database update)
    PluginRegistry.prototype.activatePluginInRegistry = function (pluginId, plugin, config) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Run before activate hooks
                    return [4 /*yield*/, this.runHooks('beforeActivate', {
                            type: 'activated',
                            pluginId: pluginId,
                            timestamp: new Date()
                        })
                        // Apply configuration
                    ];
                    case 1:
                        // Run before activate hooks
                        _a.sent();
                        // Apply configuration
                        if (config) {
                            plugin.config = utils_1.deepMerge(plugin.config, config);
                        }
                        // Mark as active
                        plugin.isActive = true;
                        this.state.activePlugins.add(pluginId);
                        this.state.lastUpdated = new Date();
                        // Register plugin resources globally
                        this.registerPluginRoutes(plugin);
                        this.registerPluginAdminPages(plugin);
                        this.registerPluginSidebarItems(plugin);
                        this.registerPluginDashboardWidgets(plugin);
                        this.registerPluginHooks(plugin);
                        // Run after activate hooks
                        return [4 /*yield*/, this.runHooks('afterActivate', {
                                type: 'activated',
                                pluginId: pluginId,
                                timestamp: new Date()
                            })];
                    case 2:
                        // Run after activate hooks
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Internal registry deactivation (without database update)
    PluginRegistry.prototype.deactivatePluginInRegistry = function (pluginId, plugin) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Run before deactivate hooks
                    return [4 /*yield*/, this.runHooks('beforeDeactivate', {
                            type: 'deactivated',
                            pluginId: pluginId,
                            timestamp: new Date()
                        })];
                    case 1:
                        // Run before deactivate hooks
                        _a.sent();
                        plugin.isActive = false;
                        this.state.activePlugins["delete"](pluginId);
                        this.state.lastUpdated = new Date();
                        // Unregister plugin resources globally
                        this.unregisterPluginRoutes(plugin);
                        this.unregisterPluginAdminPages(plugin);
                        this.unregisterPluginSidebarItems(plugin);
                        this.unregisterPluginDashboardWidgets(plugin);
                        this.unregisterPluginHooks(plugin);
                        // Run after deactivate hooks
                        return [4 /*yield*/, this.runHooks('afterDeactivate', {
                                type: 'deactivated',
                                pluginId: pluginId,
                                timestamp: new Date()
                            })];
                    case 2:
                        // Run after deactivate hooks
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Public method for manual plugin unloading (if needed)
    PluginRegistry.prototype.unloadPlugin = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.unloadPluginInternal(pluginId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Unload plugin from registry
    PluginRegistry.prototype.unloadPluginInternal = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            var plugin;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        plugin = this.state.plugins.get(pluginId);
                        if (!plugin)
                            return [2 /*return*/];
                        if (!this.state.activePlugins.has(pluginId)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.deactivatePluginInRegistry(pluginId, plugin)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        // Remove from registry
                        this.state.plugins["delete"](pluginId);
                        this.state.errors["delete"](pluginId);
                        this.state.lastUpdated = new Date();
                        console.log("\uD83D\uDDD1\uFE0F Plugin unloaded from registry: " + pluginId);
                        return [2 /*return*/];
                }
            });
        });
    };
    // Notify UI of changes (for real-time updates)
    PluginRegistry.prototype.notifyUIUpdate = function (action, pluginId) {
        try {
            // Broadcast to all connected clients (if using WebSockets)
            // For now, use custom events
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('pluginStateChanged', {
                    detail: { action: action, pluginId: pluginId, timestamp: new Date() }
                }));
            }
            // Server-side event emission for API consumers
            this.emit('uiUpdateRequired', { action: action, pluginId: pluginId, timestamp: new Date() });
        }
        catch (error) {
            console.warn('Failed to notify UI update:', error);
        }
    };
    // Force refresh from database
    PluginRegistry.prototype.refresh = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔄 Force refreshing registry...');
                        return [4 /*yield*/, this.syncWithDatabase()];
                    case 1:
                        _a.sent();
                        this.emit('registryRefreshed');
                        return [2 /*return*/];
                }
            });
        });
    };
    // WordPress-like refresh all
    PluginRegistry.prototype.refreshAll = function () {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🔄 Refreshing all plugins...');
                        // Clear current state
                        this.state.plugins.clear();
                        this.state.activePlugins.clear();
                        this.state.errors.clear();
                        // Clear global resources
                        this.globalRoutes.clear();
                        this.globalAdminPages.clear();
                        this.globalSidebarItems = [];
                        this.globalDashboardWidgets.clear();
                        this.globalHooks.clear();
                        // Reload everything
                        return [4 /*yield*/, this.syncWithDatabase()];
                    case 1:
                        // Reload everything
                        _a.sent();
                        this.emit('registryRefreshedAll');
                        return [2 /*return*/];
                }
            });
        });
    };
    // Check if plugin exists in database
    PluginRegistry.prototype.pluginExistsInDatabase = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            var plugin, error_12;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, plugin_1.InstalledPluginModel.findOne({ pluginId: pluginId })];
                    case 1:
                        plugin = _a.sent();
                        return [2 /*return*/, !!plugin];
                    case 2:
                        error_12 = _a.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Get plugin from database
    PluginRegistry.prototype.getPluginFromDatabase = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            var error_13;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, plugin_1.InstalledPluginModel.findOne({ pluginId: pluginId })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_13 = _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    // Original methods (preserved)
    PluginRegistry.prototype.loadPlugin = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            var loadedPlugin, error_14, errorMessage;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.state.loading.has(pluginId)) {
                            // Wait for existing load to complete
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    var timeout = setTimeout(function () {
                                        reject(new Error("Plugin loading timeout: " + pluginId));
                                    }, 30000); // 30 second timeout
                                    var checkComplete = function () {
                                        if (!_this.state.loading.has(pluginId)) {
                                            clearTimeout(timeout);
                                            var plugin = _this.state.plugins.get(pluginId);
                                            if (plugin) {
                                                resolve(plugin);
                                            }
                                            else {
                                                reject(new Error("Plugin " + pluginId + " failed to load"));
                                            }
                                        }
                                        else {
                                            setTimeout(checkComplete, 100);
                                        }
                                    };
                                    checkComplete();
                                })];
                        }
                        this.state.loading.add(pluginId);
                        this.state.errors["delete"](pluginId);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, loader_1.pluginLoader.loadPlugin(pluginId)];
                    case 2:
                        loadedPlugin = _a.sent();
                        this.state.plugins.set(pluginId, loadedPlugin);
                        this.state.lastUpdated = new Date();
                        this.emit('pluginLoaded', { pluginId: pluginId, plugin: loadedPlugin });
                        return [2 /*return*/, loadedPlugin];
                    case 3:
                        error_14 = _a.sent();
                        errorMessage = error_14 instanceof Error ? error_14.message : 'Unknown error';
                        this.state.errors.set(pluginId, errorMessage);
                        this.emit('pluginLoadError', { pluginId: pluginId, error: errorMessage });
                        throw error_14;
                    case 4:
                        this.state.loading["delete"](pluginId);
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    PluginRegistry.prototype.getPluginByAdminPageRoute = function (routePath) {
        console.log("\uD83D\uDD0D Searching for plugin with admin page route: " + routePath);
        // Search through active plugins
        for (var _i = 0, _a = this.state.plugins; _i < _a.length; _i++) {
            var _b = _a[_i], pluginId = _b[0], plugin = _b[1];
            // Skip inactive plugins
            if (!this.state.activePlugins.has(pluginId)) {
                continue;
            }
            // Skip plugins without admin pages
            if (!plugin.adminPages || plugin.adminPages.size === 0) {
                continue;
            }
            // Check each admin page in the plugin
            for (var _c = 0, _d = plugin.adminPages; _c < _d.length; _c++) {
                var _e = _d[_c], pagePath = _e[0], pageInfo = _e[1];
                if (pagePath === routePath) {
                    console.log("\u2705 Found plugin: " + pluginId + " for route: " + routePath);
                    return {
                        plugin: plugin,
                        adminPage: pageInfo
                    };
                }
            }
        }
        console.log("\u274C No plugin found for admin page route: " + routePath);
        return null;
    };
    // ✅ ALTERNATIVE: Get all active plugins with admin pages (for debugging)
    PluginRegistry.prototype.getActivePluginsWithAdminPages = function () {
        var result = [];
        for (var _i = 0, _a = this.state.plugins; _i < _a.length; _i++) {
            var _b = _a[_i], pluginId = _b[0], plugin = _b[1];
            if (this.state.activePlugins.has(pluginId) && plugin.adminPages && plugin.adminPages.size > 0) {
                result.push({
                    pluginId: pluginId,
                    plugin: plugin,
                    adminPages: plugin.adminPages
                });
            }
        }
        return result;
    };
    // ✅ HELPER: Get plugin by ID if active
    PluginRegistry.prototype.getActivePlugin = function (pluginId) {
        if (!this.state.activePlugins.has(pluginId)) {
            return null;
        }
        return this.state.plugins.get(pluginId) || null;
    };
    // ✅ DEBUG: List all available admin page routes
    PluginRegistry.prototype.getAllAdminPageRoutes = function () {
        var _a;
        var routes = [];
        for (var _i = 0, _b = this.state.plugins; _i < _b.length; _i++) {
            var _c = _b[_i], pluginId = _c[0], plugin = _c[1];
            if (this.state.activePlugins.has(pluginId) && plugin.adminPages) {
                for (var _d = 0, _e = plugin.adminPages; _d < _e.length; _d++) {
                    var _f = _e[_d], route = _f[0], pageInfo = _f[1];
                    routes.push({
                        route: route,
                        pluginId: pluginId,
                        pluginName: ((_a = plugin.manifest) === null || _a === void 0 ? void 0 : _a.name) || pluginId,
                        pageTitle: pageInfo.title || 'Unknown'
                    });
                }
            }
        }
        return routes;
    };
    PluginRegistry.prototype.activatePlugin = function (pluginId, config) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.onPluginActivated(pluginId, config)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PluginRegistry.prototype.deactivatePlugin = function (pluginId) {
        return __awaiter(this, void 0, Promise, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.onPluginDeactivated(pluginId)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PluginRegistry.prototype.updatePluginConfig = function (pluginId, config) {
        return __awaiter(this, void 0, Promise, function () {
            var plugin;
            return __generator(this, function (_a) {
                plugin = this.state.plugins.get(pluginId);
                if (!plugin) {
                    throw new Error("Plugin " + pluginId + " not found");
                }
                plugin.config = utils_1.deepMerge(plugin.config, config);
                this.state.lastUpdated = new Date();
                this.emit('pluginConfigUpdated', { pluginId: pluginId, config: config, plugin: plugin });
                return [2 /*return*/];
            });
        });
    };
    // All existing methods preserved...
    // (keeping original implementation for registerPluginRoutes, unregisterPluginRoutes, etc.)
    PluginRegistry.prototype.registerPluginRoutes = function (plugin) {
        for (var _i = 0, _a = plugin.routes; _i < _a.length; _i++) {
            var _b = _a[_i], routeKey = _b[0], route = _b[1];
            this.globalRoutes.set(plugin.manifest.id + ":" + routeKey, route);
        }
    };
    PluginRegistry.prototype.unregisterPluginRoutes = function (plugin) {
        for (var _i = 0, _a = plugin.routes; _i < _a.length; _i++) {
            var routeKey = _a[_i][0];
            this.globalRoutes["delete"](plugin.manifest.id + ":" + routeKey);
        }
    };
    PluginRegistry.prototype.registerPluginAdminPages = function (plugin) {
        for (var _i = 0, _a = plugin.adminPages; _i < _a.length; _i++) {
            var _b = _a[_i], pagePath = _b[0], page = _b[1];
            this.globalAdminPages.set(plugin.manifest.id + ":" + pagePath, page);
        }
    };
    PluginRegistry.prototype.unregisterPluginAdminPages = function (plugin) {
        for (var _i = 0, _a = plugin.adminPages; _i < _a.length; _i++) {
            var pagePath = _a[_i][0];
            this.globalAdminPages["delete"](plugin.manifest.id + ":" + pagePath);
        }
    };
    PluginRegistry.prototype.registerPluginSidebarItems = function (plugin) {
        for (var _i = 0, _a = plugin.sidebarItems; _i < _a.length; _i++) {
            var item = _a[_i];
            this.globalSidebarItems.push(__assign(__assign({}, item), { id: plugin.manifest.id + ":" + item.id }));
        }
        // Sort by order
        this.globalSidebarItems.sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
    };
    PluginRegistry.prototype.unregisterPluginSidebarItems = function (plugin) {
        this.globalSidebarItems = this.globalSidebarItems.filter(function (item) { return !item.id.startsWith(plugin.manifest.id + ":"); });
    };
    PluginRegistry.prototype.registerPluginDashboardWidgets = function (plugin) {
        for (var _i = 0, _a = plugin.dashboardWidgets; _i < _a.length; _i++) {
            var _b = _a[_i], widgetId = _b[0], widget = _b[1];
            this.globalDashboardWidgets.set(plugin.manifest.id + ":" + widgetId, widget);
        }
    };
    PluginRegistry.prototype.unregisterPluginDashboardWidgets = function (plugin) {
        for (var _i = 0, _a = plugin.dashboardWidgets; _i < _a.length; _i++) {
            var widgetId = _a[_i][0];
            this.globalDashboardWidgets["delete"](plugin.manifest.id + ":" + widgetId);
        }
    };
    PluginRegistry.prototype.registerPluginHooks = function (plugin) {
        for (var _i = 0, _a = plugin.hooks; _i < _a.length; _i++) {
            var _b = _a[_i], hookName = _b[0], hooks = _b[1];
            var existing = this.globalHooks.get(hookName) || [];
            existing.push.apply(existing, hooks);
            existing.sort(function (a, b) { return (a.priority || 0) - (b.priority || 0); });
            this.globalHooks.set(hookName, existing);
        }
    };
    PluginRegistry.prototype.unregisterPluginHooks = function (plugin) {
        var _loop_1 = function (hookName, hooks) {
            var existing = this_1.globalHooks.get(hookName) || [];
            var filtered = existing.filter(function (hook) {
                return !hooks.some(function (pluginHook) { return pluginHook.handler === hook.handler; });
            });
            if (filtered.length > 0) {
                this_1.globalHooks.set(hookName, filtered);
            }
            else {
                this_1.globalHooks["delete"](hookName);
            }
        };
        var this_1 = this;
        for (var _i = 0, _a = plugin.hooks; _i < _a.length; _i++) {
            var _b = _a[_i], hookName = _b[0], hooks = _b[1];
            _loop_1(hookName, hooks);
        }
    };
    // Getter methods
    PluginRegistry.prototype.getPlugin = function (pluginId) {
        return this.state.plugins.get(pluginId);
    };
    PluginRegistry.prototype.getActivePlugins = function () {
        return Array.from(this.state.plugins.values()).filter(function (plugin) { return plugin.isActive; });
    };
    PluginRegistry.prototype.getAllPlugins = function () {
        return Array.from(this.state.plugins.values());
    };
    PluginRegistry.prototype.getLoadedPluginIds = function () {
        return Array.from(this.state.plugins.keys());
    };
    PluginRegistry.prototype.getActivePluginIds = function () {
        return Array.from(this.state.activePlugins);
    };
    PluginRegistry.prototype.isPluginLoaded = function (pluginId) {
        return this.state.plugins.has(pluginId);
    };
    PluginRegistry.prototype.isPluginLoading = function (pluginId) {
        return this.state.loading.has(pluginId);
    };
    PluginRegistry.prototype.isPluginActive = function (pluginId) {
        return this.state.activePlugins.has(pluginId);
    };
    PluginRegistry.prototype.getPluginError = function (pluginId) {
        return this.state.errors.get(pluginId);
    };
    // Global resource getters
    PluginRegistry.prototype.getAllRoutes = function () {
        return new Map(this.globalRoutes);
    };
    PluginRegistry.prototype.getAllAdminPages = function () {
        return new Map(this.globalAdminPages);
    };
    PluginRegistry.prototype.getAllSidebarItems = function () {
        return __spreadArrays(this.globalSidebarItems);
    };
    PluginRegistry.prototype.getAllDashboardWidgets = function () {
        return new Map(this.globalDashboardWidgets);
    };
    PluginRegistry.prototype.getAllHooks = function () {
        return new Map(this.globalHooks);
    };
    PluginRegistry.prototype.getRegistryState = function () {
        return {
            plugins: new Map(this.state.plugins),
            activePlugins: new Set(this.state.activePlugins),
            loading: new Set(this.state.loading),
            errors: new Map(this.state.errors),
            lastUpdated: this.state.lastUpdated
        };
    };
    // Hook management
    PluginRegistry.prototype.addHook = function (event, hook) {
        this.hooks[event].push(hook);
    };
    PluginRegistry.prototype.removeHook = function (event, hook) {
        var hooks = this.hooks[event];
        var index = hooks.indexOf(hook);
        if (index > -1) {
            hooks.splice(index, 1);
        }
    };
    PluginRegistry.prototype.clearHooks = function (event) {
        var _this = this;
        if (event) {
            this.hooks[event] = [];
        }
        else {
            Object.keys(this.hooks).forEach(function (key) {
                _this.hooks[key] = [];
            });
        }
    };
    PluginRegistry.prototype.runHooks = function (event, eventData) {
        return __awaiter(this, void 0, Promise, function () {
            var hooks, pluginEvent, fullContext, hookPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        hooks = this.hooks[event];
                        pluginEvent = {
                            type: eventData.type,
                            pluginId: eventData.pluginId,
                            timestamp: eventData.timestamp,
                            userId: eventData.userId,
                            metadata: eventData.metadata
                        };
                        fullContext = {
                            pluginId: eventData.pluginId,
                            event: pluginEvent,
                            currentPlugin: this.getPlugin(eventData.pluginId) || undefined,
                            previousPlugin: undefined
                        };
                        hookPromises = hooks.map(function (hook) { return __awaiter(_this, void 0, void 0, function () {
                            var error_15;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 2, , 3]);
                                        return [4 /*yield*/, hook(fullContext)];
                                    case 1:
                                        _a.sent();
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_15 = _a.sent();
                                        console.error("Plugin hook error (" + event + "):", error_15);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [4 /*yield*/, Promise.allSettled(hookPromises)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Clear all data
    PluginRegistry.prototype.clear = function () {
        this.state.plugins.clear();
        this.state.activePlugins.clear();
        this.state.loading.clear();
        this.state.errors.clear();
        this.state.lastUpdated = new Date();
        this.globalRoutes.clear();
        this.globalAdminPages.clear();
        this.globalSidebarItems = [];
        this.globalDashboardWidgets.clear();
        this.globalHooks.clear();
        loader_1.pluginLoader.clearCache();
        this.emit('registryCleared');
    };
    // Get statistics
    PluginRegistry.prototype.getStats = function () {
        return __assign({ totalPlugins: this.state.plugins.size, activePlugins: this.state.activePlugins.size, loadingPlugins: this.state.loading.size, errorCount: this.state.errors.size, lastUpdated: this.state.lastUpdated, globalRoutes: this.globalRoutes.size, globalAdminPages: this.globalAdminPages.size, globalSidebarItems: this.globalSidebarItems.length, globalDashboardWidgets: this.globalDashboardWidgets.size, globalHooks: this.globalHooks.size, isInitialized: this.isInitialized, autoSyncEnabled: this.autoSyncEnabled }, loader_1.pluginLoader.getCacheStats());
    };
    return PluginRegistry;
}(events_1.EventEmitter));
exports.PluginRegistry = PluginRegistry;
// Enhanced singleton instance with auto-initialization
exports.pluginRegistry = new PluginRegistry();
// Auto-initialize when imported (WordPress-like)
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
    // Initialize in next tick to allow other modules to set up first
    process.nextTick(function () { return __awaiter(void 0, void 0, void 0, function () {
        var error_16;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, exports.pluginRegistry.initialize()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_16 = _a.sent();
                    console.error('Failed to auto-initialize plugin registry:', error_16);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
}
