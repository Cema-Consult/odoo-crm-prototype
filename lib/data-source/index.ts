import type { DataSource } from "./types";
import { makeMockDataSource } from "./mock";
import { makeOdooDataSource } from "./odoo";

let _cached: DataSource | null = null;

export function getDataSource(): DataSource {
  if (_cached) return _cached;
  const which = process.env.DATA_SOURCE ?? "mock";
  _cached = which === "odoo" ? makeOdooDataSource() : makeMockDataSource();
  return _cached;
}

export type { DataSource } from "./types";
