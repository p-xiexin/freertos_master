
export const QUEUE_SIZE = 5;

export const QUEUE_CODE = [
    { line: 1, text: "// Queue Send Implementation (Simplified)", type: 'comment' },
    { line: 2, text: "BaseType_t xQueueSend( QueueHandle_t xQueue, const void * pvItemToQueue, TickType_t xTicksToWait )", type: 'func' },
    { line: 3, text: "{", type: 'plain' },
    { line: 4, text: "    taskENTER_CRITICAL();", type: 'macro' },
    { line: 5, text: "    {", type: 'plain' },
    { line: 6, text: "        // 1. Check if space available", type: 'comment' },
    { line: 7, text: "        if( ( xQueue )->uxMessagesWaiting < ( xQueue )->uxLength )", type: 'keyword' },
    { line: 8, text: "        {", type: 'plain' },
    { line: 9, text: "            // 2. Copy Data to Queue Storage (Ring Buffer)", type: 'comment' },
    { line: 10, text: "            prvCopyDataToQueue( xQueue, pvItemToQueue, portMAX_DELAY );", type: 'call' },
    { line: 11, text: "            ", type: 'plain' },
    { line: 12, text: "            // 3. Update Count & Wake Reader", type: 'comment' },
    { line: 13, text: "            ( xQueue )->uxMessagesWaiting++;", type: 'plain' },
    { line: 14, text: "            if( listLIST_IS_EMPTY( &( xQueue->xTasksWaitingToReceive ) ) == pdFALSE )", type: 'keyword' },
    { line: 15, text: "            {", type: 'plain' },
    { line: 16, text: "                 if( xTaskRemoveFromEventList( &( xQueue->xTasksWaitingToReceive ) ) != pdFALSE )", type: 'call' },
    { line: 17, text: "                 {", type: 'plain' },
    { line: 18, text: "                      portYIELD_WITHIN_API(); // Context Switch immediately", type: 'macro' },
    { line: 19, text: "                 }", type: 'plain' },
    { line: 20, text: "            }", type: 'plain' },
    { line: 21, text: "        }", type: 'plain' },
    { line: 22, text: "        else", type: 'keyword' },
    { line: 23, text: "        {", type: 'plain' },
    { line: 24, text: "            // 4. Queue Full: Block Current Task", type: 'comment' },
    { line: 25, text: "            vTaskPlaceOnEventList( &( xQueue->xTasksWaitingToSend ), xTicksToWait );", type: 'call' },
    { line: 26, text: "        }", type: 'plain' },
    { line: 27, text: "    }", type: 'plain' },
    { line: 28, text: "    taskEXIT_CRITICAL();", type: 'macro' },
    { line: 29, text: "}", type: 'plain' }
];
