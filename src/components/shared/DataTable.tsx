"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { EmptyState } from "./States";

export interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
  /** Show in the mobile card title area instead of as a labelled row. */
  primary?: boolean;
}

/** Sortable, searchable, paginated table that becomes cards on small screens. */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  searchText,
  searchPlaceholder = "Search",
  pageSize = 10,
  onRowClick,
  rowHref,
  empty,
  toolbar,
  initialSort,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchText?: (row: T) => string;
  searchPlaceholder?: string;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  rowHref?: (row: T) => string;
  empty?: { title: string; description?: string };
  toolbar?: React.ReactNode;
  initialSort?: { key: string; dir: "asc" | "desc" };
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState(initialSort ?? null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q && searchText ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        const sv = col.sortValue;
        list = [...list].sort((a, b) => {
          const x = sv(a);
          const y = sv(b);
          const cmp = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y));
          return sort.dir === "asc" ? cmp : -cmp;
        });
      }
    }
    return list;
  }, [rows, query, sort, columns, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === "asc" ? { key, dir: "desc" } : null) : { key, dir: "asc" }));

  const go = (row: T) => {
    if (onRowClick) onRowClick(row);
    else if (rowHref) router.push(rowHref(row));
  };
  const clickable = Boolean(onRowClick || rowHref);

  return (
    <div className="space-y-3">
      {(searchText || toolbar) && (
        <div className="flex flex-wrap items-center gap-2">
          {searchText && (
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
                placeholder={searchPlaceholder}
                aria-label={searchPlaceholder}
                className="pl-9"
              />
            </div>
          )}
          {toolbar}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState title={empty?.title ?? "Nothing here yet"} description={query ? "No results match your search. Try different words." : empty?.description} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-line bg-paper md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-left text-muted-foreground">
                <tr>
                  {columns.map((c) => (
                    <th key={c.key} scope="col" className={cn("px-4 py-2.5 font-medium", c.className)} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                      {c.sortValue ? (
                        <button type="button" className="inline-flex items-center gap-1 hover:text-ink" onClick={() => toggleSort(c.key)}>
                          {c.header}
                          {sort?.key === c.key ? sort.dir === "asc" ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" /> : <ArrowUpDown className="size-3.5 opacity-50" />}
                        </button>
                      ) : (
                        c.header
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr
                    key={rowKey(row)}
                    className={cn("border-t border-line", clickable && "cursor-pointer hover:bg-muted/50")}
                    onClick={clickable ? () => go(row) : undefined}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn("px-4 py-3 align-middle", c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="space-y-3 md:hidden">
            {visible.map((row) => {
              const primary = columns.filter((c) => c.primary);
              const rest = columns.filter((c) => !c.primary);
              return (
                <li key={rowKey(row)}>
                  <div
                    role={clickable ? "button" : undefined}
                    tabIndex={clickable ? 0 : undefined}
                    onClick={clickable ? () => go(row) : undefined}
                    onKeyDown={clickable ? (e) => (e.key === "Enter" || e.key === " ") && go(row) : undefined}
                    className={cn("rounded-xl border border-line bg-paper p-4", clickable && "cursor-pointer hover:bg-muted/40")}
                  >
                    {primary.length > 0 && <div className="mb-2 flex flex-wrap items-center gap-2 font-medium">{primary.map((c) => <span key={c.key}>{c.cell(row)}</span>)}</div>}
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      {rest.map((c) => (
                        <div key={c.key} className="contents">
                          <dt className="text-muted-foreground">{c.header}</dt>
                          <dd className="min-w-0 text-right">{c.cell(row)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </li>
              );
            })}
          </ul>

          {pages > 1 && (
            <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
              <span className="text-muted-foreground">
                Page {current + 1} of {pages} · {filtered.length} items
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Previous page">
                  <ChevronLeft className="size-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} aria-label="Next page">
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

/** Row of filters above a list. */
export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-end gap-3", className)}>{children}</div>;
}
