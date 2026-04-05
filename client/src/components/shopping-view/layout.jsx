import AuthLogin from "@/pages/auth/login";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import ShoppingHeader from "./header";
import ShoppingFooter from "./footer";

function ShoppingLayout() {
  const { isAuthenticated } = useSelector((state) => state.auth);
  const location = useLocation();
  const [openLoginModal, setOpenLoginModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setOpenLoginModal(false);
      return;
    }

    if (location.pathname === "/shop/home") {
      setOpenLoginModal(true);
    }
  }, [isAuthenticated, location.pathname]);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-white">
      {/* common header */}
      <ShoppingHeader onLoginClick={() => setOpenLoginModal(true)} />
      <main className="flex w-full flex-1 flex-col">
        <Outlet context={{ openLoginModal: () => setOpenLoginModal(true) }} />
      </main>
      <ShoppingFooter />
      {!isAuthenticated ? (
        <Dialog open={openLoginModal} onOpenChange={setOpenLoginModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sign in to continue</DialogTitle>
              <DialogDescription>
                The home page is available right away. Sign in here to use your
                cart, account, and checkout.
              </DialogDescription>
            </DialogHeader>
            <AuthLogin
              isModal
              onSuccess={() => setOpenLoginModal(false)}
            />
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}

export default ShoppingLayout;
