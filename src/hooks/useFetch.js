import { useState, useEffect, useCallback } from "react";

export const useFetch = (
  fetchFunction,
  dependencies = [],
  immediate = true,
) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetchFunction(...args);
        // Backend response standard { success, data, ... } or direct data
        const result = response?.data !== undefined ? response.data : response;
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "Lỗi khi tải dữ liệu");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction],
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, dependencies);

  return {
    data,
    loading,
    error,
    setData,
    refetch: execute,
  };
};

export default useFetch;
