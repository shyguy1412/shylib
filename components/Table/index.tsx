import { ComponentChildren, h } from "preact";
import { useCallback, useMemo, useState } from "preact/hooks";
import { memo } from "preact/compat";

export namespace Table {
  export type Props = {
    data: ComponentChildren[][];
    head?: ComponentChildren[];
  } & h.JSX.TableHTMLAttributes;
}

export type Filter<T extends Table.Props["data"]> = {
  keywords?: string[];
  column?: {
    [key: number]: string | ((cell: T[number][number]) => boolean);
  };
};

export type FilterOptions = {
  caseSensitive?: boolean;
};

export function useFilter<T extends Table.Props["data"]>(data: T, { keywords, column }: Filter<T>, options?: FilterOptions) {

  if (!(keywords && keywords.length) && !(column && Object.keys(column))) {
    return data;
  }

  const compareStrings = (a: unknown, b: string) => {
    if (options?.caseSensitive) {
      return a?.toString().includes(b);
    }
    return a?.toString().toLocaleLowerCase().includes(b.toLocaleLowerCase());
  };

  //this is utterly messy but basically:
  //first the rows are filter by wether they contain a keyword
  //then they are filter based on a keyword or predicate per column
  return data.filter((row) => (
    keywords ?
      keywords.some(keyword => row.some(col => col == keyword || compareStrings(col, keyword)))
      : true
  ) && (
      Object.keys(column ?? {}).length ?
        Object.entries(column!).map(([col, search]) => {
          if (typeof search == "string")
            return row[+col] == search || row[+col]?.toString().includes(search);
          else return search?.(row[+col]);
        }).every(_ => _)
        : true)
  );
  // ), [data, ...keywords ?? [], column]);
}

export function usePagination<T extends Table.Props["data"]>(data: T, pageSize: number, initialPage = 0) {
  const [page, setPage] = useState(initialPage);

  const maxPage = useMemo(() => Math.max(Math.ceil(data.length / pageSize) - 1, 0), [data.length]);
  const minmaxPage = useCallback((page: number) => Math.min(Math.max(page, 0), maxPage), [maxPage]);

  setPage(minmaxPage(page));

  const paginatedData = useMemo(() =>
    data.slice(page * pageSize, Math.min(page * pageSize + pageSize, data.length)),
    //This type assertion isnt exactly save if you consider tuple types
    //but in the context of what this function is used for it should be
    //perfectly fine
    [page, data, pageSize]);


  return {
    page,
    maxPage,
    setPage: (page: number) => setPage(minmaxPage(page)),
    nextPage: () => setPage(page => minmaxPage(page + 1)),
    previousPage: () => setPage(page => minmaxPage(page - 1)),
    paginatedData
  };
}

export const Table = memo(({
  head,
  data,
  ...props
}: Table.Props) => {

  const thead = head?.map(col => <th scope={"col"}>{col}</th>);

  const tbody = data.map(row => <tr>{row.map(col => <td>{col}</td>)}</tr>);

  return <table {...props}>

    {thead && <thead>
      <tr>
        {thead}
      </tr>
    </thead>}

    <tbody>
      {tbody}
    </tbody>

  </table>;
});