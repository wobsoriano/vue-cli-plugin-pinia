import type { YAMLToken } from "../types";
export declare function isCommentToken(token: YAMLToken | null): boolean;
export declare function isTokenOnSameLine(left: YAMLToken, right: YAMLToken): boolean;
export declare function isQuestion(token: YAMLToken | null): token is YAMLToken;
export declare function isHyphen(token: YAMLToken | null): token is YAMLToken;
export declare function isColon(token: YAMLToken | null): token is YAMLToken;
export declare function isComma(token: YAMLToken | null): token is YAMLToken;
