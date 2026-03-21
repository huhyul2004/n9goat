// ============================================================
// LOCAL MOCK MODE — Supabase 없이 로컬에서 작동
// 실제 배포 시 원래 supabase.ts 로 복원 필요
// ============================================================

/* eslint-disable @typescript-eslint/no-explicit-any */

// 로컬 스토리지 기반 mock DB
function getTable(table: string): any[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(`n9_mock_${table}`);
  return raw ? JSON.parse(raw) : [];
}

function setTable(table: string, data: any[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(`n9_mock_${table}`, JSON.stringify(data));
}

function uuid() {
  return crypto.randomUUID();
}

// Chainable query builder that mimics Supabase's API
class MockQueryBuilder {
  private _table: string;
  private _filters: Array<(row: any) => boolean> = [];
  private _orderCol: string | null = null;
  private _orderAsc = true;
  private _limitN: number | null = null;
  private _singleMode = false;
  private _countMode = false;
  private _headMode = false;
  private _selectFields: string | null = null;
  private _pendingUpdates: any = null;

  constructor(table: string) {
    this._table = table;
  }

  select(fields?: string, opts?: { count?: string; head?: boolean }) {
    this._selectFields = fields || "*";
    if (opts?.count) this._countMode = true;
    if (opts?.head) this._headMode = true;
    return this;
  }

  eq(col: string, val: any) {
    this._filters.push((row) => row[col] === val);
    return this;
  }

  neq(col: string, val: any) {
    this._filters.push((row) => row[col] !== val);
    return this;
  }

  in(col: string, vals: any[]) {
    this._filters.push((row) => vals.includes(row[col]));
    return this;
  }

  gte(col: string, val: any) {
    this._filters.push((row) => row[col] >= val);
    return this;
  }

  lte(col: string, val: any) {
    this._filters.push((row) => row[col] <= val);
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this._orderCol = col;
    this._orderAsc = opts?.ascending ?? true;
    return this;
  }

  limit(n: number) {
    this._limitN = n;
    return this;
  }

  single() {
    this._singleMode = true;
    return this;
  }

  // insert
  insert(row: any | any[]) {
    const rows = Array.isArray(row) ? row : [row];
    const table = getTable(this._table);
    for (const r of rows) {
      table.push({ id: uuid(), created_at: new Date().toISOString(), ...r });
    }
    setTable(this._table, table);
    return Promise.resolve({ data: rows, error: null });
  }

  // update — supports .update(data).eq() chaining like supabase
  update(updates: any) {
    this._pendingUpdates = updates;
    return this;
  }

  private _executeUpdate() {
    if (!this._pendingUpdates) return { data: 0, error: null };
    const table = getTable(this._table);
    let changed = 0;
    const result = table.map((row) => {
      if (this._filters.every((f) => f(row))) {
        changed++;
        return { ...row, ...this._pendingUpdates };
      }
      return row;
    });
    setTable(this._table, result);
    return { data: changed, error: null };
  }

  // delete
  delete() {
    // Return this so .eq() can be chained after .delete()
    const self = this;
    const originalEq = self.eq.bind(self);
    self.eq = (col: string, val: any) => {
      self._filters.push((row) => row[col] === val);
      // Execute the delete
      const table = getTable(self._table);
      const result = table.filter((row) => !self._filters.every((f) => f(row)));
      setTable(self._table, result);
      return Promise.resolve({ data: null, error: null }) as any;
    };
    return self;
  }

  // Execute (called via await / .then)
  then(resolve: (val: any) => void, reject?: (err: any) => void) {
    try {
      // Handle pending update
      if (this._pendingUpdates) {
        const result = this._executeUpdate();
        return resolve(result);
      }

      let rows = getTable(this._table);

      // Apply filters
      rows = rows.filter((row) => this._filters.every((f) => f(row)));

      // Apply ordering
      if (this._orderCol) {
        const col = this._orderCol;
        const asc = this._orderAsc;
        rows.sort((a, b) => {
          if (a[col] < b[col]) return asc ? -1 : 1;
          if (a[col] > b[col]) return asc ? 1 : -1;
          return 0;
        });
      }

      // Apply limit
      if (this._limitN) rows = rows.slice(0, this._limitN);

      // Count mode
      if (this._countMode) {
        return resolve({ count: rows.length, data: this._headMode ? null : rows, error: null });
      }

      // Single mode
      if (this._singleMode) {
        return resolve({ data: rows[0] || null, error: rows[0] ? null : { message: "not found" } });
      }

      // Select specific fields
      if (this._selectFields && this._selectFields !== "*") {
        const fields = this._selectFields.split(",").map((f) => f.trim());
        rows = rows.map((row) => {
          const picked: any = {};
          fields.forEach((f) => (picked[f] = row[f]));
          return picked;
        });
      }

      return resolve({ data: rows, error: null });
    } catch (e) {
      if (reject) return reject(e);
      return resolve({ data: null, error: e });
    }
  }
}

// Mock auth
const mockAuth = {
  onAuthStateChange: (_callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
  getSession: () => Promise.resolve({ data: { session: null } }),
  signInWithPassword: () => Promise.resolve({ error: null }),
  signUp: () => Promise.resolve({ data: { user: { id: uuid() } }, error: null }),
  signOut: () => Promise.resolve(),
};

// Mock Supabase client
export const supabase = {
  auth: mockAuth,
  from: (table: string) => new MockQueryBuilder(table),
} as any;

// Keep getSupabase for backward compatibility
export function getSupabase() {
  return supabase;
}
