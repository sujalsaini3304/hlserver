const EPOCH = 1700000000000n; // Nov 2023 — your custom start point

class Snowflake {
  constructor(machineId = 1n) {
    this.machineId = BigInt(machineId) & 1023n; // 10 bits → max 1023
    this.sequence  = 0n;
    this.lastMs    = -1n;
  }

  generate() {
    let now = BigInt(Date.now()) - EPOCH;

    if (now === this.lastMs) {
      this.sequence = (this.sequence + 1n) & 4095n; // 12 bits → max 4095
      if (this.sequence === 0n) {
        // Sequence exhausted — wait for next millisecond
        while (now <= this.lastMs) {
          now = BigInt(Date.now()) - EPOCH;
        }
      }
    } else {
      this.sequence = 0n;
    }

    this.lastMs = now;

    // Pack all three parts into one 64-bit integer
    return (now << 22n) | (this.machineId << 12n) | this.sequence;
  }
}

export const snowflake = new Snowflake(process.env.MACHINE_ID || 1n);

