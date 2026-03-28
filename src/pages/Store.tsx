import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Package, Search, Zap, Truck, Shield,
  Smartphone, Headphones, Watch, Laptop, Star, Clock,
  ChevronRight, ChevronLeft, Flame, Heart, MapPin,
  User, Monitor, Cpu, Gamepad2, Speaker, Camera, Tv,
  Plus, PercentCircle, Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

type Product = Tables<"products">;
type Category = Tables<"categories">;

const BANNERS = [
  { image: banner1, title: "SUPER PROMOÇÃO", subtitle: "Smartphones com até 50% OFF", price: "899,90", pix: "à vista no PIX" },
  { image: banner2, title: "A HORA É AGORA", subtitle: "Acessórios & Wearables em promoção", price: "719,90", pix: "à vista no PIX" },
  { image: banner3, title: "MEGA OFERTA", subtitle: "Notebooks para todos os perfis", price: "2.499,90", pix: "à vista no PIX" },
];

const CATEGORY_ICONS: Record<string, any> = {
  Smartphones: Smartphone,
  Acessórios: Headphones,
  Smartwatches: Watch,
  Notebooks: Laptop,
};

const DEPT_ICONS = [
  { icon: Cpu, label: "Hardware" },
  { icon: Gamepad2, label: "Games" },
  { icon: Smartphone, label: "Celular &\nSmartphone" },
  { icon: Laptop, label: "Computadores" },
  { icon: Monitor, label: "Monitores" },
  { icon: Tv, label: "TV" },
  { icon: Speaker, label: "Áudio" },
  { icon: Camera, label: "Câmeras" },
  { icon: Headphones, label: "Periféricos" },
  { icon: Watch, label: "Wearables" },
];

const StorePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [bannerIndex, setBannerIndex] = useState(0);
  const { addItem, itemCount } = useCart();

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
  const isHome = !selectedCategory && !searchQuery;

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
      {/* ═══ TOP BAR ═══ */}
      <header className="bg-card border-b border-border">
        {/* Row 1: Logo + Search + Actions */}
        <div className="container mx-auto flex items-center gap-4 px-4 py-3">
          {/* Location */}
          <div className="hidden lg:flex items-center gap-1.5 text-muted-foreground text-xs flex-shrink-0 cursor-pointer hover:text-foreground transition-colors">
            <MapPin className="h-4 w-4 text-primary" />
            <div>
              <span className="text-[10px]">Enviar para:</span>
              <p className="font-semibold text-foreground text-xs">Digite o CEP</p>
            </div>
          </div>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-foreground hidden sm:block">
              Smart<span className="text-primary">Cell</span>
            </span>
          </Link>

          {/* Search bar */}
          <div className="flex-1 max-w-3xl relative">
            <Input
              placeholder="Busque no SmartCell..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-14 bg-foreground/5 border-primary/30 h-11 rounded-lg text-sm placeholder:text-muted-foreground focus:border-primary"
            />
            <button className="absolute right-0 top-0 h-11 w-12 bg-primary rounded-r-lg flex items-center justify-center hover:bg-primary/90 transition-colors">
              <Search className="h-5 w-5 text-primary-foreground" />
            </button>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            <Link to="/admin/login" className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2">
              <User className="h-5 w-5" />
              <div className="hidden lg:block">
                <span className="text-[10px]">Entre ou</span>
                <p className="font-semibold text-foreground text-xs">Cadastre-se</p>
              </div>
            </Link>
            <button className="hidden md:flex h-10 w-10 items-center justify-center rounded-lg hover:bg-accent transition-colors">
              <Heart className="h-5 w-5 text-muted-foreground" />
            </button>
            <Link to="/cart" className="relative">
              <div className="h-10 w-10 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
                <ShoppingCart className="h-5 w-5 text-foreground" />
              </div>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Row 2: Navigation */}
        <div className="border-t border-border bg-card/80">
          <div className="container mx-auto px-4">
            <nav className="flex items-center gap-0.5 overflow-x-auto py-2 scrollbar-hide">
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-primary text-primary-foreground text-sm font-bold whitespace-nowrap">
                <Package className="h-4 w-4" /> Departamentos
              </button>
              <button
                onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
                className={`px-3 py-1.5 rounded-md text-sm font-semibold whitespace-nowrap transition-colors ${
                  !selectedCategory ? "text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                Mais Vendidos
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.id);
                    setSearchQuery("");
                    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === c.id
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* ═══ BANNER CAROUSEL (KaBuM-style) ═══ */}
      {isHome && (
        <section className="relative">
          <div className="relative h-[300px] md:h-[380px] overflow-hidden">
            {BANNERS.map((banner, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${i === bannerIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <img src={banner.image} alt={banner.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4 flex items-center justify-between">
                    <div className="max-w-md">
                      <span className="inline-block bg-primary text-primary-foreground text-xs font-black px-3 py-1 rounded-md mb-3 uppercase tracking-wider">
                        {banner.title}
                      </span>
                      <p className="text-lg md:text-2xl font-bold text-foreground mb-2">{banner.subtitle}</p>
                      <p className="text-muted-foreground text-sm">Aproveite os <strong className="text-foreground">melhores preços</strong></p>
                      <Button
                        className="mt-4 rounded-lg font-bold"
                        onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                      >
                        Garanta já <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="hidden md:block text-right">
                      <p className="text-muted-foreground text-sm">a partir de</p>
                      <p className="text-4xl font-black text-primary">
                        R$ <span className="text-5xl">{banner.price}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{banner.pix}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={() => setBannerIndex((i) => (i - 1 + BANNERS.length) % BANNERS.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center hover:bg-background/90 transition-colors z-10"
            >
              <ChevronLeft className="h-5 w-5 text-foreground" />
            </button>
            <button
              onClick={() => setBannerIndex((i) => (i + 1) % BANNERS.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center hover:bg-background/90 transition-colors z-10"
            >
              <ChevronRight className="h-5 w-5 text-foreground" />
            </button>

            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {BANNERS.map((_, i) => (
                <button key={i} onClick={() => setBannerIndex(i)} className={`h-2 rounded-full transition-all ${i === bannerIndex ? "w-8 bg-primary" : "w-2 bg-foreground/30"}`} />
              ))}
            </div>
          </div>

          {/* ── Ofertas do dia + A hora é agora (side-by-side like KaBuM) ── */}
          {promoProducts.length > 0 && (
            <div className="container mx-auto px-4 -mt-2 relative z-10">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Ofertas do dia */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <PercentCircle className="h-4 w-4 text-primary" /> Ofertas do dia
                    </h3>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {promoProducts.slice(0, 2).map((p) => {
                      const disc = Math.round((1 - Number(p.promotional_price) / Number(p.price)) * 100);
                      return (
                        <div key={p.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => addItem(p)}>
                          <div className="h-16 w-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/30" /></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground font-medium line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                            <p className="text-sm font-bold text-primary mt-0.5">R$ {Number(p.promotional_price).toFixed(2)}</p>
                          </div>
                          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0">-{disc}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* A hora é agora */}
                <div className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Flame className="h-4 w-4 text-primary" /> A hora é agora
                    </h3>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-3">
                    {bestSellers.slice(0, 2).map((p) => (
                      <div key={p.id} className="flex items-center gap-3 group cursor-pointer" onClick={() => addItem(p)}>
                        <div className="h-16 w-16 rounded-lg bg-secondary/30 overflow-hidden flex-shrink-0">
                          {p.images?.[0] ? (
                            <img src={p.images[0]} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground/30" /></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground font-medium line-clamp-1 group-hover:text-primary transition-colors">{p.name}</p>
                          <p className="text-sm font-bold text-primary mt-0.5">R$ {Number(p.promotional_price ?? p.price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══ DEPARTMENT ICONS (horizontal scrollable, KaBuM-style) ═══ */}
      {isHome && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-6 overflow-x-auto pb-2 scrollbar-hide justify-center">
            {DEPT_ICONS.map(({ icon: Icon, label }) => (
              <button key={label} className="flex flex-col items-center gap-2 min-w-[80px] group">
                <div className="h-16 w-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center group-hover:bg-primary/20 group-hover:border-primary/40 transition-all">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <span className="text-[11px] font-medium text-muted-foreground text-center leading-tight group-hover:text-foreground transition-colors whitespace-pre-line">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ═══ "A HORA É AGORA" product grid (KaBuM-style) ═══ */}
      {isHome && bestSellers.length > 0 && (
        <section className="bg-card/40 border-y border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Flame className="h-5 w-5 text-primary" /> A hora é agora
              </h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                <span>Termina em: <strong className="text-foreground">5d 09h 46m</strong></span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {products.slice(0, 5).map((product, i) => (
                <ProductCard key={product.id} product={product} addItem={addItem} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ PROMOÇÕES ═══ */}
      {isHome && promoProducts.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-6">
            <Tag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Ofertas do Dia</h2>
            <span className="ml-2 bg-primary/15 text-primary text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase">
              Tempo limitado
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {promoProducts.map((product, i) => (
              <ProductCard key={product.id} product={product} addItem={addItem} index={i} showDiscount />
            ))}
          </div>
        </section>
      )}

      {/* ═══ MAIS VENDIDOS ═══ */}
      {isHome && (
        <section className="bg-card/40 border-y border-border">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Mais Vendidos</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {bestSellers.map((product, i) => (
                <ProductCard key={product.id} product={product} addItem={addItem} index={i} showRating />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ ALL PRODUCTS ═══ */}
      <section id="products" className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : searchQuery ? `Resultados para "${searchQuery}"` : "Todos os Produtos"}
            </h2>
            <span className="text-xs text-muted-foreground">({filtered.length})</span>
          </div>
          {(selectedCategory || searchQuery) && (
            <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}>
              Limpar filtros
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} addItem={addItem} index={i} showDiscount />
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

      {/* ═══ TRUST BAR ═══ */}
      <section className="border-y border-border bg-card/60">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, label: "Frete para todo Brasil" },
              { icon: Shield, label: "Compra 100% segura" },
              { icon: Zap, label: "Envio rápido" },
              { icon: Star, label: "Garantia inclusa" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 justify-center">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-card border-t border-border">
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
                <li className="hover:text-foreground cursor-pointer transition-colors">Central de Ajuda</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Trocas e Devoluções</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Fale Conosco</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-3">Institucional</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="hover:text-foreground cursor-pointer transition-colors">Sobre nós</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Políticas de Privacidade</li>
                <li className="hover:text-foreground cursor-pointer transition-colors">Termos de Uso</li>
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
            <p className="text-xs text-muted-foreground">© 2026 SmartCell Store. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

/* ═════════════ Product Card (KaBuM-style) ═════════════ */

interface ProductCardProps {
  product: Product;
  addItem: (product: Product) => void;
  index: number;
  showDiscount?: boolean;
  showRating?: boolean;
}

const ProductCard = ({ product, addItem, index, showDiscount, showRating }: ProductCardProps) => {
  const price = product.promotional_price ?? product.price;
  const hasPromo = product.promotional_price !== null;
  const discount = hasPromo ? Math.round((1 - Number(product.promotional_price) / Number(product.price)) * 100) : 0;
  const rating = 4.5 + (index % 5) * 0.1; // simulate

  return (
    <div
      className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-12px_hsl(142_71%_45%_/_0.15)] animate-fade-in flex flex-col"
      style={{ animationDelay: `${index * 50}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-secondary/20 overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-12 w-12 text-muted-foreground/20" />
          </div>
        )}

        {/* Top badges */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          {showRating && (
            <span className="bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <Star className="h-2.5 w-2.5 fill-current" /> {rating.toFixed(1)}
            </span>
          )}
          {showDiscount && hasPromo && (
            <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-md">
              -{discount}%
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button className="absolute top-2 right-2 h-7 w-7 rounded-full bg-background/60 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background/90">
          <Heart className="h-3.5 w-3.5 text-foreground" />
        </button>

        {/* Quick-add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-background/95 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <Button
            className="w-full rounded-lg font-semibold text-xs h-8"
            disabled={product.stock <= 0}
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
          >
            <Plus className="h-3 w-3 mr-1" />
            {product.stock > 0 ? "Comprar" : "Esgotado"}
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <h3 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug mb-auto">
          {product.name}
        </h3>
        <div className="mt-2">
          {hasPromo && (
            <span className="text-[10px] text-muted-foreground line-through">
              R$ {Number(product.price).toFixed(2)}
            </span>
          )}
          <p className="text-base font-extrabold text-primary">
            R$ {Number(price).toFixed(2)}
          </p>
          <p className="text-[10px] text-muted-foreground">à vista no PIX</p>
        </div>
      </div>
    </div>
  );
};

export default StorePage;
