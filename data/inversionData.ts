
export const MUTEX_TAKE_CODE = [
    { line: 1, text: "/* Tries to take Mutex. If held, check for Priority Inversion */", type: 'comment' },
    { line: 2, text: "void *pvTaskIncrementMutexHeldCount( void )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    if( pxCurrentTCB != pxMutexHolder )", type: 'keyword' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        // Mutex is held by another task", type: 'comment' },
    { line: 7, text: "        if( pxCurrentTCB->uxPriority > pxMutexHolder->uxPriority )", type: 'keyword' },
    { line: 8, text: "        {", type: 'plain' },
    { line: 9, text: "            // INHERITANCE: Boost Holder Priority", type: 'comment' },
    { line: 10, text: "            taskENTER_CRITICAL();", type: 'macro' },
    { line: 11, text: "            xTaskPriorityInherit( pxMutexHolder );", type: 'call' },
    { line: 12, text: "            taskEXIT_CRITICAL();", type: 'macro' },
    { line: 13, text: "        }", type: 'plain' },
    { line: 14, text: "    }", type: 'plain' },
    { line: 15, text: "}", type: 'plain' }
];

export const INHERIT_LOGIC_CODE = [
    { line: 1, text: "/* Elevates priority of Mutex Holder */", type: 'comment' },
    { line: 2, text: "void xTaskPriorityInherit( TCB_t * const pxTCB )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    if( pxTCB->uxPriority < pxCurrentTCB->uxPriority )", type: 'keyword' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        // 1. Adjust Event List Item Value (for sorting)", type: 'comment' },
    { line: 7, text: "        listSET_LIST_ITEM_VALUE( &( pxTCB->xEventListItem ), ... );", type: 'call' },
    { line: 8, text: "        ", type: 'plain' },
    { line: 9, text: "        // 2. Direct Priority Update", type: 'comment' },
    { line: 10, text: "        pxTCB->uxPriority = pxCurrentTCB->uxPriority;", type: 'code' },
    { line: 11, text: "    }", type: 'plain' },
    { line: 12, text: "}", type: 'plain' }
];

export const DISINHERIT_LOGIC_CODE = [
    { line: 1, text: "/* Restores priority when Mutex is released */", type: 'comment' },
    { line: 2, text: "BaseType_t xTaskPriorityDisinherit( TCB_t * const pxTCB )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    if( pxTCB->uxPriority != pxTCB->uxBasePriority )", type: 'keyword' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        // Restore original base priority", type: 'comment' },
    { line: 7, text: "        pxTCB->uxPriority = pxTCB->uxBasePriority;", type: 'code' },
    { line: 8, text: "        ", type: 'plain' },
    { line: 9, text: "        // Re-insert into correct Ready List", type: 'comment' },
    { line: 10, text: "        listSET_LIST_ITEM_VALUE( &( pxTCB->xEventListItem ), ... );", type: 'call' },
    { line: 11, text: "        prvAddTaskToReadyList( pxTCB );", type: 'call' },
    { line: 12, text: "        return pdTRUE;", type: 'keyword' },
    { line: 13, text: "    }", type: 'plain' },
    { line: 14, text: "}", type: 'plain' }
];

export const SCENARIO_STEPS = [
    { id: 0, text: "初始: 低优先级任务 (Low) 正在运行", codeLine: 0, codeTab: 'take' },
    { id: 1, text: "Low 任务获取 Mutex", codeLine: 4, codeTab: 'take' },
    { id: 2, text: "高优先级任务 (High) 抢占 Low", codeLine: 2, codeTab: 'take' },
    { id: 3, text: "High 尝试获取 Mutex -> 发现被 Low 占用", codeLine: 7, codeTab: 'take' },
    { id: 4, text: "内核检测到反转风险 -> 触发继承", codeLine: 11, codeTab: 'take' },
    { id: 5, text: "执行继承: 提升 Low 的优先级至 High", codeLine: 10, codeTab: 'inherit' },
    { id: 6, text: "中优先级任务 (Med) 尝试运行 -> 失败 (Low优先级更高)", codeLine: 10, codeTab: 'inherit' },
    { id: 7, text: "Low 执行完毕释放 Mutex -> 恢复 BasePriority", codeLine: 7, codeTab: 'disinherit' },
    { id: 8, text: "High 获取 Mutex 并运行", codeLine: 12, codeTab: 'disinherit' },
];
