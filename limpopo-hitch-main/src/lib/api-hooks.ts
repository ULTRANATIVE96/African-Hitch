/**
 * api-hooks.ts
 * React Query hooks that call the Spring Boot REST API.
 * Replaces all direct Zustand state reads/writes.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, getStoredToken } from "./api-client";

// ─── Types (mirror the backend entities) ─────────────────────────────────────
export type Role = "hiker" | "driver";
export type RequestStatus =
  "pending" | "accepted" | "rejected" | "ride_found" | "full_booked" | "completed";
export type AppealStatus = "pending" | "approved" | "rejected";

export interface ApiUser {
  id: string;
  name: string;
  role: Role;
  phone: string;
  avatar: string;
  rating: number;
  completedRides: number;
  email?: string;
  googleEmail?: string;
  linkedUserId?: string;
  vehicle?: string;
  plate?: string;
  vehiclePhoto?: string;
  seats?: number;
  profilePhoto?: string;
  banned: boolean;
}
export interface ApiPost {
  id: string;
  authorId: string;
  role: Role;
  fromLocation: string;
  toLocation: string;
  date: string;
  time: string;
  pricePerSeat: number;
  notes?: string;
  passengers?: number;
  luggage?: string;
  specials?: string;
  specialsFee?: number;
  seats?: number;
  carPhoto?: string;
  open: boolean;
  closedReason?: string;
  createdAt: number;
}
export interface ApiRequest {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  status: RequestStatus;
  pickupPoint?: string;
  createdAt: number;
}
export interface ApiFlag {
  id: string;
  flaggedUserId: string;
  reporterId: string;
  reporterRole: Role;
  reason: string;
  detail: string;
  createdAt: number;
}
export interface ApiPayment {
  id: string;
  postId: string;
  fromUserId: string;
  toUserId: string;
  amount: number;
  route: string;
  status: string;
  createdAt: number;
}
export interface ApiReview {
  id: string;
  driverId: string;
  authorId: string;
  postId?: string | null;
  rating: number;
  comment: string;
  createdAt: number;
  author?: { id: string; name: string; avatar: string };
}
export interface ApiAppeal {
  id: string;
  userId?: string;
  name: string;
  email: string;
  reason: string;
  flagIds?: string;
  status: AppealStatus;
  createdAt: number;
}

// ─── Users ───────────────────────────────────────────────────────────────────
export function useAllUsers() {
  return useQuery<ApiUser[]>({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/users")).data,
    enabled: typeof window !== "undefined",
  });
}

export function useCurrentUser() {
  return useQuery<ApiUser>({
    queryKey: ["users", "me"],
    queryFn: async () => (await api.get("/users/me")).data,
    retry: false,
    staleTime: 30_000,
    // Only run in browser AND only when a token actually exists
    enabled: typeof window !== "undefined" && !!getStoredToken(),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<ApiUser>) => api.patch("/users/me", patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}

// ─── Posts ───────────────────────────────────────────────────────────────────
export function usePostsFeed(role?: Role) {
  return useQuery<ApiPost[]>({
    queryKey: ["posts", "feed", role],
    queryFn: async () => {
      const params = role ? { role } : {};
      return (await api.get("/posts", { params })).data;
    },
    enabled: typeof window !== "undefined",
  });
}

export function usePost(id: string) {
  return useQuery<ApiPost>({
    queryKey: ["posts", id],
    queryFn: async () => (await api.get(`/posts/${id}`)).data,
    enabled: typeof window !== "undefined" && !!id,
  });
}

export function useMyPosts() {
  return useQuery<ApiPost[]>({
    queryKey: ["posts", "mine"],
    queryFn: async () => (await api.get("/posts/mine")).data,
    enabled: typeof window !== "undefined",
  });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => api.post("/posts", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useClosePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.patch(`/posts/${id}/close`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

// ─── Requests ────────────────────────────────────────────────────────────────
export function useMyRequests() {
  return useQuery<ApiRequest[]>({
    queryKey: ["requests"],
    queryFn: async () => (await api.get("/requests")).data,
    enabled: typeof window !== "undefined",
  });
}

export function useSendRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.post("/requests", { postId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

export function useUpdateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      pickupPoint,
    }: {
      id: string;
      status: string;
      pickupPoint?: string;
    }) => api.patch(`/requests/${id}`, { status, pickupPoint }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["requests"] }),
  });
}

// ─── Flags ───────────────────────────────────────────────────────────────────
export function useFlags() {
  return useQuery<ApiFlag[]>({
    queryKey: ["flags"],
    queryFn: async () => (await api.get("/flags")).data,
    enabled: typeof window !== "undefined",
  });
}

export function useAddFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      flaggedUserId: string;
      reporterRole: string;
      reason: string;
      detail: string;
    }) => api.post("/flags", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["flags"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ─── Payments ────────────────────────────────────────────────────────────────
export function useMyPayments() {
  return useQuery<ApiPayment[]>({
    queryKey: ["payments"],
    queryFn: async () => (await api.get("/payments")).data,
    enabled: typeof window !== "undefined",
  });
}

export function useAddPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { postId: string; toUserId: string; amount: number; route: string }) =>
      api.post("/payments", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payments"] }),
  });
}

// ─── Reviews ─────────────────────────────────────────────────────────────────
export function useDriverReviews(driverId: string) {
  return useQuery<ApiReview[]>({
    queryKey: ["reviews", driverId],
    queryFn: async () => (await api.get("/reviews", { params: { driverId } })).data,
    enabled: typeof window !== "undefined" && !!driverId,
  });
}

export function useUserReviews(userId: string) {
  return useQuery<ApiReview[]>({
    queryKey: ["reviews", "user", userId],
    queryFn: async () => (await api.get(`/reviews/user/${userId}`)).data,
    enabled: typeof window !== "undefined" && !!userId,
  });
}

export function useAddReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { driverId: string; rating: number; comment: string; postId?: string }) =>
      api.post("/reviews", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      qc.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

// ─── Appeals ─────────────────────────────────────────────────────────────────
export function useSubmitAppeal() {
  return useMutation({
    mutationFn: (body: {
      userId?: string;
      name: string;
      email: string;
      reason: string;
      flagIds: string[];
    }) => api.post("/appeals", { ...body, flagIds: body.flagIds.join(",") }),
  });
}

// ─── Delete Post ─────────────────────────────────────────────────────────────
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/posts/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

// ─── User by ID ──────────────────────────────────────────────────────────────
export function useUserById(id: string) {
  return useQuery<ApiUser>({
    queryKey: ["users", id],
    queryFn: async () => (await api.get(`/users/${id}`)).data,
    enabled: typeof window !== "undefined" && !!id,
  });
}

// ─── Comments ─────────────────────────────────────────────────────────────────
export interface ApiComment {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  parentId?: string | null;
  createdAt: number;
  author?: { id: string; name: string; avatar: string };
  replies?: ApiComment[];
}

export function useAddComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, text, parentId }: { postId: string; text: string; parentId?: string }) =>
      api.post(`/posts/${postId}/comments`, { text, parentId }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["posts", vars.postId] }),
  });
}

export function useReplyToComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, commentId, text }: { postId: string; commentId: string; text: string }) =>
      api.post(`/posts/${postId}/comments/${commentId}/replies`, { text }),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["posts", vars.postId] }),
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, postId }: { commentId: string; postId: string }) =>
      api.delete(`/posts/comments/${commentId}`),
    onSuccess: (_data, vars) => qc.invalidateQueries({ queryKey: ["posts", vars.postId] }),
  });
}
