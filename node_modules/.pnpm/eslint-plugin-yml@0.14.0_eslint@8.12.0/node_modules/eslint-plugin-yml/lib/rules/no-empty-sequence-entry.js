"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const ast_utils_1 = require("../utils/ast-utils");
exports.default = (0, utils_1.createRule)("no-empty-sequence-entry", {
    meta: {
        docs: {
            description: "disallow empty sequence entries",
            categories: ["recommended", "standard"],
            extensionRule: false,
            layout: false,
        },
        schema: [],
        messages: {
            unexpectedEmpty: "Empty sequence entries are forbidden.",
        },
        type: "suggestion",
    },
    create(context) {
        if (!context.parserServices.isYAML) {
            return {};
        }
        function isEmptyNode(node) {
            if (!node) {
                return true;
            }
            if (node.type === "YAMLWithMeta") {
                return isEmptyNode(node.value);
            }
            return false;
        }
        const sourceCode = context.getSourceCode();
        return {
            YAMLSequence(node) {
                if (node.style !== "block") {
                    return;
                }
                node.entries.forEach((entry, index) => {
                    if (isEmptyNode(entry)) {
                        context.report({
                            node: getHyphen(node, index) || node,
                            messageId: "unexpectedEmpty",
                        });
                    }
                });
            },
        };
        function getHyphen(node, index) {
            if (index === 0) {
                const token = sourceCode.getFirstToken(node);
                return (0, ast_utils_1.isHyphen)(token) ? token : null;
            }
            const prev = node.entries[index - 1];
            if (prev) {
                const token = sourceCode.getTokenAfter(prev);
                return (0, ast_utils_1.isHyphen)(token) ? token : null;
            }
            const prevHyphen = getHyphen(node, index - 1);
            if (prevHyphen) {
                const token = sourceCode.getTokenAfter(prevHyphen);
                return (0, ast_utils_1.isHyphen)(token) ? token : null;
            }
            return null;
        }
    },
});
