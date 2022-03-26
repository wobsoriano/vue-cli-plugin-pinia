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
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagResolvers = exports.STR = exports.NAN = exports.INFINITY = exports.FLOAT_BASE60 = exports.FLOAT = exports.INT_BASE60 = exports.INT_BASE16 = exports.INT_BASE8 = exports.INT_BASE2 = exports.INT = exports.FALSE = exports.TRUE = exports.NULL = void 0;
const Tags1_2 = __importStar(require("./tags1.2"));
// https://yaml.org/type/
// see https://yaml.org/type/null.html
exports.NULL = Tags1_2.NULL;
exports.TRUE = {
    // see https://yaml.org/type/bool.html
    tag: "tag:yaml.org,2002:bool",
    test(str) {
        // see https://yaml.org/type/bool.html
        return /^(?:y|Y|yes|Yes|YES|true|True|TRUE|on|On|ON)$/u.test(str);
    },
    resolve() {
        return true;
    },
};
exports.FALSE = {
    // see https://yaml.org/type/bool.html
    tag: "tag:yaml.org,2002:bool",
    test(str) {
        // see https://yaml.org/type/bool.html
        return /^(?:n|N|no|No|NO|false|False|FALSE|off|Off|OFF)$/u.test(str);
    },
    resolve() {
        return false;
    },
};
exports.INT = {
    // see https://yaml.org/type/int.html
    tag: "tag:yaml.org,2002:int",
    test(str) {
        // see https://yaml.org/type/int.html
        return /^[+-]?(?:0|[1-9][\d_]*)$/u.test(str);
    },
    resolve(str) {
        return resolveInt(str, 0, 10);
    },
};
exports.INT_BASE2 = {
    // see https://yaml.org/type/int.html
    tag: "tag:yaml.org,2002:int",
    test(str) {
        // see https://yaml.org/type/int.html
        return /^[+-]?0b[01_]+$/u.test(str);
    },
    resolve(str) {
        return resolveInt(str, 2, 2);
    },
};
exports.INT_BASE8 = {
    // see https://yaml.org/type/int.html
    tag: "tag:yaml.org,2002:int",
    test(str) {
        // see https://yaml.org/type/int.html
        return /^[+-]?0[0-7_]+$/u.test(str);
    },
    resolve(str) {
        return resolveInt(str, 1, 8);
    },
};
exports.INT_BASE16 = {
    // see https://yaml.org/type/int.html
    tag: "tag:yaml.org,2002:int",
    test(str) {
        // see https://yaml.org/type/int.html
        return /^[+-]?0x[\dA-F_a-f]+$/u.test(str);
    },
    resolve(str) {
        return resolveInt(str, 2, 16);
    },
};
exports.INT_BASE60 = {
    // see https://yaml.org/type/int.html
    tag: "tag:yaml.org,2002:int",
    test(str) {
        // see https://yaml.org/type/int.html
        return /^[+-]?[1-9][\d_]*(?::[0-5]?\d)+$/u.test(str);
    },
    resolve(str) {
        return resolveBase60(str.split(/:/gu), true);
    },
};
exports.FLOAT = {
    // see https://yaml.org/type/float.html
    tag: "tag:yaml.org,2002:float",
    test(str) {
        // see https://yaml.org/type/float.html
        return (/^[+-]?(?:\d[\d_]*)?\.[\d_]*(?:[Ee][+-]\d+)?$/u.test(str) ||
            // The previous regexp cannot handle "e" without dot. spec bug?
            /^[+-]?(?:\d[\d_]*)?(?:[Ee][+-]\d+)?$/u.test(str));
    },
    resolve(str) {
        return parseFloat(str.replace(/_/gu, ""));
    },
};
exports.FLOAT_BASE60 = {
    // see https://yaml.org/type/float.html
    tag: "tag:yaml.org,2002:float",
    test(str) {
        // see https://yaml.org/type/float.html
        return /^[+-]?\d[\d_]*(?::[0-5]?\d)+\.[\d_]*$/u.test(str);
    },
    resolve(str) {
        return resolveBase60(str.split(/:/gu), false);
    },
};
// see https://yaml.org/type/float.html
exports.INFINITY = Tags1_2.INFINITY;
// see https://yaml.org/type/float.html
exports.NAN = Tags1_2.NAN;
// see https://yaml.org/type/str.html
exports.STR = Tags1_2.STR;
// !!Currently, timestamps are not supported as they affect the type definition.
// If the user needs timestamps, we will consider supporting it in the major version.
// https://yaml.org/type/timestamp.html
exports.tagResolvers = [
    exports.NULL,
    exports.TRUE,
    exports.FALSE,
    exports.INT_BASE8,
    exports.INT,
    exports.INT_BASE2,
    exports.INT_BASE16,
    exports.INT_BASE60,
    exports.FLOAT,
    exports.FLOAT_BASE60,
    exports.INFINITY,
    exports.NAN,
    exports.STR,
];
/**
 * Resolve int value
 */
function resolveInt(value, skip, radix) {
    if ((skip > 0 && value.startsWith("-")) || value.startsWith("+")) {
        return parseInt(value[0] + value.slice(skip + 1).replace(/_/gu, ""), radix);
    }
    return parseInt(value.slice(skip).replace(/_/gu, ""), radix);
}
/**
 * Resolve base 60 number value
 */
function resolveBase60(values, isInt) {
    let first = values.shift().replace(/_/gu, "");
    const last = values.pop().replace(/_/gu, "");
    let minus = false;
    if (first.startsWith("-") || first.startsWith("+")) {
        minus = first.startsWith("-");
        first = first.slice(1);
    }
    let value = parseInt(first, 10);
    while (values.length) {
        value *= 60;
        value += parseInt(values.shift().replace(/_/gu, ""), 10);
    }
    value *= 60;
    value += isInt ? parseInt(last, 10) : parseFloat(last);
    return minus ? -value : value;
}
