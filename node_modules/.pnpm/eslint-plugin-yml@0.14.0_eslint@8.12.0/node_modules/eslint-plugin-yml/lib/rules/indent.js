"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("../utils");
const yaml_1 = require("../utils/yaml");
const ast_utils_1 = require("../utils/ast-utils");
const ITERATION_OPTS = Object.freeze({
    includeComments: true,
});
exports.default = (0, utils_1.createRule)("indent", {
    meta: {
        docs: {
            description: "enforce consistent indentation",
            categories: ["standard"],
            extensionRule: false,
            layout: true,
        },
        fixable: "whitespace",
        schema: [
            {
                type: "integer",
                minimum: 2,
            },
        ],
        messages: {
            wrongIndentation: "Expected indentation of {{expected}} spaces but found {{actual}} spaces.",
        },
        type: "layout",
    },
    create(context) {
        if (!context.parserServices.isYAML) {
            return {};
        }
        if ((0, yaml_1.hasTabIndent)(context)) {
            return {};
        }
        const numOfIndent = (0, yaml_1.getNumOfIndent)(context, context.options[0]);
        const sourceCode = context.getSourceCode();
        const offsets = new Map();
        const marks = new Set();
        const scalars = new Map();
        function setOffset(token, offset, baseToken, options) {
            var _a;
            if (token == null) {
                return;
            }
            if (Array.isArray(token)) {
                for (const t of token) {
                    setOffset(t, offset, baseToken, options);
                }
            }
            else {
                offsets.set(token, {
                    baseToken,
                    offset,
                    offsetWhenBaseIsNotFirst: (_a = options === null || options === void 0 ? void 0 : options.offsetWhenBaseIsNotFirst) !== null && _a !== void 0 ? _a : null,
                });
            }
        }
        function processNodeList(nodeList, left, right, offset) {
            let lastToken = left;
            const alignTokens = new Set();
            for (const node of nodeList) {
                if (node == null) {
                    continue;
                }
                const elementTokens = {
                    firstToken: sourceCode.getFirstToken(node),
                    lastToken: sourceCode.getLastToken(node),
                };
                let t = lastToken;
                while ((t = sourceCode.getTokenAfter(t, ITERATION_OPTS)) != null &&
                    t.range[1] <= elementTokens.firstToken.range[0]) {
                    alignTokens.add(t);
                }
                alignTokens.add(elementTokens.firstToken);
                lastToken = elementTokens.lastToken;
            }
            if (right != null) {
                let t = lastToken;
                while ((t = sourceCode.getTokenAfter(t, ITERATION_OPTS)) != null &&
                    t.range[1] <= right.range[0]) {
                    alignTokens.add(t);
                }
            }
            alignTokens.delete(left);
            setOffset([...alignTokens], offset, left);
            if (right != null) {
                setOffset(right, 0, left);
            }
        }
        const documents = [];
        return {
            YAMLDocument(node) {
                documents.push(node);
                const first = sourceCode.getFirstToken(node, ITERATION_OPTS);
                if (!first) {
                    return;
                }
                offsets.set(first, {
                    baseToken: null,
                    offsetWhenBaseIsNotFirst: null,
                    offset: 0,
                    expectedIndent: 0,
                });
                processNodeList([...node.directives, node.content], first, null, 0);
            },
            YAMLMapping(node) {
                if (node.style === "flow") {
                    const open = sourceCode.getFirstToken(node);
                    const close = sourceCode.getLastToken(node);
                    processNodeList(node.pairs, open, close, 1);
                }
                else if (node.style === "block") {
                    const first = sourceCode.getFirstToken(node);
                    processNodeList(node.pairs, first, null, 0);
                }
            },
            YAMLSequence(node) {
                if (node.style === "flow") {
                    const open = sourceCode.getFirstToken(node);
                    const close = sourceCode.getLastToken(node);
                    processNodeList(node.entries, open, close, 1);
                }
                else if (node.style === "block") {
                    const first = sourceCode.getFirstToken(node);
                    processNodeList(node.entries, first, null, 0);
                    for (const entry of node.entries) {
                        if (!entry) {
                            continue;
                        }
                        const hyphen = sourceCode.getTokenBefore(entry, ast_utils_1.isHyphen);
                        marks.add(hyphen);
                        const entryToken = sourceCode.getFirstToken(entry);
                        setOffset(entryToken, 1, hyphen);
                    }
                }
            },
            YAMLPair(node) {
                const pairFirst = sourceCode.getFirstToken(node);
                let questionToken = null;
                let keyToken = null;
                let colonToken = null;
                let valueToken = null;
                if ((0, ast_utils_1.isQuestion)(pairFirst)) {
                    questionToken = pairFirst;
                    marks.add(questionToken);
                }
                if (node.value) {
                    valueToken = sourceCode.getFirstToken(node.value);
                    colonToken = sourceCode.getTokenBefore(node.value, ast_utils_1.isColon);
                }
                if (node.key) {
                    keyToken = sourceCode.getFirstToken(node.key);
                    if (!colonToken) {
                        const token = sourceCode.getTokenAfter(node.key, ast_utils_1.isColon);
                        if (token && token.range[0] < node.range[1]) {
                            colonToken = token;
                        }
                    }
                }
                if (!colonToken) {
                    const tokens = sourceCode.getTokens(node, ast_utils_1.isColon);
                    if (tokens.length) {
                        colonToken = tokens[0];
                    }
                }
                if (keyToken) {
                    if (questionToken) {
                        setOffset(keyToken, 1, questionToken);
                    }
                }
                if (colonToken) {
                    marks.add(colonToken);
                    if (questionToken) {
                        setOffset(colonToken, 0, questionToken, {
                            offsetWhenBaseIsNotFirst: 1,
                        });
                    }
                    else if (keyToken) {
                        setOffset(colonToken, 1, keyToken);
                    }
                }
                if (valueToken) {
                    if (colonToken) {
                        setOffset(valueToken, 1, colonToken);
                    }
                    else if (keyToken) {
                        setOffset(valueToken, 1, keyToken);
                    }
                }
            },
            YAMLWithMeta(node) {
                const anchorToken = node.anchor && sourceCode.getFirstToken(node.anchor);
                const tagToken = node.tag && sourceCode.getFirstToken(node.tag);
                let baseToken;
                if (anchorToken && tagToken) {
                    if (anchorToken.range[0] < tagToken.range[0]) {
                        setOffset(tagToken, 0, anchorToken, {
                            offsetWhenBaseIsNotFirst: 1,
                        });
                        baseToken = anchorToken;
                    }
                    else {
                        setOffset(anchorToken, 0, tagToken, {
                            offsetWhenBaseIsNotFirst: 1,
                        });
                        baseToken = tagToken;
                    }
                }
                else {
                    baseToken = (anchorToken || tagToken);
                }
                if (node.value) {
                    const valueToken = sourceCode.getFirstToken(node.value);
                    setOffset(valueToken, 1, baseToken);
                }
            },
            YAMLScalar(node) {
                if (node.style === "folded" || node.style === "literal") {
                    if (!node.value.trim()) {
                        return;
                    }
                    const mark = sourceCode.getFirstToken(node);
                    const literal = sourceCode.getLastToken(node);
                    setOffset(literal, 1, mark);
                    scalars.set(literal, node);
                }
                else {
                    scalars.set(sourceCode.getFirstToken(node), node);
                }
            },
            "Program:exit"(node) {
                const lineIndentsWk = [];
                let tokensOnSameLine = [];
                for (const token of sourceCode.getTokens(node, ITERATION_OPTS)) {
                    if (tokensOnSameLine.length === 0 ||
                        tokensOnSameLine[0].loc.start.line ===
                            token.loc.start.line) {
                        tokensOnSameLine.push(token);
                    }
                    else {
                        const lineIndent = processExpectedIndent(tokensOnSameLine);
                        lineIndentsWk[lineIndent.line] = lineIndent;
                        tokensOnSameLine = [token];
                    }
                }
                if (tokensOnSameLine.length >= 1) {
                    const lineIndent = processExpectedIndent(tokensOnSameLine);
                    lineIndentsWk[lineIndent.line] = lineIndent;
                }
                const lineIndents = processMissingLines(lineIndentsWk);
                validateLines(lineIndents);
            },
        };
        function processExpectedIndent(lineTokens) {
            const lastToken = lineTokens[lineTokens.length - 1];
            let lineExpectedIndent = null;
            let cacheExpectedIndent = null;
            const markData = [];
            const firstToken = lineTokens.shift();
            let token = firstToken;
            let expectedIndent = getExpectedIndent(token);
            if (expectedIndent != null) {
                lineExpectedIndent = expectedIndent;
                cacheExpectedIndent = expectedIndent;
            }
            while (token && marks.has(token) && expectedIndent != null) {
                const nextToken = lineTokens.shift();
                if (!nextToken) {
                    break;
                }
                const nextExpectedIndent = getExpectedIndent(nextToken);
                if (nextExpectedIndent == null ||
                    expectedIndent >= nextExpectedIndent) {
                    lineTokens.unshift(nextToken);
                    break;
                }
                markData.push({
                    mark: token,
                    next: nextToken,
                    expectedOffset: nextExpectedIndent -
                        expectedIndent -
                        1,
                    actualOffset: nextToken.range[0] - token.range[1],
                });
                token = nextToken;
                expectedIndent = nextExpectedIndent;
                cacheExpectedIndent = expectedIndent;
            }
            if (lineExpectedIndent == null) {
                while ((token = lineTokens.shift()) != null) {
                    lineExpectedIndent = getExpectedIndent(token);
                    if (lineExpectedIndent != null) {
                        break;
                    }
                }
            }
            const scalarNode = scalars.get(lastToken);
            if (scalarNode) {
                lineTokens.pop();
            }
            if (cacheExpectedIndent != null) {
                while ((token = lineTokens.shift()) != null) {
                    const offset = offsets.get(token);
                    if (offset) {
                        offset.expectedIndent = cacheExpectedIndent;
                    }
                }
            }
            let lastScalar = null;
            if (scalarNode) {
                const expectedScalarIndent = getExpectedIndent(lastToken);
                if (expectedScalarIndent != null) {
                    lastScalar = {
                        expectedIndent: expectedScalarIndent,
                        token: lastToken,
                        node: scalarNode,
                    };
                }
            }
            const { line, column } = firstToken.loc.start;
            return {
                expectedIndent: lineExpectedIndent,
                actualIndent: column,
                firstToken,
                line,
                markData,
                lastScalar,
            };
        }
        function getExpectedIndent(token) {
            if (token.type === "Marker") {
                return 0;
            }
            const offset = offsets.get(token);
            if (!offset) {
                return null;
            }
            if (offset.expectedIndent != null) {
                return offset.expectedIndent;
            }
            if (offset.baseToken == null) {
                return null;
            }
            const baseIndent = getExpectedIndent(offset.baseToken);
            if (baseIndent == null) {
                return null;
            }
            let offsetIndent = offset.offset;
            if (offsetIndent === 0 && offset.offsetWhenBaseIsNotFirst != null) {
                let before = offset.baseToken;
                while ((before = sourceCode.getTokenBefore(before, ITERATION_OPTS)) != null) {
                    if (!marks.has(before)) {
                        break;
                    }
                }
                if ((before === null || before === void 0 ? void 0 : before.loc.end.line) === offset.baseToken.loc.start.line) {
                    offsetIndent = offset.offsetWhenBaseIsNotFirst;
                }
            }
            return (offset.expectedIndent =
                baseIndent + numOfIndent * offsetIndent);
        }
        function processMissingLines(lineIndents) {
            const results = [];
            const commentLines = [];
            for (const lineIndent of lineIndents) {
                if (!lineIndent) {
                    continue;
                }
                const line = lineIndent.line;
                if (lineIndent.firstToken.type === "Block") {
                    const last = commentLines[commentLines.length - 1];
                    if (last && last.range[1] === line - 1) {
                        last.range[1] = line;
                        last.commentLineIndents.push(lineIndent);
                    }
                    else {
                        commentLines.push({
                            range: [line, line],
                            commentLineIndents: [lineIndent],
                        });
                    }
                }
                else if (lineIndent.expectedIndent != null) {
                    const indent = {
                        line,
                        expectedIndent: lineIndent.expectedIndent,
                        actualIndent: lineIndent.actualIndent,
                        markData: lineIndent.markData,
                    };
                    if (!results[line]) {
                        results[line] = indent;
                    }
                    if (lineIndent.lastScalar) {
                        const scalarNode = lineIndent.lastScalar.node;
                        if (scalarNode.style === "literal" ||
                            scalarNode.style === "folded") {
                            processBlockLiteral(indent, scalarNode, lineIndent.lastScalar.expectedIndent);
                        }
                        else {
                            processScalar(indent, scalarNode, lineIndent.lastScalar.expectedIndent);
                        }
                    }
                }
            }
            processComments(commentLines, lineIndents);
            return results;
            function processComments(commentLines, lineIndents) {
                var _a;
                for (const { range, commentLineIndents } of commentLines) {
                    let prev = results
                        .slice(0, range[0])
                        .filter((data) => data)
                        .pop();
                    const next = results
                        .slice(range[1] + 1)
                        .filter((data) => data)
                        .shift();
                    if (isBlockLiteral(prev)) {
                        prev = undefined;
                    }
                    const expectedIndents = [];
                    let either;
                    if (prev && next) {
                        expectedIndents.unshift(next.expectedIndent);
                        if (next.expectedIndent < prev.expectedIndent) {
                            let indent = next.expectedIndent + numOfIndent;
                            while (indent <= prev.expectedIndent) {
                                expectedIndents.unshift(indent);
                                indent += numOfIndent;
                            }
                        }
                    }
                    else if ((either = prev || next)) {
                        expectedIndents.unshift(either.expectedIndent);
                        if (!next) {
                            let indent = either.expectedIndent - numOfIndent;
                            while (indent >= 0) {
                                expectedIndents.push(indent);
                                indent -= numOfIndent;
                            }
                        }
                    }
                    if (!expectedIndents.length) {
                        continue;
                    }
                    let expectedIndent = expectedIndents[0];
                    for (const commentLineIndent of commentLineIndents) {
                        if (results[commentLineIndent.line]) {
                            continue;
                        }
                        expectedIndent = Math.min((_a = expectedIndents.find((indent, index) => {
                            var _a;
                            if (indent <= commentLineIndent.actualIndent) {
                                return true;
                            }
                            const prev = (_a = expectedIndents[index + 1]) !== null && _a !== void 0 ? _a : -1;
                            return (prev < commentLineIndent.actualIndent &&
                                commentLineIndent.actualIndent < indent);
                        })) !== null && _a !== void 0 ? _a : expectedIndent, expectedIndent);
                        results[commentLineIndent.line] = {
                            line: commentLineIndent.line,
                            expectedIndent,
                            actualIndent: commentLineIndent.actualIndent,
                            markData: commentLineIndent.markData,
                        };
                    }
                }
                function isBlockLiteral(prev) {
                    if (!prev) {
                        return false;
                    }
                    for (let prevLine = prev.line; prevLine >= 0; prevLine--) {
                        const prevLineIndent = lineIndents[prev.line];
                        if (!prevLineIndent) {
                            continue;
                        }
                        if (prevLineIndent.lastScalar) {
                            const scalarNode = prevLineIndent.lastScalar.node;
                            if (scalarNode.style === "literal" ||
                                scalarNode.style === "folded") {
                                if (scalarNode.loc.start.line <= prev.line &&
                                    prev.line <= scalarNode.loc.end.line) {
                                    return true;
                                }
                            }
                        }
                        return false;
                    }
                    return false;
                }
            }
            function processBlockLiteral(lineIndent, scalarNode, expectedIndent) {
                if (scalarNode.indent != null) {
                    if (lineIndent.expectedIndent < lineIndent.actualIndent) {
                        lineIndent.expectedIndent = lineIndent.actualIndent;
                        return;
                    }
                    lineIndent.indentBlockScalar = {
                        node: scalarNode,
                    };
                }
                const firstLineActualIndent = lineIndent.actualIndent;
                for (let scalarLine = lineIndent.line + 1; scalarLine <= scalarNode.loc.end.line; scalarLine++) {
                    const actualLineIndent = getActualLineIndent(scalarLine);
                    if (actualLineIndent == null) {
                        continue;
                    }
                    const scalarActualIndent = Math.min(firstLineActualIndent, actualLineIndent);
                    results[scalarLine] = {
                        line: scalarLine,
                        expectedIndent,
                        actualIndent: scalarActualIndent,
                        markData: [],
                    };
                }
            }
            function processScalar(lineIndent, scalarNode, expectedIndent) {
                for (let scalarLine = lineIndent.line + 1; scalarLine <= scalarNode.loc.end.line; scalarLine++) {
                    const scalarActualIndent = getActualLineIndent(scalarLine);
                    if (scalarActualIndent == null) {
                        continue;
                    }
                    results[scalarLine] = {
                        line: scalarLine,
                        expectedIndent,
                        actualIndent: scalarActualIndent,
                        markData: [],
                    };
                }
            }
        }
        function validateLines(lineIndents) {
            for (const lineIndent of lineIndents) {
                if (!lineIndent) {
                    continue;
                }
                if (lineIndent.actualIndent !== lineIndent.expectedIndent) {
                    context.report({
                        loc: {
                            start: {
                                line: lineIndent.line,
                                column: 0,
                            },
                            end: {
                                line: lineIndent.line,
                                column: lineIndent.actualIndent,
                            },
                        },
                        messageId: "wrongIndentation",
                        data: {
                            expected: String(lineIndent.expectedIndent),
                            actual: String(lineIndent.actualIndent),
                        },
                        fix: buildFix(lineIndent, lineIndents),
                    });
                }
                else if (lineIndent.markData.length) {
                    for (const markData of lineIndent.markData) {
                        if (markData.actualOffset !== markData.expectedOffset) {
                            const markLoc = markData.mark.loc.end;
                            const loc = markData.next.loc.start;
                            context.report({
                                loc: {
                                    start: markLoc,
                                    end: loc,
                                },
                                messageId: "wrongIndentation",
                                data: {
                                    expected: String(markData.expectedOffset),
                                    actual: String(markData.actualOffset),
                                },
                                fix: buildFix(lineIndent, lineIndents),
                            });
                        }
                    }
                }
            }
        }
        function buildFix(lineIndent, lineIndents) {
            var _a;
            const { line, expectedIndent } = lineIndent;
            const document = documents.find((doc) => doc.loc.start.line <= line && line <= doc.loc.end.line) || sourceCode.ast;
            let startLine = document.loc.start.line;
            let endLine = document.loc.end.line;
            for (let lineIndex = line - 1; lineIndex >= document.loc.start.line; lineIndex--) {
                const li = lineIndents[lineIndex];
                if (!li) {
                    continue;
                }
                if (li.expectedIndent < expectedIndent) {
                    if (expectedIndent <= li.actualIndent) {
                        return null;
                    }
                    for (const mark of li.markData) {
                        if (mark.actualOffset !== mark.expectedOffset) {
                            return null;
                        }
                    }
                    startLine = lineIndex + 1;
                    break;
                }
            }
            for (let lineIndex = line + 1; lineIndex <= document.loc.end.line; lineIndex++) {
                const li = lineIndents[lineIndex];
                if (!li) {
                    continue;
                }
                if (li && li.expectedIndent < expectedIndent) {
                    if (expectedIndent <= li.actualIndent) {
                        return null;
                    }
                    endLine = lineIndex - 1;
                    break;
                }
            }
            for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
                const li = lineIndents[lineIndex];
                if (li === null || li === void 0 ? void 0 : li.indentBlockScalar) {
                    const blockLiteral = li.indentBlockScalar.node;
                    const diff = li.expectedIndent - li.actualIndent;
                    const mark = sourceCode.getFirstToken(blockLiteral);
                    const num = (_a = /\d+/u.exec(mark.value)) === null || _a === void 0 ? void 0 : _a[0];
                    if (num != null) {
                        const newIndent = Number(num) + diff;
                        if (newIndent >= 10) {
                            return null;
                        }
                    }
                }
            }
            return function* (fixer) {
                let stacks = null;
                for (let lineIndex = startLine; lineIndex <= endLine; lineIndex++) {
                    const li = lineIndents[lineIndex];
                    if (!li) {
                        continue;
                    }
                    const lineExpectedIndent = li.expectedIndent;
                    if (stacks == null) {
                        if (li.expectedIndent !== li.actualIndent) {
                            yield* fixLine(fixer, li);
                        }
                    }
                    else {
                        if (stacks.indent < lineExpectedIndent) {
                            stacks = {
                                indent: lineExpectedIndent,
                                parentIndent: stacks.indent,
                                upper: stacks,
                            };
                        }
                        else if (lineExpectedIndent < stacks.indent) {
                            stacks = stacks.upper;
                        }
                        if (li.actualIndent <= stacks.parentIndent) {
                            yield* fixLine(fixer, li);
                        }
                    }
                    if (li.markData) {
                        for (const markData of li.markData) {
                            yield fixer.replaceTextRange([
                                markData.mark.range[1],
                                markData.next.range[0],
                            ], " ".repeat(markData.expectedOffset));
                        }
                    }
                }
            };
        }
        function* fixLine(fixer, li) {
            if (li.indentBlockScalar) {
                const blockLiteral = li.indentBlockScalar.node;
                const diff = li.expectedIndent - li.actualIndent;
                const mark = sourceCode.getFirstToken(blockLiteral);
                yield fixer.replaceText(mark, mark.value.replace(/\d+/u, (num) => `${Number(num) + diff}`));
            }
            const expectedIndent = li.expectedIndent;
            yield fixer.replaceTextRange([
                sourceCode.getIndexFromLoc({
                    line: li.line,
                    column: 0,
                }),
                sourceCode.getIndexFromLoc({
                    line: li.line,
                    column: li.actualIndent,
                }),
            ], " ".repeat(expectedIndent));
        }
        function getActualLineIndent(line) {
            const lineText = sourceCode.lines[line - 1];
            if (!lineText.length) {
                return null;
            }
            return /^\s*/u.exec(lineText)[0].length;
        }
    },
});
