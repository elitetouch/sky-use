"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Props = {
  currentPage: number;
  lastPage: number;
  perPage: number;
  total: number;
};

const PER_PAGE_OPTIONS = [15, 25, 50, 100];

/** Build a compact page list with ellipses, e.g. 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, last: number): (number | "…")[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set<number>([1, last, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const page of sorted) {
    if (prev && page - prev > 1) result.push("…");
    result.push(page);
    prev = page;
  }
  return result;
}

export function Pagination({ currentPage, lastPage, perPage, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (total === 0) return null;

  const from = (currentPage - 1) * perPage + 1;
  const to = Math.min(currentPage * perPage, total);

  function push(params: URLSearchParams) {
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page <= 1) params.delete("page");
    else params.set("page", String(page));
    push(params);
  }

  function changePerPage(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("per_page", value);
    params.delete("page"); // back to the first page with the new size
    push(params);
  }

  const options = PER_PAGE_OPTIONS.includes(perPage)
    ? PER_PAGE_OPTIONS
    : [...PER_PAGE_OPTIONS, perPage].sort((a, b) => a - b);

  const baseBtn =
    "inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-40";

  return (
    <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-body">
        <p>
          Showing <span className="font-semibold text-navy">{from}</span>–
          <span className="font-semibold text-navy">{to}</span> of{" "}
          <span className="font-semibold text-navy">{total}</span>
        </p>
        <label className="flex items-center gap-2">
          Rows per page
          <select
            value={perPage}
            onChange={(e) => changePerPage(e.target.value)}
            className="cursor-pointer rounded-lg border border-black/10 px-2 py-1 text-sm text-navy outline-none focus:border-navy"
          >
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      {lastPage > 1 ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`${baseBtn} border border-black/10 text-navy hover:bg-navy/5`}
          >
            Prev
          </button>

          {pageList(currentPage, lastPage).map((page, index) =>
            page === "…" ? (
              <span key={`gap-${index}`} className="px-2 text-sm text-body">
                …
              </span>
            ) : (
              <button
                key={page}
                type="button"
                onClick={() => goTo(page)}
                aria-current={page === currentPage ? "page" : undefined}
                className={`${baseBtn} ${
                  page === currentPage
                    ? "bg-navy text-white"
                    : "border border-black/10 text-navy hover:bg-navy/5"
                }`}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            onClick={() => goTo(currentPage + 1)}
            disabled={currentPage >= lastPage}
            className={`${baseBtn} border border-black/10 text-navy hover:bg-navy/5`}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
