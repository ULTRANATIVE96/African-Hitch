import type { ApiUser } from "@/lib/api-hooks";

export function UserAvatar({
  user,
  className = "h-10 w-10 text-2xl flex items-center justify-center rounded-full bg-secondary overflow-hidden object-cover select-none",
}: {
  user: Pick<ApiUser, "avatar" | "profilePhoto" | "name">;
  className?: string;
}) {
  if (user.profilePhoto) {
    return <img src={user.profilePhoto} className={`${className} object-cover`} alt={user.name} />;
  }
  return <span className={className}>{user.avatar ?? "🧑"}</span>;
}
