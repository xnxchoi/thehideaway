export class HandleError extends Error {
  public data?: { alts?: string[] };
  constructor(message: string, data?: { alts?: string[] }) {
    super(message);
    this.name = "HandleError";
    this.data = data;
    Object.setPrototypeOf(this, HandleError.prototype);
  }
}
