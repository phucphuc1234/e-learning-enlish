import React from 'react';
import { HiOutlineFolderOpen } from 'react-icons/hi2';

const EmptyState = ({
  title = 'Không có dữ liệu',
  message = 'Chưa có thông tin nào được hiển thị tại đây.',
  icon: Icon = HiOutlineFolderOpen,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-blue-500 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">{message}</p>
      {action && <div className="flex justify-center">{action}</div>}
    </div>
  );
};

export default EmptyState;
