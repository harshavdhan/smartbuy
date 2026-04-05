import { Navigate, useLocation } from "react-router-dom";

function CheckAuth({ isAuthenticated, user, children }) {
  const location = useLocation();
  const isAuthPage =
    location.pathname.includes("/login") ||
    location.pathname.includes("/register");
  const isGuestHomePage = location.pathname === "/shop/home";

  console.log(location.pathname, isAuthenticated);

  if (location.pathname === "/") {
    if (isAuthenticated && user?.role === "admin") {
      return <Navigate to="/admin/dashboard" />;
    }

    return <Navigate to="/shop/home" />;
  }

  if (!isAuthenticated && !isAuthPage && !isGuestHomePage) {
    return <Navigate to="/shop/home" />;
  }

  if (isAuthenticated && isAuthPage) {
    if (user?.role === "admin") {
      return <Navigate to="/admin/dashboard" />;
    } else {
      return <Navigate to="/shop/home" />;
    }
  }

  if (
    isAuthenticated &&
    user?.role !== "admin" &&
    location.pathname.includes("admin")
  ) {
    return <Navigate to="/unauth-page" />;
  }

  if (
    isAuthenticated &&
    user?.role === "admin" &&
    location.pathname.includes("shop")
  ) {
    return <Navigate to="/admin/dashboard" />;
  }

  return <>{children}</>;
}

export default CheckAuth;
