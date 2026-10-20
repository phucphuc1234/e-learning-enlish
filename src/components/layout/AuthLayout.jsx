import React from "react";
import { Outlet, Link } from "react-router-dom";
import { HiAcademicCap } from "react-icons/hi2";

const AuthLayout = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative background shapes */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse pointer-events-none" />

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/30">
            <HiAcademicCap className="h-8 w-8" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            E-Learning <span className="text-blue-600">English</span>
          </span>
        </Link>
        <p className="mt-2 text-xs uppercase tracking-wider font-semibold text-gray-500">
          Nền tảng Học & Luyện thi Tiếng Anh Thông Minh
        </p>
      </div>

      {/* Auth Card Content */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-white/95 py-8 px-6 sm:px-10 shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 backdrop-blur-sm">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
