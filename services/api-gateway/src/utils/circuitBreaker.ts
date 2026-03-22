type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

interface CircuitConfig {
  failureThreshold: number;
  resetTimeoutMs: number;
}

interface ServiceCircuit {
  state: CircuitState;
  consecutiveFailures: number;
  openedAt: number | null;
}

export class CircuitBreakerManager {
  private readonly circuits = new Map<string, ServiceCircuit>();

  constructor(private readonly config: CircuitConfig) {}

  private getOrCreate(serviceName: string): ServiceCircuit {
    const existing = this.circuits.get(serviceName);
    if (existing) return existing;

    const initial: ServiceCircuit = {
      state: "CLOSED",
      consecutiveFailures: 0,
      openedAt: null,
    };
    this.circuits.set(serviceName, initial);
    return initial;
  }

  canRequest(serviceName: string): boolean {
    const circuit = this.getOrCreate(serviceName);

    if (circuit.state === "CLOSED") {
      return true;
    }

    if (circuit.state === "OPEN" && circuit.openedAt) {
      const elapsed = Date.now() - circuit.openedAt;
      if (elapsed >= this.config.resetTimeoutMs) {
        circuit.state = "HALF_OPEN";
        return true;
      }
    }

    return circuit.state === "HALF_OPEN";
  }

  recordSuccess(serviceName: string): void {
    const circuit = this.getOrCreate(serviceName);
    circuit.state = "CLOSED";
    circuit.consecutiveFailures = 0;
    circuit.openedAt = null;
  }

  recordFailure(serviceName: string): void {
    const circuit = this.getOrCreate(serviceName);
    circuit.consecutiveFailures += 1;

    if (circuit.consecutiveFailures >= this.config.failureThreshold) {
      circuit.state = "OPEN";
      circuit.openedAt = Date.now();
    }
  }

  snapshot(): Record<string, ServiceCircuit> {
    const entries = Array.from(this.circuits.entries()).map(([name, circuit]) => [name, { ...circuit }]);
    return Object.fromEntries(entries);
  }
}
