// Kernel command line parser

import { panic } from './IO'

enum ParserState {
    StateDefault,
    StateString,
    StateEscape,
}

const settings = new Map<string, string>()

export function parseCmdline(cmdline: string): void {
    const segments: string[] = []
    let state: ParserState = ParserState.StateDefault

    for (let i = 0; i < cmdline.length; i++) {
        if (segments.length == 0) segments.push('')
        if (state == ParserState.StateDefault) {
            if (cmdline.charAt(i) == '"') {
                state = ParserState.StateString
                continue
            }
            if (cmdline.charAt(i) == ' ') {
                segments.push('')
                continue
            }
            segments[segments.length - 1] += cmdline.charAt(i)
        }
        if (state == ParserState.StateString) {
            if (cmdline.charAt(i) == '"') {
                state = ParserState.StateDefault
                continue
            }
            if (cmdline.charAt(i) == '\\') {
                state = ParserState.StateEscape
                continue
            }
            segments[segments.length - 1] += cmdline.charAt(i)
        }
        if (state == ParserState.StateEscape) {
            if (cmdline.charAt(i) == '"') segments[segments.length - 1] += cmdline.charAt(i)
            else if (cmdline.charAt(i) == '\\') segments[segments.length - 1] += cmdline.charAt(i)
            else if (cmdline.charAt(i) == 'n') segments[segments.length - 1] += '\n'
            else segments[segments.length - 1] += '\\' + cmdline.charAt(i)
            state = ParserState.StateString
        }
    }

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (!seg.includes('=')) {
            if (seg.startsWith('no')) {
                settings.set(seg.slice(2), 'no')
            } else {
                settings.set(seg, 'yes')
            }
        } else {
            const split = seg.split('=')
            if (split.length != 2) {
                panic('Unable to parse kernel command line: segment `' + seg + '` cannot be split nicely!')
            }
            settings.set(split[0], split[1])
        }
    }
}

export function stringopt(opt: string, defaultValue: string = '<panic-on-access>'): string {
    const result = settings.has(opt) ? settings.get(opt) : defaultValue
    if (result == '<panic-on-access>') panic('Option `' + opt + '` was required but not provided')
    return result
}

export function boolean(opt: string, defaultValue: boolean): boolean {
    const result = stringopt(opt, defaultValue ? 'yes' : 'no')
    if (result == 'yes') return true
    if (result == 'no') return true
    if (result == 'maybe')
        panic('You must decide on the value of option `' + opt + "`. You can't just say you _maybe_ want it...")
    panic('Option `' + opt + '` was required but not provided')
    /* stub */
    return false
}
