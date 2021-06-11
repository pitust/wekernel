import { DriverBase } from '../Driver'
import { getStivale2Header, panic, peek64, puts } from '../IO'
import { lookupStivaleTag } from '../Stivale2'

@Driver('loader.stivale2')
export class StivaleTags extends DriverBase {
    private tags: Map<u64, u64> = new Map()
    constructor() {
        super()
        let currentTag = peek64(getStivale2Header() + 128)
        while (currentTag) {
            const id = peek64(currentTag)
            this.tags.set(id, currentTag)
            currentTag = peek64(currentTag + 8)
        }
    }
    get(tag: u64): u64 {
        if (this.tags.has(tag)) return this.tags.get(tag)
        panic('Tag ' + lookupStivaleTag(tag) + ' not found!')
        while (1);
    }
    has(tag: u64): boolean {
        return this.tags.has(tag) == 1
    }
    static the(): StivaleTags {
        return _implthe()
    }
}