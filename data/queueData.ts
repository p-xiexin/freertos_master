
export const QUEUE_SIZE = 5;

export const QUEUE_CODE_SEND = [
    { line: 1, text: "// Standard Send (FIFO) - writes to pcWriteTo", type: 'comment' },
    { line: 2, text: "BaseType_t xQueueSendToBack( QueueHandle_t xQueue, const void * pvItem, TickType_t xTicksToWait )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    taskENTER_CRITICAL();", type: 'macro' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        if( xQueue->uxMessagesWaiting < xQueue->uxLength )", type: 'keyword' },
    { line: 7, text: "        {", type: 'plain' },
    { line: 8, text: "            // Copy to: xQueue->pcWriteTo", type: 'comment' },
    { line: 9, text: "            prvCopyDataToQueue( xQueue, pvItem, queueSEND_TO_BACK );", type: 'call' },
    { line: 10, text: "            xQueue->uxMessagesWaiting++;", type: 'code' },
    { line: 11, text: "            // Wake up waiting readers", type: 'comment' },
    { line: 12, text: "            if( listLIST_IS_EMPTY( &( xQueue->xTasksWaitingToReceive ) ) == pdFALSE ) {", type: 'keyword' },
    { line: 13, text: "                 if( xTaskRemoveFromEventList( ... ) ) portYIELD_WITHIN_API();", type: 'call' },
    { line: 14, text: "            }", type: 'plain' },
    { line: 15, text: "        }", type: 'plain' },
    { line: 16, text: "        else", type: 'keyword' },
    { line: 17, text: "        {", type: 'plain' },
    { line: 18, text: "            // Queue Full: Block Task", type: 'comment' },
    { line: 19, text: "            vTaskPlaceOnEventList( &( xQueue->xTasksWaitingToSend ), xTicksToWait );", type: 'call' },
    { line: 20, text: "        }", type: 'plain' },
    { line: 21, text: "    }", type: 'plain' },
    { line: 22, text: "    taskEXIT_CRITICAL();", type: 'macro' },
    { line: 23, text: "}", type: 'plain' }
];

export const QUEUE_CODE_FRONT = [
    { line: 1, text: "// Urgent Send (LIFO) - writes to u.pcReadFrom", type: 'comment' },
    { line: 2, text: "BaseType_t xQueueSendToFront( QueueHandle_t xQueue, const void * pvItem, TickType_t xTicksToWait )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    taskENTER_CRITICAL();", type: 'macro' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        if( xQueue->uxMessagesWaiting < xQueue->uxLength )", type: 'keyword' },
    { line: 7, text: "        {", type: 'plain' },
    { line: 8, text: "            // Copy to: xQueue->u.pcReadFrom (Slots backwards)", type: 'comment' },
    { line: 9, text: "            prvCopyDataToQueue( xQueue, pvItem, queueSEND_TO_FRONT );", type: 'call' },
    { line: 10, text: "            xQueue->uxMessagesWaiting++;", type: 'code' },
    { line: 11, text: "            // Wake up waiting readers", type: 'comment' },
    { line: 12, text: "            if( listLIST_IS_EMPTY( &( xQueue->xTasksWaitingToReceive ) ) == pdFALSE ) {", type: 'keyword' },
    { line: 13, text: "                 if( xTaskRemoveFromEventList( ... ) ) portYIELD_WITHIN_API();", type: 'call' },
    { line: 14, text: "            }", type: 'plain' },
    { line: 15, text: "        }", type: 'plain' },
    { line: 16, text: "        else { ... /* Block Logic */ ... }", type: 'keyword' },
    { line: 17, text: "    }", type: 'plain' },
    { line: 18, text: "    taskEXIT_CRITICAL();", type: 'macro' },
    { line: 19, text: "}", type: 'plain' }
];

export const QUEUE_CODE_RECEIVE = [
    { line: 1, text: "// Standard Receive - Reads from u.pcReadFrom + 1", type: 'comment' },
    { line: 2, text: "BaseType_t xQueueReceive( QueueHandle_t xQueue, void * pvBuffer, TickType_t xTicksToWait )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    taskENTER_CRITICAL();", type: 'macro' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        if( xQueue->uxMessagesWaiting > 0 )", type: 'keyword' },
    { line: 7, text: "        {", type: 'plain' },
    { line: 8, text: "            // 1. Read from (u.pcReadFrom + 1)", type: 'comment' },
    { line: 9, text: "            prvCopyDataFromQueue( xQueue, pvBuffer );", type: 'call' },
    { line: 10, text: "            // 2. Decrement Count", type: 'comment' },
    { line: 11, text: "            xQueue->uxMessagesWaiting--;", type: 'code' },
    { line: 12, text: "            // 3. Wake up waiting writers", type: 'comment' },
    { line: 13, text: "            if( listLIST_IS_EMPTY( &( xQueue->xTasksWaitingToSend ) ) == pdFALSE ) {", type: 'keyword' },
    { line: 14, text: "                 if( xTaskRemoveFromEventList( ... ) ) portYIELD_WITHIN_API();", type: 'call' },
    { line: 15, text: "            }", type: 'plain' },
    { line: 16, text: "        }", type: 'plain' },
    { line: 17, text: "        else", type: 'keyword' },
    { line: 18, text: "        {", type: 'plain' },
    { line: 19, text: "            // Queue Empty: Block Task", type: 'comment' },
    { line: 20, text: "            vTaskPlaceOnEventList( &( xQueue->xTasksWaitingToReceive ), xTicksToWait );", type: 'call' },
    { line: 21, text: "        }", type: 'plain' },
    { line: 22, text: "    }", type: 'plain' },
    { line: 23, text: "    taskEXIT_CRITICAL();", type: 'macro' },
    { line: 24, text: "}", type: 'plain' }
];

export interface QueueItem {
    value: number;
    type: 'NORMAL' | 'URGENT';
}
