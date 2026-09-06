export class IntegrationNotConfiguredError extends Error {
  constructor(service: string) {
    super(`${service} is not configured. Set the required environment variables.`);
    this.name = "IntegrationNotConfiguredError";
  }
}
