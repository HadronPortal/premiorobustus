import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Package, ShoppingCart, LogOut } from "lucide-react";

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const links = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/products", label: "Produtos", icon: Package },
    { to: "/admin/orders", label: "Pedidos", icon: ShoppingCart },
  ];

  return (
    <div className="flex min-h-screen bg-muted">
      <aside className="w-64 bg-card border-r border-border p-4 flex flex-col">
        <h2 className="text-xl font-bold text-foreground mb-6">SmartCell Admin</h2>
        <nav className="flex-1 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}
        </nav>
        <Button variant="ghost" onClick={signOut} className="justify-start gap-3">
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
