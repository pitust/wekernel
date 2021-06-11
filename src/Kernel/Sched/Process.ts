import { VMObject } from "../Memory/VMObject"
import { Thread } from "./Thread"


export class Process {
    vmobjects: Map<u64, VMObject> = new Map()
    page_table: Uint64Array = new Uint64Array(256)
    threads: Set<Thread> = new Set()
}