export const TOTAL_STEPS = 14;

// Mock Register Data for STM32F4 (Cortex-M4)
export const MOCK_REGS_A = {
  r0: "0x20001000", r1: "0x00000001", r2: "0x20000800", r3: "0x00000000",
  r12: "0xDEADBEEF", lr: "0xFFFFFFFD", pc: "0x08001234", xpsr: "0x01000000",
  psp: "0x20000FF0", msp: "0x2000FF00"
};

export const MOCK_REGS_B = {
  r0: "0x20002000", r1: "0x00000002", r2: "0x20001800", r3: "0x00000000",
  r12: "0xCAFEBABE", lr: "0xFFFFFFFD", pc: "0x08005678", xpsr: "0x01000000",
  psp: "0x20001FF0", msp: "0x2000FF00"
};

// Assembly Code Mapping (Based on provided Real FreeRTOS portasm.s)
export const ASM_CODE = [
  { line: 1, text: ".global xPortPendSVHandler", comment: "" },
  { line: 2, text: "xPortPendSVHandler:", comment: "Entry Point" },
  { line: 3, text: "    mrs r0, psp", comment: "Read Process Stack Pointer" },
  { line: 4, text: "    isb", comment: "" },
  { line: 5, text: "", comment: "" },
  { line: 6, text: "    ; --- 1. Get Current TCB ---", comment: "" },
  { line: 7, text: "    ldr r3, =pxCurrentTCB", comment: "Load TCB pointer address" },
  { line: 8, text: "    ldr r2, [r3]", comment: "Load pxCurrentTCB address" },
  { line: 9, text: "", comment: "" },
  { line: 10, text: "    ; --- 2. Save SW Context ---", comment: "" },
  { line: 11, text: "    stmdb r0!, {r4-r11}", comment: "Save R4-R11 to stack" },
  { line: 12, text: "    str r0, [r2]", comment: "Save new TopOfStack to TCB" },
  { line: 13, text: "    ; --- 3. Prepare C Call ---", comment: "" },
  { line: 14, text: "    stmdb sp!, {r3, r14}", comment: "Save R3 & LR (EXC_RETURN)" },
  { line: 15, text: "", comment: "" },
  { line: 16, text: "    ; Disable Interrupts", comment: "" },
  { line: 17, text: "    mov r0, #configMAX_SYSCALL_INTERRUPT_PRIORITY", comment: "" },
  { line: 18, text: "    msr basepri, r0", comment: "" },
  { line: 19, text: "    dsb", comment: "" },
  { line: 20, text: "    isb", comment: "" },
  { line: 21, text: "", comment: "" },
  { line: 22, text: "    bl vTaskSwitchContext", comment: "Select next task" },
  { line: 23, text: "", comment: "" },
  { line: 24, text: "    ; Enable Interrupts", comment: "" },
  { line: 25, text: "    mov r0, #0", comment: "" },
  { line: 26, text: "    msr basepri, r0", comment: "" },
  { line: 27, text: "", comment: "" },
  { line: 28, text: "    ldmia sp!, {r3, r14}", comment: "Restore R3 & LR" },
  { line: 29, text: "    ; --- 4. Restore Context ---", comment: "" },
  { line: 30, text: "    ldr r1, [r3]", comment: "Load new pxCurrentTCB" },
  { line: 31, text: "    ldr r0, [r1]", comment: "Load new TopOfStack" },
  { line: 32, text: "", comment: "" },
  { line: 33, text: "    ldmia r0!, {r4-r11}", comment: "Restore R4-R11" },
  { line: 34, text: "", comment: "" },
  { line: 35, text: "    msr psp, r0", comment: "Update PSP" },
  { line: 36, text: "    isb", comment: "" },
  { line: 37, text: "    bx r14", comment: "Exception Return" }
];

// Mapping steps to code lines based on the new ASM_CODE
export const STEP_TO_LINE: Record<number, number> = {
  0: 2,  // Start
  1: 3,  // mrs r0, psp
  2: 8,  // ldr r2, [r3] (Get TCB)
  3: 11, // stmdb r0!, {r4-r11} (Save SW)
  4: 12, // str r0, [r2] (Save SP)
  5: 14, // stmdb sp!, {r3, r14} (Save MSP context)
  6: 18, // msr basepri, r0 (Disable Int)
  7: 22, // bl vTaskSwitchContext (C Call)
  8: 26, // msr basepri, r0 (Enable Int)
  9: 28, // ldmia sp!, {r3, r14} (Restore MSP context)
  10: 31, // ldr r0, [r1] (Get New SP)
  11: 33, // ldmia r0!, {r4-r11} (Restore SW)
  12: 35, // msr psp, r0 (Update PSP)
  13: 37  // bx r14 (Exit)
};