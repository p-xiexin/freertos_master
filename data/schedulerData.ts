
export const KERNEL_TASKS_CODE = [
    { line: 1, text: "/* tasks.c - FreeRTOS Kernel Core */", type: 'comment' },
    { line: 2, text: "", type: 'plain' },
    { line: 3, text: "BaseType_t xTaskIncrementTick( void )", type: 'func' },
    { line: 4, text: "{", type: 'plain' },
    { line: 5, text: "    /* 1. Update System Time */", type: 'comment' },
    { line: 6, text: "    const TickType_t xConstTickCount = xTickCount + 1;", type: 'code' },
    { line: 7, text: "    xTickCount = xConstTickCount;", type: 'code' },
    { line: 8, text: "", type: 'plain' },
    { line: 9, text: "    /* 2. Check Blocked/Delayed Lists */", type: 'comment' },
    { line: 10, text: "    if( xConstTickCount >= xNextTaskUnblockTime )", type: 'keyword' },
    { line: 11, text: "    {", type: 'plain' },
    { line: 12, text: "        for( ;; ) {", type: 'keyword' },
    { line: 13, text: "            if( listLIST_IS_EMPTY( pxDelayedTaskList ) ) break;", type: 'code' },
    { line: 14, text: "            /* Remove from blocked, add to ready */", type: 'comment' },
    { line: 15, text: "            uxListRemove( &( pxTCB->xStateListItem ) );", type: 'call' },
    { line: 16, text: "            prvAddTaskToReadyList( pxTCB );", type: 'call' },
    { line: 17, text: "            xSwitchRequired = pdTRUE;", type: 'code' },
    { line: 18, text: "        }", type: 'plain' },
    { line: 19, text: "    }", type: 'plain' },
    { line: 20, text: "    return xSwitchRequired;", type: 'keyword' },
    { line: 21, text: "}", type: 'plain' },
    { line: 22, text: "", type: 'plain' },
    { line: 23, text: "void vTaskSwitchContext( void )", type: 'func' },
    { line: 24, text: "{", type: 'plain' },
    { line: 25, text: "    if( uxSchedulerSuspended != ( UBaseType_t ) pdFALSE )", type: 'keyword' },
    { line: 26, text: "    {", type: 'plain' },
    { line: 27, text: "        xYieldPending = pdTRUE;", type: 'code' },
    { line: 28, text: "    }", type: 'plain' },
    { line: 29, text: "    else", type: 'keyword' },
    { line: 30, text: "    {", type: 'plain' },
    { line: 31, text: "        xYieldPending = pdFALSE;", type: 'code' },
    { line: 32, text: "        /* Select Highest Priority Task */", type: 'comment' },
    { line: 33, text: "        taskSELECT_HIGHEST_PRIORITY_TASK();", type: 'macro' },
    { line: 34, text: "    }", type: 'plain' },
    { line: 35, text: "}", type: 'plain' },
    { line: 36, text: "", type: 'plain' },
    { line: 37, text: "/* Idle Task - Runs when no other task is READY */", type: 'comment' },
    { line: 38, text: "void prvIdleTask( void *pvParameters )", type: 'func' },
    { line: 39, text: "{", type: 'plain' },
    { line: 40, text: "    for( ;; ) {", type: 'keyword' },
    { line: 41, text: "        /* Wait For Interrupt (Low Power) */", type: 'comment' },
    { line: 42, text: "        prvCheckTasksWaitingTermination();", type: 'call' },
    { line: 43, text: "    }", type: 'plain' },
    { line: 44, text: "}", type: 'plain' }
];

export const PORT_CODE = [
    { line: 1, text: "/* port.c - Cortex-M3 Hardware Port */", type: 'comment' },
    { line: 2, text: "void SysTick_Handler( void )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    /* The SysTick runs at the lowest interrupt priority */", type: 'comment' },
    { line: 5, text: "    portDISABLE_INTERRUPTS();", type: 'macro' },
    { line: 6, text: "    {", type: 'plain' },
    { line: 7, text: "        /* Increment Tick & Check Delays */", type: 'comment' },
    { line: 8, text: "        if( xTaskIncrementTick() != pdFALSE )", type: 'keyword' },
    { line: 9, text: "        {", type: 'plain' },
    { line: 10, text: "            /* Context Switch Required */", type: 'comment' },
    { line: 11, text: "            portNVIC_INT_CTRL_REG = portNVIC_PENDSVSET_BIT;", type: 'code' },
    { line: 12, text: "        }", type: 'plain' },
    { line: 13, text: "    }", type: 'plain' },
    { line: 14, text: "    portENABLE_INTERRUPTS();", type: 'macro' },
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
    { line: 8, text: "        // 2. Simulate Workload", type: 'comment' },
    { line: 9, text: "        for(int i=0; i<500; i++) __NOP();", type: 'code' },
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
    insertOrder: number; // For Queue ordering (FIFO within priority)
}
