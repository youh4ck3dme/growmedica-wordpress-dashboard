/** Chyba AI vrstvy, ktorá nesie HTTP status pre route handlery. */
export class AiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AiError'
    this.status = status
  }
}
