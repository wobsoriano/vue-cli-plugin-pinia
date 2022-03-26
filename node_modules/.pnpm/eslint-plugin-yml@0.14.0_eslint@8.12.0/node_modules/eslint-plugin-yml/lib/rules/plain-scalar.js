"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const yaml_eslint_parser_1 = require("yaml-eslint-parser");
const utils_1 = require("../utils");
const SYMBOLS = new Set([
    ":",
    "{",
    "}",
    "[",
    "]",
    ",",
    "&",
    "*",
    "#",
    "|",
    "+",
    "%",
    '"',
    "'",
    "\\",
]);
function toRegExps(patterns) {
    return patterns.map((p) => new RegExp(p, "u"));
}
function isStringScalar(node) {
    return typeof node.value === "string";
}
exports.default = (0, utils_1.createRule)("plain-scalar", {
    meta: {
        docs: {
            description: "require or disallow plain style scalar.",
            categories: ["standard"],
            extensionRule: false,
            layout: false,
        },
        fixable: "code",
        schema: [
            { enum: ["always", "never"] },
            {
                type: "object",
                properties: {
                    ignorePatterns: {
                        type: "array",
                        items: { type: "string" },
                    },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            required: "Must use plain style scalar.",
            disallow: "Must use quoted style scalar.",
        },
        type: "layout",
    },
    create(context) {
        var _a, _b;
        if (!context.parserServices.isYAML) {
            return {};
        }
        const option = context.options[0] || "always";
        const ignorePatterns = toRegExps((_b = (_a = context.options[1]) === null || _a === void 0 ? void 0 : _a.ignorePatterns) !== null && _b !== void 0 ? _b : (option === "always"
            ? [
                String.raw `[\v\f\u0085\u00a0\u1680\u180e\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]`,
            ]
            : []));
        const sourceCode = context.getSourceCode();
        function canToPlain(node) {
            if (node.value !== node.value.trim()) {
                return false;
            }
            for (let index = 0; index < node.value.length; index++) {
                const char = node.value[index];
                if (SYMBOLS.has(char)) {
                    return false;
                }
                if (index === 0) {
                    if (char === "-" || char === "?") {
                        const next = node.value[index + 1];
                        if (next && !next.trim()) {
                            return false;
                        }
                    }
                    else if (char === "!") {
                        const next = node.value[index + 1];
                        if (next &&
                            (!next.trim() || next === "!" || next === "<")) {
                            return false;
                        }
                    }
                }
            }
            const parent = node.parent.type === "YAMLWithMeta"
                ? node.parent.parent
                : node.parent;
            if (parent.type === "YAMLPair") {
                if (parent.key === node) {
                    const colon = sourceCode.getTokenAfter(node);
                    if (colon && colon.value === ":") {
                        const next = sourceCode.getTokenAfter(colon);
                        if (colon.range[1] === (next === null || next === void 0 ? void 0 : next.range[0])) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }
        function verifyAlways(node) {
            if (node.style !== "double-quoted" &&
                node.style !== "single-quoted") {
                return;
            }
            if (!canToPlain(node)) {
                return;
            }
            try {
                const result = (0, yaml_eslint_parser_1.parseForESLint)(node.value);
                if ((0, yaml_eslint_parser_1.getStaticYAMLValue)(result.ast) !== node.value) {
                    return;
                }
            }
            catch (_a) {
                return;
            }
            context.report({
                node,
                messageId: "required",
                fix(fixer) {
                    return fixer.replaceText(node, node.value);
                },
            });
        }
        function verifyNever(node) {
            if (node.style !== "plain") {
                return;
            }
            const text = node.value;
            context.report({
                node,
                messageId: "disallow",
                fix(fixer) {
                    return fixer.replaceText(node, `"${text
                        .replace(/(["\\])/gu, "\\$1")
                        .replace(/\r?\n|[\u2028\u2029]/gu, "\\n")}"`);
                },
            });
        }
        return {
            YAMLScalar(node) {
                if (!isStringScalar(node)) {
                    return;
                }
                if (ignorePatterns.some((p) => p.test(node.value))) {
                    return;
                }
                if (option === "always") {
                    verifyAlways(node);
                }
                else {
                    verifyNever(node);
                }
            },
        };
    },
});
