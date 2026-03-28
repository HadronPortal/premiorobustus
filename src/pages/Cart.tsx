import { useCart } from "@/hooks/useCart";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowLeft, ShoppingBag, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const CartPage = () => {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="h-24 w-24 rounded-full bg-secondary flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Carrinho vazio</h2>
          <p className="text-muted-foreground">Adicione produtos para continuar</p>
        </div>
        <Link to="/"><Button size="lg" className="rounded-full px-8">Explorar Produtos</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Carrinho ({itemCount})</h1>
          </div>
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground hidden sm:inline">SmartCell</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-5xl">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map(({ product, quantity }) => {
              const price = product.promotional_price ?? product.price;
              return (
                <div key={product.id} className="glass-card rounded-2xl p-4 sm:p-6 flex gap-4 sm:gap-6 animate-fade-in">
                  <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-xl bg-secondary/50 flex-shrink-0 overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-lg font-bold text-foreground mt-1">R$ {Number(price).toFixed(2)}</p>
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 bg-secondary rounded-full p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-accent"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-accent"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-destructive/10"
                        onClick={() => removeItem(product.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <h2 className="text-lg font-bold text-foreground">Resumo do Pedido</h2>
              <div className="space-y-3">
                {items.map(({ product, quantity }) => {
                  const price = product.promotional_price ?? product.price;
                  return (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate pr-4">{product.name} ×{quantity}</span>
                      <span className="text-foreground font-medium flex-shrink-0">R$ {(Number(price) * quantity).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-xl font-bold text-foreground">
                  <span>Total</span>
                  <span>R$ {total.toFixed(2)}</span>
                </div>
              </div>
              <Button
                size="lg"
                className="w-full rounded-full font-semibold text-base py-6"
                onClick={() => navigate("/checkout")}
              >
                Finalizar Compra
              </Button>
              <Link to="/" className="block text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
