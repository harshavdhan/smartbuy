import { filterOptions } from "@/config";
import { cn } from "@/lib/utils";
import {
  HousePlug,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";

const quickLinks = [
  { label: "Home", path: "/shop/home" },
  { label: "Products", path: "/shop/listing" },
  { label: "Search", path: "/shop/search" },
  { label: "My Account", path: "/shop/account" },
];

const highlights = [
  {
    icon: <Truck className="h-5 w-5" />,
    title: "Fast Delivery",
    description: "Get your orders delivered quickly and easily.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Secure Payments",
    description: "Safe checkout with multiple payment options.",
  },
];

function ShoppingFooter() {
  const navigate = useNavigate();

  function handleCategoryNavigate(categoryId) {
    sessionStorage.setItem(
      "filters",
      JSON.stringify({
        category: [categoryId],
      })
    );

    navigate(`/shop/listing?category=${categoryId}`);
  }

  return (
    <footer className="border-t bg-slate-950 text-slate-100">
      <div className="bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.24),_transparent_35%),linear-gradient(135deg,_#0f172a_0%,_#020617_100%)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr_0.9fr] lg:px-8">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
                {/* <HousePlug className="h-6 w-6" /> */}
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                {/* <h2 className="text-2xl font-extrabold tracking-tight">
                  Ecommerce
                </h2> */}
                <h2 className="text-2xl font-extrabold tracking-tight">
                  SmartBuy
                </h2>
                {/* <img src={logo} alt="Logo" className="h-20 w-[200px] object-contain" /> */}

                <p className="text-sm text-slate-300">
                  Your one-stop destination for effortless online shopping.
                </p>
              </div>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              Explore the latest fashion, accessories, and essentials with a smooth, responsive, and secure shopping experience.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {highlights.map((highlightItem) => (
                <div
                  key={highlightItem.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10">
                    {highlightItem.icon}
                  </div>
                  <h3 className="font-semibold">{highlightItem.title}</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {highlightItem.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Quick Links
              </h3>
              <div className="mt-4 flex flex-col gap-3">
                {quickLinks.map((linkItem) => (
                  <Link
                    key={linkItem.label}
                    to={linkItem.path}
                    className={cn(
                      "text-sm text-slate-200 transition-colors hover:text-white",
                      "w-fit"
                    )}
                  >
                    {linkItem.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Shop Categories
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {filterOptions.category.map((categoryItem) => (
                  <button
                    key={categoryItem.id}
                    type="button"
                    onClick={() => handleCategoryNavigate(categoryItem.id)}
                    className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-slate-100 transition-colors hover:bg-white hover:text-slate-950"
                  >
                    {categoryItem.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Contact
              </h3>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>India</span>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>support@smartybuy.com</span>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>+91 98765 43210</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              <p className="font-semibold">Why Shop With Us</p>
              <p className="mt-2 leading-6 text-emerald-100/90">
                Easy shopping, fast checkout, and a smooth user experience across all devices.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-center sm:px-6 lg:px-8">
            <p>
              (c) {new Date().getFullYear()} SmartBuy.  All Rights Reserved.
            </p>

          </div>
        </div>
      </div>
    </footer>
  );
}

export default ShoppingFooter;
