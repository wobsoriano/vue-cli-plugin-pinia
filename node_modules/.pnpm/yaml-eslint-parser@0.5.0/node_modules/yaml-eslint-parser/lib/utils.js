"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getYAMLVersion = exports.getStaticYAMLValue = void 0;
const yaml_1 = require("yaml");
const tags_1 = require("./tags");
/**
 * Gets the static value for the given node.
 */
function getStaticYAMLValue(node) {
    return getValue(node, null);
}
exports.getStaticYAMLValue = getStaticYAMLValue;
/**
 * Gets the static value for the given node with YAML version.
 */
function getValue(node, version) {
    return resolver[node.type](node, version);
}
const resolver = {
    Program(node) {
        return node.body.length === 0
            ? null
            : node.body.length === 1
                ? // eslint-disable-next-line new-cap -- traverse key
                    resolver.YAMLDocument(node.body[0])
                : // eslint-disable-next-line new-cap -- traverse key
                    node.body.map((n) => resolver.YAMLDocument(n));
    },
    YAMLDocument(node) {
        return node.content
            ? getValue(node.content, getYAMLVersion(node))
            : null;
    },
    YAMLMapping(node, version) {
        const result = {};
        for (const pair of node.pairs) {
            Object.assign(result, getValue(pair, version));
        }
        return result;
    },
    YAMLPair(node, version) {
        const result = {};
        let key = node.key ? getValue(node.key, version) : null;
        if (typeof key !== "string" && typeof key !== "number") {
            key = String(key);
        }
        result[key] = node.value ? getValue(node.value, version) : null;
        return result;
    },
    YAMLSequence(node, version) {
        const result = [];
        for (const entry of node.entries) {
            result.push(entry ? getValue(entry, version) : null);
        }
        return result;
    },
    YAMLScalar(node) {
        return node.value;
    },
    YAMLAlias(node, version) {
        const anchor = findAnchor(node);
        return anchor ? getValue(anchor.parent, version) : null;
    },
    YAMLWithMeta(node, version) {
        if (node.tag) {
            if (node.value == null) {
                return getTaggedValue(node.tag, "", "", version);
            }
            if (node.value.type === "YAMLScalar") {
                if (node.value.style === "plain") {
                    return getTaggedValue(node.tag, node.value.strValue, node.value.strValue, version);
                }
                if (node.value.style === "double-quoted" ||
                    node.value.style === "single-quoted") {
                    return getTaggedValue(node.tag, node.value.raw, node.value.strValue, version);
                }
            }
        }
        if (node.value == null) {
            return null;
        }
        return getValue(node.value, version);
    },
};
/**
 * Find Anchor
 */
function findAnchor(node) {
    let p = node.parent;
    let doc = null;
    while (p) {
        if (p.type === "YAMLDocument") {
            doc = p;
            break;
        }
        p = p.parent;
    }
    const anchors = doc.anchors[node.name];
    if (!anchors) {
        return null;
    }
    let target = {
        anchor: null,
        distance: Infinity,
    };
    for (const anchor of anchors) {
        if (anchor.range[0] < node.range[0]) {
            const distance = node.range[0] - anchor.range[0];
            if (target.distance >= distance) {
                target = {
                    anchor,
                    distance,
                };
            }
        }
    }
    return target.anchor;
}
/**
 * Get tagged value
 */
function getTaggedValue(tag, text, str, version) {
    for (const tagResolver of tags_1.tagResolvers[version || "1.2"]) {
        if (tagResolver.tag === tag.tag && tagResolver.test(str)) {
            return tagResolver.resolve(str);
        }
    }
    const tagText = tag.tag.startsWith("!") ? tag.tag : `!<${tag.tag}>`;
    const value = (0, yaml_1.parseDocument)(`${version ? `%YAML ${version}` : ""}
---
${tagText} ${text}`).toJSON();
    return value;
}
/**
 * Get YAML version from then given document
 */
function getYAMLVersion(document) {
    var _a;
    for (const dir of document.directives) {
        const yamlVer = (_a = /^%YAML\s+(\d\.\d)$/.exec(dir.value)) === null || _a === void 0 ? void 0 : _a[1];
        if (yamlVer) {
            if (yamlVer === "1.1") {
                return "1.1";
            }
            if (yamlVer === "1.2") {
                return "1.2";
            }
            // Other versions are not supported
            return "1.2";
        }
    }
    return "1.2";
}
exports.getYAMLVersion = getYAMLVersion;
