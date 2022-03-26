"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.default = (0, utils_1.createRule)("no-empty-document", {
    meta: {
        docs: {
            description: "disallow empty document",
            categories: ["recommended", "standard"],
            extensionRule: false,
            layout: false,
        },
        schema: [],
        messages: {
            unexpectedEmpty: "Empty documents are forbidden.",
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
        return {
            YAMLDocument(node) {
                if (isEmptyNode(node.content)) {
                    context.report({
                        node,
                        messageId: "unexpectedEmpty",
                    });
                }
            },
        };
    },
});
