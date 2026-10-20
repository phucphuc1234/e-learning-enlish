export const getInitials = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((v) => v[0])
    .join("")
    .toUpperCase() || "U";
export const slugify = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    Number(value) || 0,
  );
export const formatDate = (value) =>
  value && !Number.isNaN(Date.parse(value))
    ? new Date(value).toLocaleDateString("vi-VN")
    : "—";
export const formatDuration = (value) => {
  const n = Math.max(0, Number(value) || 0);
  return n >= 60
    ? `${Math.floor(n / 60)} giờ ${n % 60 ? `${n % 60} phút` : ""}`.trim()
    : `${n} phút`;
};
export const formatSeconds = (value) => {
  const n = Math.max(0, Math.floor(Number(value) || 0));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
};
