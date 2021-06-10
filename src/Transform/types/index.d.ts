declare function Fires(...a: string[]): <T>(t: T) => T
declare function Depends(...a: string[]): <T>(t: T) => T
declare function RDepends(...a: string[]): <T>(t: T) => T
declare function Driver(nm: string): <T>(t: T) => T
declare function _implthe(): never
