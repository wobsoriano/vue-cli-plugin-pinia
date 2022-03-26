"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const rules_1 = require("./utils/rules");
const base_1 = __importDefault(require("./configs/base"));
const recommended_1 = __importDefault(require("./configs/recommended"));
const standard_1 = __importDefault(require("./configs/standard"));
const prettier_1 = __importDefault(require("./configs/prettier"));
const configs = {
    base: base_1.default,
    recommended: recommended_1.default,
    standard: standard_1.default,
    prettier: prettier_1.default,
};
const rules = rules_1.rules.reduce((obj, r) => {
    obj[r.meta.docs.ruleName] = r;
    return obj;
}, {});
module.exports = {
    configs,
    rules,
};
