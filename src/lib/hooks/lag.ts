import { useCallback } from "react";
import { authedFetch } from "../apiClient";

const base = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export function useLag() {
  const listMaterials = useCallback(
    async (params?: Record<string, any>, auth = false) => {
      const query = params ? `?${new URLSearchParams(params as any)}` : "";
      const url = `${base}/api/lag/materials/${query}`;
      const res = auth ? await authedFetch(url) : await fetch(url);
      if (!res.ok) throw new Error("list materials failed");
      return res.json();
    },
    []
  );

  const createMaterial = useCallback(async (form: FormData) => {
    const res = await authedFetch(`${base}/api/lag/materials/`, {
      method: "POST",
      body: form,
    } as any);
    if (!res.ok) throw new Error("create material failed");
    return res.json();
  }, []);

  const updateMaterial = useCallback(async (id: string, form: FormData) => {
    const res = await authedFetch(`${base}/api/lag/materials/${id}/`, {
      method: "PATCH",
      body: form,
    } as any);
    if (!res.ok) throw new Error("update material failed");
    return res.json();
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    const res = await authedFetch(`${base}/api/lag/materials/${id}/`, {
      method: "DELETE",
    });
    if (!res.ok) throw new Error("delete material failed");
    return true;
  }, []);

  const requestOtp = useCallback(async (email: string) => {
    const res = await fetch(`${base}/api/lag/otp/request/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("otp request failed");
    return res.json();
  }, []);

  const verifyOtp = useCallback(async (email: string, code: string) => {
    const res = await fetch(`${base}/api/lag/otp/verify/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (!res.ok) throw new Error("otp verify failed");
    return res.json();
  }, []);

  const createRequest = useCallback(
    async (
      token: string,
      payload: {
        requester_name: string;
        phone_number: string;
        roll_number: string;
        requested_from: string;
        requested_to: string;
        items: { material_id: string; quantity: number }[];
        notes?: string;
      }
    ) => {
      const res = await fetch(`${base}/api/lag/requests/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LAG-Token": token,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("create request failed");
      return res.json();
    },
    []
  );

  const listMyRequests = useCallback(async (token: string) => {
    const res = await fetch(`${base}/api/lag/requests/my/`, {
      headers: { "X-LAG-Token": token },
    });
    if (!res.ok) throw new Error("list my requests failed");
    return res.json();
  }, []);

  const listPublicLoans = useCallback(async () => {
    const res = await fetch(`${base}/api/lag/public/loans/`);
    if (!res.ok) throw new Error("list public loans failed");
    return res.json();
  }, []);

  const listRequests = useCallback(async (params?: Record<string, any>) => {
    const query = params ? `?${new URLSearchParams(params as any)}` : "";
    const res = await authedFetch(`${base}/api/lag/requests/${query}`);
    if (!res.ok) throw new Error("list requests failed");
    return res.json();
  }, []);

  const approveRequest = useCallback(async (id: string) => {
    const res = await authedFetch(`${base}/api/lag/requests/${id}/approve/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("approve request failed");
    return res.json();
  }, []);

  const rejectRequest = useCallback(async (id: string) => {
    const res = await authedFetch(`${base}/api/lag/requests/${id}/reject/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("reject request failed");
    return res.json();
  }, []);

  const issueRequest = useCallback(async (id: string) => {
    const res = await authedFetch(`${base}/api/lag/requests/${id}/issue/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("issue request failed");
    return res.json();
  }, []);

  const returnRequest = useCallback(async (id: string) => {
    const res = await authedFetch(`${base}/api/lag/requests/${id}/return/`, {
      method: "POST",
    });
    if (!res.ok) throw new Error("return request failed");
    return res.json();
  }, []);

  return {
    listMaterials,
    createMaterial,
    updateMaterial,
    deleteMaterial,
    requestOtp,
    verifyOtp,
    createRequest,
    listMyRequests,
    listPublicLoans,
    listRequests,
    approveRequest,
    rejectRequest,
    issueRequest,
    returnRequest,
  };
}
