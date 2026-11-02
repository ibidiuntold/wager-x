import { useState, useEffect, useCallback } from "react";

type Pagination = {
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
};

type FetchResponse<T> = {
  data: T[];
  pagination?: Pagination;
  error?: string;
};

// Generic fetcher
async function fetchData<T>(
  url: string,
  method: string = "GET",
  body?: any
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json();
  } catch (err: any) {
    console.error(`❌ ${method} ${url}:`, err);
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* 🧠 SYSTEM SETTINGS */
/* -------------------------------------------------------------------------- */
export function useSystemSettings(page: number = 1, limit: number = 10) {
  const [settings, setSettings] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    const res = await fetchData<FetchResponse<any>>(
      `/api/system-settings?page=${page}&limit=${limit}`
    );
    if (res?.data) {
      setSettings(res.data);
      setPagination(res.pagination || null);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const createSetting = useCallback(
    async (data: any) => await fetchData(`/api/system-settings`, "POST", data),
    []
  );

  const updateSetting = useCallback(
    async (id: string, data: any) =>
      await fetchData(`/api/system-settings/${id}`, "PUT", data),
    []
  );

  const deleteSetting = useCallback(
    async (id: string) =>
      await fetchData(`/api/system-settings/${id}`, "DELETE"),
    []
  );

  return { settings, pagination, loading, fetchSettings, createSetting, updateSetting, deleteSetting };
}

/* -------------------------------------------------------------------------- */
/* 💬 SOCIAL LINKS */
/* -------------------------------------------------------------------------- */
export function useSocialLinks(page: number = 1, limit: number = 10) {
  const [links, setLinks] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    const res = await fetchData<FetchResponse<any>>(
      `/api/social-links?page=${page}&limit=${limit}`
    );
    if (res?.data) {
      setLinks(res.data);
      setPagination(res.pagination || null);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const createLink = useCallback(
    async (data: any) => await fetchData(`/api/social-links`, "POST", data),
    []
  );

  const updateLink = useCallback(
    async (id: string, data: any) =>
      await fetchData(`/api/social-links/${id}`, "PUT", data),
    []
  );

  const deleteLink = useCallback(
    async (id: string) => await fetchData(`/api/social-links/${id}`, "DELETE"),
    []
  );

  return { links, pagination, loading, fetchLinks, createLink, updateLink, deleteLink };
}

/* -------------------------------------------------------------------------- */
/* 💸 PAYMENT GATEWAYS */
/* -------------------------------------------------------------------------- */
export function usePaymentGateways(page: number = 1, limit: number = 10) {
  const [gateways, setGateways] = useState<any[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchGateways = useCallback(async () => {
    setLoading(true);
    const res = await fetchData<FetchResponse<any>>(
      `/api/payment-gateways?page=${page}&limit=${limit}`
    );
    if (res?.data) {
      setGateways(res.data);
      setPagination(res.pagination || null);
    }
    setLoading(false);
  }, [page, limit]);

  useEffect(() => {
    fetchGateways();
  }, [fetchGateways]);

  const createGateway = useCallback(
    async (data: any) =>
      await fetchData(`/api/payment-gateways`, "POST", data),
    []
  );

  const updateGateway = useCallback(
    async (id: string, data: any) =>
      await fetchData(`/api/payment-gateways/${id}`, "PUT", data),
    []
  );

  const deleteGateway = useCallback(
    async (id: string) =>
      await fetchData(`/api/payment-gateways/${id}`, "DELETE"),
    []
  );

  return { gateways, pagination, loading, fetchGateways, createGateway, updateGateway, deleteGateway };
}

/* -------------------------------------------------------------------------- */
/* ✉️ SMTP SETTINGS */
/* -------------------------------------------------------------------------- */
export function useSMTPSettings() {
  const [smtpSettings, setSmtpSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSMTP = useCallback(async () => {
    setLoading(true);
    const res = await fetchData<any[]>(`/api/smtp`);
    if (res) setSmtpSettings(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSMTP();
  }, [fetchSMTP]);

  const createSMTP = useCallback(
    async (data: any) => await fetchData(`/api/smtp`, "POST", data),
    []
  );

  const updateSMTP = useCallback(
    async (id: string, data: any) =>
      await fetchData(`/api/smtp/${id}`, "PUT", data),
    []
  );

  const deleteSMTP = useCallback(
    async (id: string) => await fetchData(`/api/smtp/${id}`, "DELETE"),
    []
  );

  return { smtpSettings, loading, fetchSMTP, createSMTP, updateSMTP, deleteSMTP };
}

/* -------------------------------------------------------------------------- */
/* 🌐 SEO SETTINGS */
/* -------------------------------------------------------------------------- */
export function useSEOSettings() {
  const [seoSettings, setSeoSettings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSEO = useCallback(async () => {
    setLoading(true);
    const res = await fetchData<any[]>(`/api/seo`);
    if (res) setSeoSettings(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSEO();
  }, [fetchSEO]);

  const createSEO = useCallback(
    async (data: any) => await fetchData(`/api/seo`, "POST", data),
    []
  );

  const updateSEO = useCallback(
    async (id: string, data: any) =>
      await fetchData(`/api/seo/${id}`, "PUT", data),
    []
  );

  const deleteSEO = useCallback(
    async (id: string) => await fetchData(`/api/seo/${id}`, "DELETE"),
    []
  );

  return { seoSettings, loading, fetchSEO, createSEO, updateSEO, deleteSEO };
}
