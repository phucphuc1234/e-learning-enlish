import React from "react";

const Badge = ({
  children,
  variant = "primary",
  size = "md",
  dot = false,
  className = "",
}) => {
  const variants = {
    primary: "bg-blue-50 text-blue-700 border-blue-200/80",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
    warning: "bg-amber-50 text-amber-700 border-amber-200/80",
    danger: "bg-rose-50 text-rose-700 border-rose-200/80",
    info: "bg-sky-50 text-sky-700 border-sky-200/80",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200/80",
  };

  const dotColors = {
    primary: "bg-blue-500",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-sky-500",
    gray: "bg-gray-500",
    purple: "bg-purple-500",
  };

  const sizes = {
    sm: "text-[11px] px-2 py-0.5",
    md: "text-xs px-2.5 py-1",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.primary}`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};

export default Badge;
