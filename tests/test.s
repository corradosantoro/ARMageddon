
        .include "ag_lib.s"
	.global Reset_Handler
	.text

Reset_Handler:
        STR r0, [SP, #4]
        LDR r0, [SP, #4]
        ADD r1, PC, #5*4
        ADD r1, SP, #5*4
        STMIA R0!, {R1,R2,R5} 
        LDMIA R1!, {R1,R2,R4}