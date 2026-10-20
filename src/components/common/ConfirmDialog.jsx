import React from "react";
import Modal from "./Modal";
import Button from "./Button";
import { HiExclamationTriangle, HiInformationCircle } from "react-icons/hi2";

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Xác nhận hành động",
  message = "Bạn có chắc chắn muốn thực hiện hành động này không? Thao tác này không thể hoàn tác.",
  confirmText = "Xác nhận",
  cancelText = "Hủy bỏ",
  variant = "danger",
  loading = false,
}) => {
  const isDanger = variant === "danger";

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center ${
            isDanger ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"
          }`}
        >
          {isDanger ? (
            <HiExclamationTriangle className="w-6 h-6" />
          ) : (
            <HiInformationCircle className="w-6 h-6" />
          )}
        </div>
        <div>
          <h4 className="text-base font-semibold text-gray-900">{title}</h4>
          <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          size="sm"
        >
          {cancelText}
        </Button>
        <Button
          variant={isDanger ? "danger" : "primary"}
          onClick={onConfirm}
          loading={loading}
          size="sm"
        >
          {confirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
