/**
 * Names this run before any worker starts. Workers inherit the variable, so a
 * worker restarted after a failed test writes to the same run record and reads
 * the same generation count. Nothing here touches the network.
 */
export default function globalSetup(): void {
  process.env.STOA_SMOKE_RUN_ID ??= new Date().toISOString().replace(/[:.]/g, '-')
}
