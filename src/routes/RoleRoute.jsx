import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { USER_ROLES } from "../utils/constants";

const RoleRoute = ({ allowedRoles = [], children }) => {
  const { user } = useAuth();
  const role = user?.role;

  const rolesArray = Array.isArray(allowedRoles)
    ? allowedRoles
    : [allowedRoles];

  if (!role || !rolesArray.includes(role)) {
    // Redirect to respective default page
    if (role === USER_ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (role === USER_ROLES.TEACHER) {
      return <Navigate to="/teacher/dashboard" replace />;
    } else {
      return <Navigate to="/student/dashboard" replace />;
    }
  }

  return children ? children : <Outlet />;
};

export default RoleRoute;
