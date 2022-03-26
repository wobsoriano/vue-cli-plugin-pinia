export declare type TagResolver<T> = {
    tag: string;
    test: (str: string) => boolean;
    resolve: (str: string) => T;
};
