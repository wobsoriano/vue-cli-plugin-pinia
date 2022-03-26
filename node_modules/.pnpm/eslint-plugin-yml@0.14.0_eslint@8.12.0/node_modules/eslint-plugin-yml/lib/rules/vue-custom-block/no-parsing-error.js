"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../../utils");
exports.default = (0, utils_1.createRule)("vue-custom-block/no-parsing-error", {
    meta: {
        docs: {
            description: "disallow parsing errors in Vue custom blocks",
            categories: ["recommended", "standard"],
            extensionRule: false,
            layout: false,
        },
        schema: [],
        messages: {},
        type: "problem",
    },
    create(context, { customBlock }) {
        if (!customBlock) {
            return {};
        }
        const parseError = context.parserServices.parseError;
        if (parseError) {
            let loc = undefined;
            if ("column" in parseError && "lineNumber" in parseError) {
                loc = {
                    line: parseError.lineNumber,
                    column: parseError.column,
                };
            }
            return {
                Program(node) {
                    context.report({
                        node,
                        loc,
                        message: parseError.message,
                    });
                },
            };
        }
        return {};
    },
});
