
import { TaskState } from '../types';

export const CODE_LINES = [
  { line: 1, text: "void vTaskFunction( void *pvParameters )", type: 'func' },
  { line: 2, text: "{", type: 'plain' },
  { line: 3, text: "    for( ;; )", type: 'keyword' },
  { line: 4, text: "    {", type: 'plain' },
  { line: 5, text: "        // 1. Task Running (占用 CPU)", type: 'comment' },
  { line: 6, text: "        PerformApplicationTask();", type: 'call', action: 'processing' },
  { line: 7, text: "", type: 'plain' },
  { line: 8, text: "        // 2. Yield (时间片耗尽/主动让出)", type: 'comment' },
  { line: 9, text: "        taskYIELD();", type: 'macro', action: 'yield' },
  { line: 10, text: "", type: 'plain' },
  { line: 11, text: "        // 3. Block (等待事件/延时)", type: 'comment' },
  { line: 12, text: "        vTaskDelay( pdMS_TO_TICKS(100) );", type: 'call', action: 'block' },
  { line: 13, text: "", type: 'plain' },
  { line: 14, text: "        // 4. Suspend (挂起)", type: 'comment' },
  { line: 15, text: "        vTaskSuspend( NULL );", type: 'call', action: 'suspend' },
  { line: 16, text: "    }", type: 'plain' },
  { line: 17, text: "}", type: 'plain' },
  { line: 18, text: "", type: 'plain' },
  { line: 19, text: "// ISR Context", type: 'comment' },
  { line: 20, text: "xTaskResumeFromISR( xHandle );", type: 'call', action: 'resume' },
  { line: 21, text: "xTimerCallback(); // Timeout", type: 'call', action: 'timeout' }
];
