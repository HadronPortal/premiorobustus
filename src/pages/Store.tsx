import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart, Package, Search, Zap, Truck, Shield,
  Star, Clock,
  ChevronRight, ChevronLeft, Flame, Heart, MapPin,
  User, Plus, Tag, Menu, X, Mail, CreditCard, Lock, Award,
  ArrowRight, Sparkles, TrendingUp, Eye,
} from "lucide-react";
import iconSmartphone from "@/assets/icon-smartphone.png";
import iconNotebook from "@/assets/icon-notebook.png";
import iconHeadphones from "@/assets/icon-headphones.png";
import iconGamepad from "@/assets/icon-gamepad.png";
import iconMonitor from "@/assets/icon-monitor.png";
import iconSmartwatch from "@/assets/icon-smartwatch.png";
import iconHardware from "@/assets/icon-hardware.png";
import iconTv from "@/assets/icon-tv.png";
import { Link } from "react-router-dom";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

type Product = Tables<"products">;
type Category = Tables<"categories">;

const HERO_SLIDES = [
  {
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=1920&auto=format&fit=crop",
    tag: "OFERTA NINJA",
    title: "OFERTA NINJA",
    subtitle: "Aproveite os melhores preços em tecnologia!",
    cta: "COMPRAR AGORA",
    price: "7.499",
  },
  {
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=1920&auto=format&fit=crop",
    tag: "HARDWARE",
    title: "HARDWARE PREMIUM",
    subtitle: "Componentes de alta performance para seu setup.",
    cta: "VER OFERTA",
    price: "1.499",
  }
];

const DEPT_ICONS = [
  { img: "https://img.icons8.com/3d-fluency/100/processor.png", label: "Hardwares" },
  { img: "https://img.icons8.com/3d-fluency/100/mouse.png", label: "Periféricos" },
  { img: "https://img.icons8.com/3d-fluency/100/monitor.png", label: "Monitores" },
  { img: "https://img.icons8.com/3d-fluency/100/video-card.png", label: "Placas de Vídeo" },
  { img: "https://img.icons8.com/3d-fluency/100/smartphone.png", label: "Celulares" },
  { img: "https://img.icons8.com/3d-fluency/100/headset.png", label: "Headsets" },
  { img: "https://img.icons8.com/3d-fluency/100/keyboard.png", label: "Teclados" },
  { img: "https://img.icons8.com/3d-fluency/100/console.png", label: "Games" },
];

const REVIEWS = [
  { name: "Carlos M.", text: "Produto chegou rápido e em perfeito estado. Recomendo demais!", rating: 5 },
  { name: "Ana S.", text: "Melhor loja de eletrônicos que já comprei. Preço justo e atendimento top.", rating: 5 },
  { name: "Pedro L.", text: "Entrega antes do prazo, embalagem impecável. Voltarei a comprar com certeza!", rating: 5 },
];

/* ═══ Countdown Hook ═══ */
const useCountdown = () => {
  const [time, setTime] = useState({ d: 5, h: 9, m: 46, s: 32 });
  useEffect(() => {
    const t = setInterval(() => {
      setTime((prev) => {
        let { d, h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        if (d < 0) return { d: 0, h: 0, m: 0, s: 0 };
        return { d, h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);
  return time;
};

const pad = (n: number) => String(n).padStart(2, "0");

const StorePage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [heroIndex, setHeroIndex] = useState(0);
  const [mobileMenu, setMobileMenu] = useState(false);
  const { addItem, itemCount } = useCart();
  const countdown = useCountdown();

  useEffect(() => {
    const timer = setInterval(() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length), 6000);
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
  const bestSellers = products.slice(0, 8);
  const isHome = !selectedCategory && !searchQuery;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-16 w-16">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <Zap className="absolute inset-0 m-auto h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase font-medium">Carregando</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* ═══ ANNOUNCEMENT BAR ═══ */}
      <div className="bg-[#E6C200] py-1 border-b border-black/5 hidden md:block">
        <div className="container mx-auto px-4 flex items-center justify-between text-[10px] font-bold text-[#42464D] uppercase tracking-wider">
          <div className="flex items-center gap-6">
            <span className="hover:text-primary cursor-pointer">INSTITUCIONAL</span>
            <span className="hover:text-primary cursor-pointer">POLÍTICAS</span>
            <span className="hover:text-primary cursor-pointer">AJUDA</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Truck className="h-3 w-3" /> FRETE GRÁTIS</span>
            <span className="flex items-center gap-1.5 text-primary"><Zap className="h-3 w-3" /> OFERTAS DO DIA</span>
          </div>
        </div>
      </div>

      {/* ═══ MAIN HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-[#FFD700] text-[#42464D]">
        <div className="container mx-auto px-4 h-20 flex items-center gap-6">
          {/* Menu button */}
          <button className="flex flex-col items-center gap-1 group" onClick={() => setMobileMenu(!mobileMenu)}>
            <Menu className="h-8 w-8 text-[#42464D] group-hover:text-primary transition-colors" />
            <span className="text-[10px] font-bold hidden md:block">MENU</span>
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-4xl font-black italic tracking-tighter text-[#42464D]">
              KABUM<span className="text-primary">.</span>
            </h1>
          </Link>

          {/* Search */}
          <div className="flex-1 relative group">
            <Input
              placeholder="Busque aqui o seu produto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-foreground h-12 rounded-sm border-none pr-12 font-medium placeholder:text-muted-foreground/60 focus-visible:ring-primary"
            />
            <button className="absolute right-0 top-0 h-12 w-12 flex items-center justify-center text-[#42464D] hover:text-primary transition-colors">
              <Search className="h-6 w-6" />
            </button>
          </div>

          {/* User & Cart */}
          <div className="flex items-center gap-6">
            <Link to="/admin/login" className="flex items-center gap-2 group">
              <div className="h-10 w-10 flex items-center justify-center border-2 border-[#42464D]/20 rounded-full group-hover:border-primary transition-colors">
                <User className="h-5 w-5" />
              </div>
              <div className="hidden lg:block leading-tight">
                <p className="text-[10px] font-bold text-[#42464D]/70">LOGIN OU</p>
                <p className="text-xs font-bold text-[#42464D]">CADASTRE-SE</p>
              </div>
            </Link>

            <Link to="/cart" className="relative group flex items-center gap-3">
              <div className="relative">
                <ShoppingCart className="h-8 w-8 text-[#42464D] group-hover:text-primary transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow-lg">
                    {itemCount}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Desktop Categories Sub-header - REMOVED from top, will move to bottom fixed or under banner if needed but photo shows it floating/scrolling */}

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="absolute top-full left-0 w-full md:w-80 h-[calc(100vh-80px)] bg-white text-foreground shadow-2xl animate-fade-in overflow-y-auto">
            <div className="p-4 bg-[#FFD700] text-[#42464D] flex items-center justify-between">
              <span className="font-bold">DEPARTAMENTOS</span>
              <X className="h-6 w-6 cursor-pointer" onClick={() => setMobileMenu(false)} />
            </div>
            <nav className="flex flex-col">
              {["Hardware", "Periféricos", "Games", "Computadores", "Celular & Smartphone", "TV", "Áudio"].map((item) => (
                <button
                  key={item}
                  className="px-6 py-4 text-sm font-bold border-b border-border hover:bg-muted flex items-center justify-between"
                  onClick={() => setMobileMenu(false)}
                >
                  {item} <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* ═══ HERO BANNER & CATEGORIES ═══ */}
      {isHome && (
        <section className="relative">
          {/* Banner */}
          <div className="relative h-[300px] md:h-[450px] overflow-hidden bg-background">
            {HERO_SLIDES.map((slide, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-700 ${i === heroIndex ? "opacity-100" : "opacity-0 pointer-events-none"}`}
              >
                <img src={slide.image} alt={slide.tag} className="h-full w-full object-cover" crossOrigin="anonymous" />
                <div className="absolute inset-0 bg-black/10" />
              </div>
            ))}

            {/* Navigation arrows */}
            <button
              onClick={() => setHeroIndex((i) => (i - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10 text-white"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            <button
              onClick={() => setHeroIndex((i) => (i + 1) % HERO_SLIDES.length)}
              className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center hover:bg-black/50 transition-colors z-10 text-white"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          {/* Categories Floating Cards */}
          <div className="container mx-auto px-4 -mt-10 md:-mt-16 relative z-20">
            <div className="bg-white p-6 rounded-lg shadow-xl border border-border overflow-x-auto no-scrollbar">
              <div className="flex items-start gap-4 md:gap-8 min-w-max justify-center">
                {DEPT_ICONS.map(({ img, label }) => (
                  <button key={label} className="group flex flex-col items-center gap-2 w-20 md:w-24">
                    <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-white border border-[#E0E0E0] flex items-center justify-center group-hover:border-[#FF6500] transition-all p-2 overflow-hidden shadow-sm">
                      <img 
                        src={img} 
                        alt={label} 
                        loading="lazy" 
                        width={80} 
                        height={80} 
                        className="h-full w-full object-contain group-hover:scale-110 transition-transform" 
                        crossOrigin="anonymous" 
                      />
                    </div>
                    <span className="text-[10px] font-black text-[#42464D] text-center uppercase tracking-tighter leading-tight whitespace-normal">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FLASH DEALS WITH COUNTDOWN ═══ */}
      {isHome && promoProducts.length > 0 && (
        <section className="bg-gradient-to-r from-[#FF6500] to-[#E55A00] border-y border-white/10">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white italic tracking-tight">OFERTA <span className="text-white/80">NINJA</span></h2>
                  <p className="text-xs font-bold text-white/90">OS MELHORES PREÇOS, TODO DIA!</p>
                </div>
              </div>
              {/* Countdown */}
              <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 backdrop-blur-sm">
                <Clock className="h-5 w-5 text-white" />
                <span className="text-xs font-black text-white mr-1 uppercase">Termina em:</span>
                {[
                  { v: countdown.d, l: "D" },
                  { v: countdown.h, l: "H" },
                  { v: countdown.m, l: "M" },
                  { v: countdown.s, l: "S" },
                ].map(({ v, l }) => (
                  <div key={l} className="bg-white rounded px-2 py-1 text-center min-w-[40px]">
                    <span className="text-base font-black text-[#FF6500]">{pad(v)}</span>
                    <span className="text-[8px] font-black text-[#FF6500]/70 ml-0.5">{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {promoProducts.slice(0, 5).map((product, i) => (
                <ProductCard key={product.id} product={product} addItem={addItem} index={i} showDiscount />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ BEST SELLERS ═══ */}
      {isHome && bestSellers.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Mais Vendidos</h2>
                <p className="text-xs text-muted-foreground">Os favoritos dos nossos clientes</p>
              </div>
            </div>
            <button className="text-sm text-primary font-semibold flex items-center gap-1 hover:gap-2 transition-all">
              Ver todos <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {bestSellers.slice(0, 8).map((product, i) => (
              <ProductCard key={product.id} product={product} addItem={addItem} index={i} showRating />
            ))}
          </div>
        </section>
      )}

      {/* ═══ ALL PRODUCTS ═══ */}
      <section id="products" className="container mx-auto px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {selectedCategory ? categories.find((c) => c.id === selectedCategory)?.name : searchQuery ? `Resultados para "${searchQuery}"` : "Todos os Produtos"}
              </h2>
              <p className="text-xs text-muted-foreground">{filtered.length} produtos encontrados</p>
            </div>
          </div>
          {/* Category filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                !selectedCategory
                  ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_-3px_hsl(142_71%_45%_/_0.4)]"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              Todos
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => { setSelectedCategory(c.id); setSearchQuery(""); }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  selectedCategory === c.id
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_-3px_hsl(142_71%_45%_/_0.4)]"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} addItem={addItem} index={i} showDiscount />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="h-20 w-20 mx-auto mb-6 rounded-2xl bg-card border border-border flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mb-6">Tente outra categoria ou busca diferente</p>
            <Button variant="outline" className="rounded-xl" onClick={() => { setSelectedCategory(null); setSearchQuery(""); }}>
              Ver todos os produtos
            </Button>
          </div>
        )}
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      {isHome && (
        <section className="bg-card border-y border-border/50">
          <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold text-foreground mb-2">O que nossos clientes dizem</h2>
              <p className="text-sm text-muted-foreground">+10.000 clientes satisfeitos em todo o Brasil</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {REVIEWS.map((r, i) => (
                <div
                  key={i}
                  className="bg-background border border-border/50 rounded-2xl p-6 hover:border-primary/30 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 text-primary fill-primary" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground mb-4 leading-relaxed">"{r.text}"</p>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">{r.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ TRUST BENEFITS ═══ */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: Truck, title: "Entrega Rápida", desc: "Para todo o Brasil" },
            { icon: Shield, title: "Compra Segura", desc: "Dados protegidos" },
            { icon: Award, title: "Garantia", desc: "Todos os produtos" },
            { icon: CreditCard, title: "Parcele em 12x", desc: "Sem juros" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      {isHome && (
        <section className="bg-gradient-to-r from-primary/10 via-card to-primary/10 border-y border-border/50">
          <div className="container mx-auto px-4 py-14">
            <div className="max-w-xl mx-auto text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">Fique por dentro das novidades</h2>
              <p className="text-sm text-muted-foreground mb-6">Receba ofertas exclusivas e lançamentos em primeira mão.</p>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input
                  placeholder="Seu melhor e-mail"
                  className="flex-1 h-11 rounded-xl bg-background border-border/50 focus:border-primary"
                />
                <Button className="rounded-xl h-11 px-6 font-bold shadow-[0_0_20px_-5px_hsl(142_71%_45%_/_0.3)]">
                  Inscrever
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ FOOTER ═══ */}
      <footer className="bg-card border-t border-border/50">
        <div className="container mx-auto px-4 py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-[0_0_15px_hsl(142_71%_45%_/_0.3)]">
                  <Zap className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-lg font-extrabold text-foreground">
                  Smart<span className="text-primary">Cell</span>
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A melhor loja de tecnologia do Brasil. Qualidade, preço justo e entrega garantida.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Atendimento</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">Central de Ajuda</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Trocas e Devoluções</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Fale Conosco</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Institucional</h4>
              <ul className="space-y-2.5 text-xs text-muted-foreground">
                <li className="hover:text-primary cursor-pointer transition-colors">Sobre nós</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Políticas de Privacidade</li>
                <li className="hover:text-primary cursor-pointer transition-colors">Termos de Uso</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground mb-4">Formas de Pagamento</h4>
              <div className="flex flex-wrap gap-2">
                {["Visa", "Master", "PIX", "Boleto"].map((p) => (
                  <span key={p} className="text-[10px] font-semibold text-muted-foreground bg-background border border-border rounded-lg px-3 py-1.5">
                    {p}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground">Ambiente seguro</span>
              </div>
            </div>
          </div>
          <div className="border-t border-border/50 pt-6 text-center">
            <p className="text-xs text-muted-foreground">© 2026 SmartCell Store. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      {/* ═══ MOBILE FIXED BUY BUTTON ═══ */}
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-background/90 backdrop-blur-xl border-t border-border/50 p-3 z-40">
        <Link to="/cart">
          <Button className="w-full rounded-xl h-12 font-bold text-base shadow-[0_0_25px_-5px_hsl(142_71%_45%_/_0.4)]">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Ver Carrinho {itemCount > 0 && `(${itemCount})`}
          </Button>
        </Link>
      </div>
    </div>
  );
};

/* ═════════════ PRODUCT CARD ═════════════ */

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
  const rating = 4.5 + (index % 5) * 0.1;

  return (
    <div
      className="group bg-white border border-[#E0E0E0] rounded-sm overflow-hidden hover:shadow-lg transition-all duration-300 animate-fade-in flex flex-col"
      style={{ animationDelay: `${index * 60}ms`, opacity: 0, animationFillMode: "forwards" }}
    >
      {/* Image */}
      <div className="relative aspect-square p-4 flex items-center justify-center overflow-hidden">
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="max-h-full max-w-full object-contain transition-transform duration-500 group-hover:scale-110" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package className="h-14 w-14 text-muted-foreground/15" />
          </div>
        )}

        {/* Discount Badge */}
        {showDiscount && hasPromo && (
          <div className="absolute top-2 left-2 bg-[#FF6500] text-white text-[10px] font-black px-2 py-1 rounded-sm">
            {discount}% OFF
          </div>
        )}

        {/* Wishlist */}
        <button className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white shadow-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:text-primary">
          <Heart className="h-5 w-5" />
        </button>
      </div>

      {/* Info */}
      <div className="p-4 pt-0 flex flex-col flex-1">
        <h3 className="text-sm font-bold text-[#42464D] line-clamp-2 leading-tight mb-2 min-h-[2.5rem] group-hover:text-secondary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1 mb-2">
          {Array.from({ length: 5 }).map((_, j) => (
            <Star key={j} className={`h-3 w-3 ${j < 4 ? "text-[#FFB800] fill-[#FFB800]" : "text-[#E0E0E0] fill-[#E0E0E0]"}`} />
          ))}
          <span className="text-[10px] text-muted-foreground font-bold">(120)</span>
        </div>

        <div className="mt-auto">
          {hasPromo && (
            <span className="text-xs text-muted-foreground line-through block font-medium">
              R$ {Number(product.price).toFixed(2)}
            </span>
          )}
          <p className="text-xl font-black text-[#FF6500]">
            R$ {Number(price).toFixed(2)}
          </p>
          <p className="text-[10px] font-bold text-[#42464D] mb-4">
            À vista no <span className="text-secondary font-black">PIX</span>
          </p>
          
          <Button
            className="w-full bg-secondary hover:bg-secondary/90 text-white font-black text-xs h-10 rounded-sm uppercase tracking-wider gap-2"
            disabled={product.stock <= 0}
            onClick={(e) => { e.stopPropagation(); addItem(product); }}
          >
            <ShoppingCart className="h-4 w-4" />
            COMPRAR
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StorePage;
