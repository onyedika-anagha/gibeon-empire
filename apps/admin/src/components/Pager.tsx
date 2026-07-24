"use client";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

/** Client-side pager over an already-loaded list. Renders nothing for one page. */
export default function Pager({
  page,
  pageCount,
  onPage,
}: {
  page: number;
  pageCount: number;
  onPage: (page: number) => void;
}) {
  if (pageCount <= 1) return null;

  const go = (to: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    onPage(Math.min(pageCount, Math.max(1, to)));
  };

  return (
    <Pagination className="mt-6">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="#" onClick={go(page - 1)} aria-disabled={page === 1} />
        </PaginationItem>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
          <PaginationItem key={n}>
            <PaginationLink href="#" isActive={n === page} onClick={go(n)}>
              {n}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="#" onClick={go(page + 1)} aria-disabled={page === pageCount} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
