/**
 * Decimal — numeric wrapper for inventory and token math.
 *
 * Pattern: SFL / Pixels — NEVER use raw `Number` for token balances.
 * JS `Number` cannot represent `0.1 + 0.2` precisely; with on-chain
 * tokens this leads to off-by-one rounding bugs that lose users
 * money or unbalance the economy.
 *
 * Hackathon mode: light wrapper around fixed-decimal math. Swap to
 * decimal.js-light when we install it as a real dep. The interface
 * here is a subset compatible with that lib so migration is mechanical.
 *
 * Usage:
 *   const a = new Decimal('100.5');
 *   const b = new Decimal('0.1').plus('0.2'); // === '0.3', not 0.30000000000000004
 *   a.gte(b); a.minus(b); a.times('2'); a.toString();
 */

const SCALE = 1_000_000_000n; // 9 decimals — matches typical SPL token precision

export class Decimal {
  /** Scaled integer (value * 1e9) — full precision */
  private readonly raw: bigint;

  constructor(value: number | string | bigint | Decimal) {
    if (value instanceof Decimal) {
      this.raw = value.raw;
      return;
    }
    if (typeof value === 'bigint') {
      this.raw = value * SCALE;
      return;
    }
    const str = typeof value === 'number' ? value.toString() : value;
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      throw new Error(`Decimal: invalid numeric string "${str}"`);
    }
    const negative = str.startsWith('-');
    const abs = negative ? str.slice(1) : str;
    const [intPart, fracPart = ''] = abs.split('.');
    const padded = fracPart.padEnd(9, '0').slice(0, 9);
    const combined = BigInt((intPart ?? '0') + padded);
    this.raw = negative ? -combined : combined;
  }

  static zero(): Decimal {
    return new Decimal(0);
  }

  // ── Arithmetic ─────────────────────────────────────────────────────────────

  plus(other: number | string | Decimal): Decimal {
    return Decimal.fromRaw(this.raw + Decimal.coerce(other).raw);
  }

  minus(other: number | string | Decimal): Decimal {
    return Decimal.fromRaw(this.raw - Decimal.coerce(other).raw);
  }

  times(other: number | string | Decimal): Decimal {
    return Decimal.fromRaw((this.raw * Decimal.coerce(other).raw) / SCALE);
  }

  div(other: number | string | Decimal): Decimal {
    const o = Decimal.coerce(other);
    if (o.raw === 0n) throw new Error('Decimal: division by zero');
    return Decimal.fromRaw((this.raw * SCALE) / o.raw);
  }

  // ── Comparison ─────────────────────────────────────────────────────────────

  eq(other: number | string | Decimal): boolean {
    return this.raw === Decimal.coerce(other).raw;
  }
  gt(other: number | string | Decimal): boolean {
    return this.raw > Decimal.coerce(other).raw;
  }
  gte(other: number | string | Decimal): boolean {
    return this.raw >= Decimal.coerce(other).raw;
  }
  lt(other: number | string | Decimal): boolean {
    return this.raw < Decimal.coerce(other).raw;
  }
  lte(other: number | string | Decimal): boolean {
    return this.raw <= Decimal.coerce(other).raw;
  }

  // ── Conversion ─────────────────────────────────────────────────────────────

  toString(): string {
    const negative = this.raw < 0n;
    const abs = negative ? -this.raw : this.raw;
    const intPart = abs / SCALE;
    const fracPart = abs % SCALE;
    const fracStr = fracPart.toString().padStart(9, '0').replace(/0+$/, '');
    const sign = negative ? '-' : '';
    return fracStr ? `${sign}${intPart}.${fracStr}` : `${sign}${intPart}`;
  }

  /** Lossy — only safe when value fits in JS Number (< 2^53). */
  toNumber(): number {
    return Number(this.toString());
  }

  /** Underlying scaled bigint — useful for serializing to chain calls */
  toRaw(): bigint {
    return this.raw;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  private static coerce(v: number | string | Decimal): Decimal {
    return v instanceof Decimal ? v : new Decimal(v);
  }

  private static fromRaw(raw: bigint): Decimal {
    const d = Object.create(Decimal.prototype) as Decimal;
    (d as unknown as { raw: bigint }).raw = raw;
    return d;
  }
}
