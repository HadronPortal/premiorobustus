import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Plus, Package, Search, Zap, Truck, Shield,
  Smartphone, Headphones, Watch, Laptop, Star, Tag, Clock,
  ChevronRight, ChevronLeft, Flame, PercentCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

const BANNERS = [
  { image: banner1, title: "Smartphones com até 50% OFF", subtitle: "Os melhores celulares com preço imbatível", cta: "Ver Smartphones" },
  { image: banner2, title: "Acessórios & Wearables", subtitle: "Smartwatches, fones e muito mais em promoção", cta: "Conferir Ofertas" },
  { image: banner3, title: "Notebooks para todos", subtitle: "MacBook, Lenovo, Samsung — parcele em até 12x", cta: "Ver Notebooks" },
];

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
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const { addItem, itemCount } = useCart();

  // Auto-rotate banners
  useEffect(() => {
    const timer = setInterval(() => setBannerIndex((i) => (i + 1) % BANNERS.length), 5000);
    return () => clearInterval(timer);
  }, []);

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

  const filtered = products.filter((p) => {
    const matchCategory = selectedCategory ? p.category_id === selectedCategory : true;
    const matchSearch = searchQuery
      ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
      : true;
    return matchCategory && matchSearch;
  });

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
      {/* Top utility bar */}
      <div className="bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-between px-4 py-1.5 text-xs font-medium">
          <span>🔥 Frete grátis para compras acima de R$ 299</span>
          <div className="hidden md:flex items-center gap-4">
            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Entrega rápida</span>
            <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Compra segura</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground hidden sm:block">
              Smart<span className="text-primary">Cell</span>
            </span>
          </Link>

          {/* Search */}
          <div className="flex-1 max-w-2xl relative">
            <Input
              placeholder="Busque no SmartCell..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-12 bg-secondary border-border h-10 rounded-lg text-sm placeholder:text-muted-foreground"
            />
            <button className="absolute right-0 top-0 h-10 w-10 bg-primary rounded-r-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Search className="h-4 w-4 text-primary-foreground" />
            </button>
          </div>

          {/* Cart */}
          <Link to="/cart" className="relative flex-shrink-0 group">
            <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-accent transition-colors">
              <ShoppingCart className="h-5 w-5 text-foreground" />
            </div>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </Link>
        </div>

        {/* Nav categories */}
        <div className="border-t border-border bg-card/50">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === null ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                Todos
              </button>
              {categories.map((c) => {
                const Icon = CATEGORY_ICONS[c.name] || Smartphone;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCategory(c.id);
                      setSearchQuery("");
                      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === c.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {c.name}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      {!selectedCategory && !searchQuery && (
        <section className="relative overflow-hidden bg-gradient-to-br from-primary/20 via-background to-background">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]" />
          <div className="container mx-auto px-4 py-16 md:py-24 relative">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="animate-fade-in-up">
                <Badge className="mb-4 bg-primary/20 text-primary border-primary/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <Flame className="h-3 w-3 mr-1" /> Super Promoção
                </Badge>
                <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight mb-4">
                  As melhores
                  <span className="text-primary"> ofertas</span> em
                  tecnologia
                </h1>
                <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8 leading-relaxed">
                  Smartphones, notebooks e acessórios com os melhores preços do mercado. Aproveite!
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    size="lg"
                    className="text-sm px-6 py-5 rounded-lg font-bold animate-pulse-glow"
                    onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Ver Ofertas <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-sm px-6 py-5 rounded-lg font-bold border-border hover:bg-accent"
                    onClick={() => document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" })}
                  >
                    Categorias
                  </Button>
                </div>
              </div>
              <div className="hidden md:flex items-center justify-center">
                <div className="relative">
                  <div className="w-72 h-72 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-56 h-56 rounded-full bg-primary/15 flex items-center justify-center">
                      <Smartphone className="h-28 w-28 text-primary/60" />
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 bg-card border border-border rounded-xl px-4 py-2 shadow-lg animate-fade-in">
                    <span className="text-xs text-muted-foreground">até</span>
                    <span className="block text-xl font-extrabold text-primary">50% OFF</span>
                  </div>
                  <div className="absolute -bottom-2 -left-4 bg-card border border-border rounded-xl px-4 py-2 shadow-lg animate-fade-in" style={{ animationDelay: "200ms" }}>
                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Truck className="h-3 w-3" /> Frete Grátis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trust bar */}
      <section className="border-y border-border bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: "Frete para todo Brasil" },
              { icon: Shield, label: "Compra 100% segura" },
              { icon: Zap, label: "Envio rápido" },
              { icon: Star, label: "Garantia inclusa" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 justify-center">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories horizontal */}
      {categories.length > 0 && !selectedCategory && !searchQuery && (
        <section id="categories" className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Categorias</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => {
              const IconComp = CATEGORY_ICONS[cat.name] || Smartphone;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <IconComp className="h-6 w-6 text-primary" />
                  </div>
                  <span className="text-xs font-semibold text-foreground">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Ofertas do dia */}
      {promoProducts.length > 0 && !selectedCategory && !searchQuery && (
        <section className="bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-4 py-10">
            <div className="flex items-center gap-2 mb-6">
              <PercentCircle className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Ofertas do Dia</h2>
              <Badge className="ml-2 bg-primary/20 text-primary border-primary/30 text-[10px] font-bold uppercase">
                Tempo limitado
              </Badge>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {promoProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} addItem={addItem} index={i} badge="OFERTA" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mais vendidos */}
      {bestSellers.length > 0 && !selectedCategory && !searchQuery && (
        <section className="container mx-auto px-4 py-10">
          <div className="flex items-center gap-2 mb-6">
            <Flame className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">Mais Vendidos</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.map((product, i) => (
              <ProductCard key={product.id} product={product} addItem={addItem} index={i} badge="POPULAR" />
            ))}
          </div>
        </section>
      )}

      {/* All Products */}
      <section id="products" className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : searchQuery ? `Resultados para "${searchQuery}"` : "Todos os Produtos"}
            </h2>
            <span className="text-xs text-muted-foreground ml-1">({filtered.length})</span>
          </div>
          {(selectedCategory || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}>
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} addItem={addItem} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground">Tente outra categoria ou busca</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-10">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-bold text-foreground">SmartCell</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A melhor loja de tecnologia do Brasil. Qualidade e preço justo.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Atendimento</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Central de Ajuda</li>
                <li>Trocas e Devoluções</li>
                <li>Fale Conosco</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Institucional</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Sobre nós</li>
                <li>Políticas de Privacidade</li>
                <li>Termos de Uso</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Pagamento</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>Cartão de Crédito</li>
                <li>Boleto Bancário</li>
                <li>PIX</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border pt-6 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 SmartCell Store. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ───── Product Card ───── */

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
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_hsl(142_71%_45%_/_0.2)] animate-fade-in"
      style={{ animationDelay: `${index * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary/30 overflow-hidden">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-16 w-16 text-muted-foreground/20" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5">
          {badge && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {badge}
            </span>
          )}
          {hasPromo && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2.5 py-1 rounded-md">
              -{discount}%
            </span>
          )}
        </div>

        {/* Quick add */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-background/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="w-full rounded-lg font-semibold text-xs h-9"
            disabled={product.stock <= 0}
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
          >
            <Plus className="h-3.5 w-3.5 mr-1" />
            {product.stock > 0 ? "Adicionar ao Carrinho" : "Esgotado"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">{product.description}</p>
        )}
        <div className="pt-1">
          {hasPromo && (
            <span className="text-xs text-muted-foreground line-through block">
              R$ {Number(product.price).toFixed(2)}
            </span>
          )}
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-primary">
              R$ {Number(price).toFixed(2)}
            </span>
            {hasPromo && (
              <span className="text-[10px] text-muted-foreground">à vista no PIX</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            {product.stock > 0 ? `${product.stock} em estoque` : "Esgotado"}
          </span>
          {product.stock <= 5 && product.stock > 0 && (
            <span className="text-[10px] text-primary font-bold uppercase">Últimas un.</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default StorePage;
