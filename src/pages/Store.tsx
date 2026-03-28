import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Minus, Store as StoreIcon } from "lucide-react";
import { Link } from "react-router-dom";

type Product = Tables<"products">;
type Category = Tables<"categories">;

const StorePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, itemCount } = useCart();

  useEffect(() => {
    const fetch = async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts(p.data ?? []);
      setCategories(c.data ?? []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <StoreIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SmartCell Store</h1>
          </div>
          <Link to="/cart">
            <Button variant="outline" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Categories filter */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Badge
            variant={selectedCategory === null ? "default" : "outline"}
            className="cursor-pointer px-4 py-2"
            onClick={() => setSelectedCategory(null)}
          >
            Todos
          </Badge>
          {categories.map((c) => (
            <Badge
              key={c.id}
              variant={selectedCategory === c.id ? "default" : "outline"}
              className="cursor-pointer px-4 py-2"
              onClick={() => setSelectedCategory(c.id)}
            >
              {c.name}
            </Badge>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => {
            const price = product.promotional_price ?? product.price;
            const hasPromo = product.promotional_price !== null;
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-16 w-16 text-muted-foreground" />
                  )}
                </div>
                <CardContent className="p-4 space-y-2">
                  <h3 className="font-semibold text-foreground line-clamp-2">{product.name}</h3>
                  {product.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    {hasPromo && (
                      <span className="text-sm text-muted-foreground line-through">R$ {Number(product.price).toFixed(2)}</span>
                    )}
                    <span className="text-lg font-bold text-foreground">R$ {Number(price).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}</span>
                    <Button
                      size="sm"
                      disabled={product.stock <= 0}
                      onClick={() => addItem(product)}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Adicionar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhum produto encontrado</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default StorePage;
