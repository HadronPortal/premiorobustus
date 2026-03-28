import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, totalProducts: 0, pendingOrders: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [orders, products] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("id", { count: "exact" }),
      ]);

      const totalRevenue = orders.data?.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;
      const pendingOrders = orders.data?.filter((o) => o.status === "pendente").length ?? 0;

      setStats({
        totalOrders: orders.data?.length ?? 0,
        totalRevenue,
        totalProducts: products.count ?? 0,
        pendingOrders,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: "Total de Vendas", value: `R$ ${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-600" },
    { title: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-blue-600" },
    { title: "Produtos", value: stats.totalProducts, icon: Package, color: "text-purple-600" },
    { title: "Pendentes", value: stats.pendingOrders, icon: TrendingUp, color: "text-orange-600" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
