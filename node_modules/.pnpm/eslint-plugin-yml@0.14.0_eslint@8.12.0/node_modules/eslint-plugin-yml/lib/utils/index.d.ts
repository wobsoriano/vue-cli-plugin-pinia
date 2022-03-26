import type { RuleListener, RuleModule, PartialRuleModule, RuleContext } from "../types";
import type { Rule } from "eslint";
import type { AST } from "yaml-eslint-parser";
export declare function createRule(ruleName: string, rule: PartialRuleModule): RuleModule;
declare type CoreRuleListener = {
    [key: string]: (node: any) => void;
};
export declare function defineWrapperListener(coreRule: Rule.RuleModule, context: RuleContext, proxyOptions: {
    options: any[];
    createListenerProxy?: (listener: CoreRuleListener) => RuleListener;
}): RuleListener;
export declare function getProxyNode(node: AST.YAMLNode, properties: any): any;
export declare function isNode(data: any): boolean;
export declare function getCoreRule(ruleName: string): Rule.RuleModule;
export {};
