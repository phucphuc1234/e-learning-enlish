import React from "react";

const Loading = ({
  text = "Đang tải...",
  fullScreen = false,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-9 h-9 border-3",
    lg: "w-14 h-14 border-4",
  };

  const content = (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <div
        className={`${sizeClasses[size] || sizeClasses.md} rounded-full border-blue-600 border-t-transparent animate-spin`}
      />
      {text && (
        <p className="text-sm font-medium text-gray-500 animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return <div className="py-8 flex justify-center items-center">{content}</div>;
};

export default Loading;
