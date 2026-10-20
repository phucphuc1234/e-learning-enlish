import React from "react";

const Card = ({
  children,
  title,
  subtitle,
  action,
  footer,
  hover = false,
  padding = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200/80 shadow-sm transition-all duration-200 ${
        hover
          ? "hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
    >
      {(title || subtitle || action) && (
        <div
          className={`flex items-center justify-between border-b border-gray-100 px-6 py-4 ${headerClassName}`}
        >
          <div>
            {title && (
              <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}

      <div className={`${padding ? "p-6" : ""} ${bodyClassName}`}>
        {children}
      </div>

      {footer && (
        <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-3 rounded-b-xl">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;
