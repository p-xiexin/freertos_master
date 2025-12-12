
export const TASKS_C_CODE = [
    { line: 1, text: "BaseType_t xTaskIncrementTick( void )", type: 'func' },
    { line: 2, text: "{", type: 'plain' },
    { line: 3, text: "    // 1. Increment System Tick", type: 'comment' },
    { line: 4, text: "    const TickType_t xConstTickCount = xTickCount + 1;", type: 'plain' },
    { line: 5, text: "    xTickCount = xConstTickCount;", type: 'code' },
    { line: 6, text: "", type: 'plain' },
    { line: 7, text: "    // 2. Check Blocked Lists", type: 'comment' },
    { line: 8, text: "    if( xConstTickCount >= xNextTaskUnblockTime )", type: 'keyword' },
    { line: 9, text: "    {", type: 'plain' },
    { line: 10, text: "        // Wake up tasks...", type: 'comment' },
    { line: 11, text: "        xSwitchRequired = pdTRUE;", type: 'code' },
    { line: 12, text: "    }", type: 'plain' },
    { line: 13, text: "", type: 'plain' },
    { line: 14, text: "    return xSwitchRequired;", type: 'keyword' },
    { line: 15, text: "}", type: 'plain' }
];

export const getLedTaskCode = (delay: number) => [
    { line: 1, text: "void vLEDTask( void *pvParameters )", type: 'func' },
    { line: 2, text: "{", type: 'plain' },
    { line: 3, text: "    for( ;; )", type: 'keyword' },
    { line: 4, text: "    {", type: 'plain' },
    { line: 5, text: "        // 1. Toggle LED (Atomic-ish)", type: 'comment' },
    { line: 6, text: "        HAL_GPIO_TogglePin(LED_Port, LED_Pin);", type: 'call' },
    { line: 7, text: "        ", type: 'plain' },
    { line: 8, text: "        // 2. Heavy work (Interruptible)", type: 'comment' },
    { line: 9, text: "        for(int i=0; i<500; i++);", type: 'code' },
    { line: 10, text: "        ", type: 'plain' },
    { line: 11, text: `        // 3. Block for ${delay} ticks`, type: 'comment' },
    { line: 12, text: `        vTaskDelay( ${delay} );`, type: 'call' },
    { line: 13, text: "    }", type: 'plain' },
    { line: 14, text: "}", type: 'plain' }
];

export const getUartTaskCode = (delay: number) => [
    { line: 1, text: "void vUARTTask( void *pvParameters )", type: 'func' },
    { line: 2, text: "{", type: 'plain' },
    { line: 3, text: "    for( ;; )", type: 'keyword' },
    { line: 4, text: "    {", type: 'plain' },
    { line: 5, text: "        // Critical: printf is non-reentrant!", type: 'comment' },
    { line: 6, text: "        taskENTER_CRITICAL();", type: 'macro' },
    { line: 7, text: "        {", type: 'plain' },
    { line: 8, text: "             printf(\"Tick: %d\\n\", xTickCount);", type: 'call' },
    { line: 9, text: "        }", type: 'plain' },
    { line: 10, text: "        taskEXIT_CRITICAL();", type: 'macro' },
    { line: 11, text: "", type: 'plain' },
    { line: 12, text: `        vTaskDelay( ${delay} );`, type: 'call' },
    { line: 13, text: "    }", type: 'plain' },
    { line: 14, text: "}", type: 'plain' }
];

export const ISR_CODE = [
    { line: 1, text: "void EXTI0_IRQHandler( void )", type: 'func' },
    { line: 2, text: "{", type: 'plain' },
    { line: 3, text: "    // Hardware Interrupt Entry", type: 'comment' },
    { line: 4, text: "    BaseType_t xHigherPriorityTaskWoken = pdFALSE;", type: 'plain' },
    { line: 5, text: "", type: 'plain' },
    { line: 6, text: "    // 1. Clear Interrupt Flag", type: 'comment' },
    { line: 7, text: "    __HAL_GPIO_EXTI_CLEAR_IT(GPIO_PIN_0);", type: 'call' },
    { line: 8, text: "", type: 'plain' },
    { line: 9, text: "    // 2. Notify System / Context Switch", type: 'comment' },
    { line: 10, text: "    portYIELD_FROM_ISR( xHigherPriorityTaskWoken );", type: 'macro' },
    { line: 11, text: "}", type: 'plain' }
];

export interface SimTask {
    id: number;
    name: string;
    priority: number;
    state: 'READY' | 'RUNNING' | 'BLOCKED';
    color: string;
    wakeTick: number; // 0 if not blocked
}
