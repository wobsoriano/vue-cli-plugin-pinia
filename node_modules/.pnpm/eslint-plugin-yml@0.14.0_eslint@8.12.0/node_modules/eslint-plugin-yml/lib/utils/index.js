"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCoreRule = exports.isNode = exports.getProxyNode = exports.defineWrapperListener = exports.createRule = void 0;
const yamlESLintParser = __importStar(require("yaml-eslint-parser"));
const debug_1 = __importDefault(require("debug"));
const path_1 = __importDefault(require("path"));
const log = (0, debug_1.default)("eslint-plugin-yml:utils/index");
function createRule(ruleName, rule) {
    return {
        meta: Object.assign(Object.assign({}, rule.meta), { docs: Object.assign(Object.assign({}, rule.meta.docs), { url: `https://ota-meshi.github.io/eslint-plugin-yml/rules/${ruleName}.html`, ruleId: `yml/${ruleName}`, ruleName }) }),
        create(context) {
            if (typeof context.parserServices.defineCustomBlocksVisitor ===
                "function" &&
                path_1.default.extname(context.getFilename()) === ".vue") {
                return context.parserServices.defineCustomBlocksVisitor(context, yamlESLintParser, {
                    target: ["yaml", "yml"],
                    create(blockContext) {
                        return rule.create(blockContext, {
                            customBlock: true,
                        });
                    },
                });
            }
            return rule.create(context, {
                customBlock: false,
            });
        },
    };
}
exports.createRule = createRule;
function defineWrapperListener(coreRule, context, proxyOptions) {
    var _a, _b;
    if (!context.parserServices.isYAML) {
        return {};
    }
    const listener = coreRule.create({
        __proto__: context,
        options: proxyOptions.options,
    });
    const yamlListener = (_b = (_a = proxyOptions.createListenerProxy) === null || _a === void 0 ? void 0 : _a.call(proxyOptions, listener)) !== null && _b !== void 0 ? _b : listener;
    return yamlListener;
}
exports.defineWrapperListener = defineWrapperListener;
function getProxyNode(node, properties) {
    const safeKeys = new Set([
        "range",
        "typeAnnotation",
    ]);
    const cache = {};
    return new Proxy(node, {
        get(_t, key) {
            if (key in cache) {
                return cache[key];
            }
            if (key in properties) {
                return (cache[key] = properties[key]);
            }
            if (!safeKeys.has(key)) {
                log(`fallback: ${String(key)}`);
            }
            return node[key];
        },
    });
}
exports.getProxyNode = getProxyNode;
function isNode(data) {
    return (data &&
        typeof data.type === "string" &&
        Array.isArray(data.range) &&
        data.range.length === 2 &&
        typeof data.range[0] === "number" &&
        typeof data.range[1] === "number");
}
exports.isNode = isNode;
let ruleMap = null;
function getCoreRule(ruleName) {
    let map;
    if (ruleMap) {
        map = ruleMap;
    }
    else {
        ruleMap = map = new (require("eslint").Linter)().getRules();
    }
    return map.get(ruleName);
}
exports.getCoreRule = getCoreRule;
