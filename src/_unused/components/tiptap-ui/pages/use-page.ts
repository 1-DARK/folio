import { useEffect, useState } from "react";
import { pageService, type Page } from "src/_unused/services/page-service";

export function usePage(id: string | undefined) {
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // setLoading(true)
    //setError(null)

    pageService
      .get(id)
      .then(setPage)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  return { page, loading, error, setPage };
}
