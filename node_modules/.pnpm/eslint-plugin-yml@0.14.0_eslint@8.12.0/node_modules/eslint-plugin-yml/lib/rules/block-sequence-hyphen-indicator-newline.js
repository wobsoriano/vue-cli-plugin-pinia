"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const ast_utils_1 = require("../utils/ast-utils");
exports.default = (0, utils_1.createRule)("block-sequence-hyphen-indicator-newline", {
    meta: {
        docs: {
            description: "enforce consistent line breaks after `-` indicator",
            categories: ["standard"],
            extensionRule: false,
            layout: true,
        },
        fixable: "whitespace",
        schema: [
            { enum: ["always", "never"] },
            {
                type: "object",
                properties: {
                    nestedHyphen: { enum: ["always", "never"] },
                },
                additionalProperties: false,
            },
        ],
        messages: {
            unexpectedLinebreakAfterIndicator: "Unexpected line break after this `-` indicator.",
            expectedLinebreakAfterIndicator: "Expected a line break after this `-` indicator.",
        },
        type: "layout",
    },
    create(context) {
        var _a;
        const sourceCode = context.getSourceCode();
        if (!context.parserServices.isYAML) {
            return {};
        }
        const style = context.options[0] || "never";
        const nestedHyphenStyle = ((_a = context.options[1]) === null || _a === void 0 ? void 0 : _a.nestedHyphen) || "always";
        function getStyleOption(hyphen) {
            const next = sourceCode.getTokenAfter(hyphen);
            if (next && (0, ast_utils_1.isHyphen)(next)) {
                return nestedHyphenStyle;
            }
            return style;
        }
        return {
            YAMLSequence(node) {
                if (node.style !== "block") {
                    return;
                }
                for (const entry of node.entries) {
                    if (!entry) {
                        continue;
                    }
                    const hyphen = sourceCode.getTokenBefore(entry);
                    if (!hyphen) {
                        continue;
                    }
                    const hasNewline = hyphen.loc.end.line < entry.loc.start.line;
                    if (hasNewline) {
                        if (getStyleOption(hyphen) === "never") {
                            context.report({
                                loc: hyphen.loc,
                                messageId: "unexpectedLinebreakAfterIndicator",
                                fix(fixer) {
                                    const spaces = " ".repeat(Math.max(entry.loc.start.column -
                                        hyphen.loc.end.column, 1));
                                    return fixer.replaceTextRange([hyphen.range[1], entry.range[0]], spaces);
                                },
                            });
                        }
                    }
                    else {
                        if (getStyleOption(hyphen) === "always") {
                            context.report({
                                loc: hyphen.loc,
                                messageId: "expectedLinebreakAfterIndicator",
                                fix(fixer) {
                                    const spaces = `\n${" ".repeat(entry.loc.start.column)}`;
                                    return fixer.replaceTextRange([hyphen.range[1], entry.range[0]], spaces);
                                },
                            });
                        }
                    }
                }
            },
        };
    },
});
