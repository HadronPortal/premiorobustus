import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Plus, Package, ChevronRight, Zap, Truck, Shield, Smartphone, Headphones, Watch, Laptop, Star } from "lucide-react";
import { Link } from "react-router-dom";

type Product = Tables<"products">;
type Category = Tables<"categories">;

const CATEGORY_ICONS: Record<string, any> = {
  "Smartphones": Smartphone,
  "Acessórios": Headphones,
  "Smartwatches": Watch,
  "Notebooks": Laptop,
};

const StorePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, itemCount } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      const [p, c] = await Promise.all([
        supabase.from("products").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts(p.data ?? []);
      setCategories(c.data ?? []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = selectedCategory
    ? products.filter((p) => p.category_id === selectedCategory)
    : products;

  const promoProducts = products.filter((p) => p.promotional_price !== null);
  const bestSellers = products.slice(0, 4);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-muted-foreground text-sm tracking-widest uppercase">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">SmartCell</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  setSelectedCategory(c.id);
                  document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {c.name}
              </button>
            ))}
          </nav>

          <Link to="/cart" className="relative group">
            <div className="h-11 w-11 rounded-full bg-secondary flex items-center justify-center group-hover:bg-accent transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
            </div>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse-glow">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Hero Banner - Apple Style */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-background to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        <div className="container mx-auto px-6 py-24 md:py-36 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 px-4 py-1.5 text-sm font-medium">
              🔥 Ofertas Exclusivas
            </Badge>
            <h1 className="text-5xl md:text-7xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-6">
              Tecnologia que
              <span className="block text-primary">transforma.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
              Os melhores smartphones, acessórios e gadgets com preços que cabem no seu bolso.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-base px-8 py-6 rounded-full font-semibold animate-pulse-glow"
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
              >
                Comprar Agora <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-8 py-6 rounded-full font-semibold border-border/50 hover:bg-accent"
                onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
              >
                Ver Categorias
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-6 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, text: "Frete para todo Brasil" },
              { icon: Shield, text: "Compra segura" },
              { icon: Zap, text: "Envio rápido" },
              { icon: Star, text: "Garantia inclusa" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 justify-center">
                <Icon className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-muted-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section id="categories" className="container mx-auto px-6 py-20">
          <div className="text-center mb-12 animate-fade-in">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Categorias</h2>
            <p className="text-muted-foreground">Encontre o que você procura</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((cat, i) => {
              const IconComp = CATEGORY_ICONS[cat.name] || Smartphone;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group glass-card rounded-2xl p-8 text-center hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                    <IconComp className="h-7 w-7 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Best Sellers */}
      {bestSellers.length > 0 && !selectedCategory && (
        <section className="container mx-auto px-6 py-20">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Mais Vendidos</h2>
              <p className="text-muted-foreground">Os favoritos dos nossos clientes</p>
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product, i) => (
              <ProductCard key={product.id} product={product} addItem={addItem} index={i} badge="🔥 Popular" />
            ))}
          </div>
        </section>
      )}

      {/* Promo */}
      {promoProducts.length > 0 && !selectedCategory && (
        <section className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-6 py-20">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">Ofertas</h2>
                <p className="text-muted-foreground">Preços imperdíveis por tempo limitado</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {promoProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} addItem={addItem} index={i} badge="🏷️ Oferta" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Products */}
      <section id="products" className="container mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : "Todos os Produtos"}
            </h2>
            <p className="text-muted-foreground">{filtered.length} produto{filtered.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge
              variant={selectedCategory === null ? "default" : "outline"}
              className={`cursor-pointer px-5 py-2 text-sm rounded-full transition-all ${
                selectedCategory === null ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
              onClick={() => setSelectedCategory(null)}
            >
              Todos
            </Badge>
            {categories.map((c) => (
              <Badge
                key={c.id}
                variant={selectedCategory === c.id ? "default" : "outline"}
                className={`cursor-pointer px-5 py-2 text-sm rounded-full transition-all ${
                  selectedCategory === c.id ? "bg-primary text-primary-foreground" : "hover:bg-accent"
                }`}
                onClick={() => setSelectedCategory(c.id)}
              >
                {c.name}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} addItem={addItem} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <Package className="h-20 w-20 mx-auto mb-6 text-muted-foreground/30" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum produto encontrado</h3>
            <p className="text-muted-foreground">Tente outra categoria ou volte mais tarde</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-card/50">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">SmartCell Store</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 SmartCell Store. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  addItem: (product: Product) => void;
  index: number;
  badge?: string;
}

const ProductCard = ({ product, addItem, index, badge }: ProductCardProps) => {
  const price = product.promotional_price ?? product.price;
  const hasPromo = product.promotional_price !== null;
  const discount = hasPromo
    ? Math.round((1 - Number(product.promotional_price) / Number(product.price)) * 100)
    : 0;

  return (
    <div
      className="group glass-card rounded-2xl overflow-hidden hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_hsl(0_72%_51%_/_0.15)] animate-fade-in"
      style={{ animationDelay: `${index * 80}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      <div className="relative aspect-square bg-secondary/50 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-20 w-20 text-muted-foreground/20" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {badge && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
          {hasPromo && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick Add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-background/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="w-full rounded-full font-semibold"
            disabled={product.stock <= 0}
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
          >
            <Plus className="h-4 w-4 mr-2" />
            {product.stock > 0 ? "Comprar Agora" : "Esgotado"}
          </Button>
        </div>
      </div>

      <div className="p-5 space-y-3">
        <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
        )}
        <div className="flex items-end gap-2">
          {hasPromo && (
            <span className="text-sm text-muted-foreground line-through">
              R$ {Number(product.price).toFixed(2)}
            </span>
          )}
          <span className="text-xl font-bold text-foreground">
            R$ {Number(price).toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground">
            {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
          </span>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-xs text-primary font-medium">Últimas unidades!</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
