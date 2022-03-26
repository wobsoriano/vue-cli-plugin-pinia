"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
exports.default = (0, utils_1.createRule)("no-multiple-empty-lines", {
    meta: {
        docs: {
            description: "disallow multiple empty lines",
            categories: null,
            extensionRule: "no-multiple-empty-lines",
            layout: true,
        },
        fixable: "whitespace",
        schema: [
            {
                type: "object",
                properties: {
                    max: {
                        type: "integer",
                        minimum: 0,
                    },
                    maxEOF: {
                        type: "integer",
                        minimum: 0,
                    },
                    maxBOF: {
                        type: "integer",
                        minimum: 0,
                    },
                },
                required: ["max"],
                additionalProperties: false,
            },
        ],
        messages: {
            blankBeginningOfFile: "Too many blank lines at the beginning of file. Max of {{max}} allowed.",
            blankEndOfFile: "Too many blank lines at the end of file. Max of {{max}} allowed.",
            consecutiveBlank: "More than {{max}} blank {{pluralizedLines}} not allowed.",
        },
        type: "layout",
    },
    create(context) {
        var _a, _b, _c, _d, _e, _f;
        if (!context.parserServices.isYAML) {
            return {};
        }
        const maxOption = (_b = (_a = context.options[0]) === null || _a === void 0 ? void 0 : _a.max) !== null && _b !== void 0 ? _b : 2;
        const options = {
            max: maxOption,
            maxEOF: (_d = (_c = context.options[0]) === null || _c === void 0 ? void 0 : _c.maxEOF) !== null && _d !== void 0 ? _d : maxOption,
            maxBOF: (_f = (_e = context.options[0]) === null || _e === void 0 ? void 0 : _e.maxBOF) !== null && _f !== void 0 ? _f : maxOption,
        };
        const sourceCode = context.getSourceCode();
        const allLines = [...sourceCode.lines];
        if (allLines[allLines.length - 1] === "") {
            allLines.pop();
        }
        const ignoreLineIndexes = new Set();
        function verifyEmptyLines(startLineIndex, endLineIndex) {
            const emptyLineCount = endLineIndex - startLineIndex;
            let messageId, max;
            if (startLineIndex === 0) {
                messageId = "blankBeginningOfFile";
                max = options.maxBOF;
            }
            else if (endLineIndex === allLines.length) {
                messageId = "blankEndOfFile";
                max = options.maxEOF;
            }
            else {
                messageId = "consecutiveBlank";
                max = options.max;
            }
            if (emptyLineCount > max) {
                context.report({
                    loc: {
                        start: {
                            line: startLineIndex + max + 1,
                            column: 0,
                        },
                        end: { line: endLineIndex + 1, column: 0 },
                    },
                    messageId,
                    data: {
                        max: String(max),
                        pluralizedLines: max === 1 ? "line" : "lines",
                    },
                    fix(fixer) {
                        const rangeStart = sourceCode.getIndexFromLoc({
                            line: startLineIndex + max + 1,
                            column: 0,
                        });
                        const rangeEnd = endLineIndex < allLines.length
                            ? sourceCode.getIndexFromLoc({
                                line: endLineIndex + 1,
                                column: 0,
                            })
                            : sourceCode.text.length;
                        return fixer.removeRange([rangeStart, rangeEnd]);
                    },
                });
            }
        }
        return {
            YAMLScalar(node) {
                for (let lineIndex = node.loc.start.line - 1; lineIndex < node.loc.end.line; lineIndex++) {
                    ignoreLineIndexes.add(lineIndex);
                }
            },
            "Program:exit"() {
                let startEmptyLineIndex = null;
                for (let lineIndex = 0; lineIndex < allLines.length; lineIndex++) {
                    const line = allLines[lineIndex];
                    const isEmptyLine = !line.trim() && !ignoreLineIndexes.has(lineIndex);
                    if (isEmptyLine) {
                        startEmptyLineIndex !== null && startEmptyLineIndex !== void 0 ? startEmptyLineIndex : (startEmptyLineIndex = lineIndex);
                    }
                    else {
                        if (startEmptyLineIndex != null) {
                            verifyEmptyLines(startEmptyLineIndex, lineIndex);
                        }
                        startEmptyLineIndex = null;
                    }
                }
                if (startEmptyLineIndex != null) {
                    verifyEmptyLines(startEmptyLineIndex, allLines.length);
                }
            },
        };
    },
});
