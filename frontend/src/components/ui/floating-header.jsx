import React from "react";
import { createPortal } from "react-dom";
import { Grid2x2PlusIcon, MenuIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FloatingHeader({ isAuthenticated, user, onLogout }) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);
  React.useEffect(() => {
    if (!open) return undefined;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [open]);

  const links = isAuthenticated
    ? [
        { label: "Dashboard", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "Tasks", href: "/tasks" }
      ]
    : [
        { label: "Login", href: "/login" },
        { label: "Signup", href: "/signup" }
      ];

  return (
    <header
      className={cn(
        "floating-nav sticky top-4 z-50",
        "mx-auto w-full max-w-5xl rounded-xl border shadow",
        "backdrop-blur-lg"
      )}
    >
      <nav className="mx-auto flex items-center justify-between gap-2 p-1.5">
        <Link to={isAuthenticated ? "/" : "/login"} className="brand-mark hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 duration-100">
          <Grid2x2PlusIcon className="size-5" />
          <p className="font-mono text-base font-bold">TaskForge</p>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          {links.map((link) => (
            <Link key={link.label} className={buttonVariants({ variant: "ghost", size: "sm" })} to={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <div className="hidden items-center gap-2 lg:flex">
              <span className="user-chip">{user?.name}</span>
              <Button size="sm" variant="outline" onClick={onLogout}>
                Logout
              </Button>
            </div>
          ) : (
            <Link to="/login" className="hidden lg:block">
              <Button size="sm">Login</Button>
            </Link>
          )}

          <Button
            size="icon"
            variant="outline"
            type="button"
            aria-label="Open navigation menu"
            onClick={() => setOpen(!open)}
            className="inline-flex border-blue-200 text-blue-900 hover:bg-blue-50 lg:hidden"
          >
            <MenuIcon className="size-4" />
          </Button>
        </div>
      </nav>

      {mounted &&
        open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-[70] bg-black/45 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <aside className="mobile-drawer fixed inset-y-0 left-0 z-[71] flex w-[82%] max-w-[320px] flex-col p-4 shadow-2xl lg:hidden">
              <div className="grid gap-2 pt-2">
                {isAuthenticated && (
                  <div className="drawer-user rounded-lg px-3 py-2 text-sm font-semibold">
                    Signed in as {user?.name}
                  </div>
                )}
                {links.map((link) => (
                  <Link
                    key={link.label}
                    className={buttonVariants({ variant: "ghost", className: "drawer-link justify-start" })}
                    to={link.href}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto grid gap-2 pt-6">
                {isAuthenticated ? (
                  <Button
                    variant="outline"
                    className="drawer-btn"
                    onClick={() => {
                      onLogout();
                      setOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="drawer-btn">Login</Button>
                    </Link>
                    <Link to="/signup" onClick={() => setOpen(false)}>
                      <Button className="drawer-btn drawer-btn-primary">Get Started</Button>
                    </Link>
                  </>
                )}
              </div>
            </aside>
          </>,
          document.body
        )}
    </header>
  );
}
