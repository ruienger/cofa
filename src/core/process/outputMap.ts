/**
 * 流程输出映射表类，负责存储流程名与其输出的映射关系
 * 主要供调度器及其他流程使用
 */
class ReadonlyMap<T, U> extends Map {
    /** key已经在Map中存在时不允许覆盖，使用方法同原生Map */
    set(key: T, value: U) {
        if (this.has(key)) return this
        return super.set(key, value)
    }
}
export default new ReadonlyMap<string, unknown>()