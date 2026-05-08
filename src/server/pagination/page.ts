export type PageResponse<T> = {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  first: boolean;
  numberOfElements: number;
  empty: boolean;
};

export function pageBounds(page: number, size: number) {
  const safePage = Number.isFinite(page) && page >= 0 ? Math.floor(page) : 0;
  const safeSize = Number.isFinite(size) && size > 0 ? Math.min(Math.floor(size), 100) : 20;
  const from = safePage * safeSize;
  const to = from + safeSize - 1;

  return {
    page: safePage,
    size: safeSize,
    from,
    to,
  };
}

export function toPageResponse<T>(
  content: T[],
  totalElements: number,
  page: number,
  size: number,
): PageResponse<T> {
  const totalPages = size > 0 ? Math.ceil(totalElements / size) : 0;

  return {
    content,
    pageable: {
      pageNumber: page,
      pageSize: size,
      offset: page * size,
      paged: true,
      unpaged: false,
    },
    totalElements,
    totalPages,
    last: totalPages === 0 || page >= totalPages - 1,
    size,
    number: page,
    first: page === 0,
    numberOfElements: content.length,
    empty: content.length === 0,
  };
}
