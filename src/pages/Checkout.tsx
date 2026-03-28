import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Zap, CreditCard, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Enums } from "@/integrations/supabase/types";

const SHIPPING_RATES: Record<string, number> = {
  sudeste: 15, sul: 20, nordeste: 25, norte: 30, centro_oeste: 22,
};

const STATES: Record<string, string> = {
  AC: "norte", AL: "nordeste", AM: "norte", AP: "norte", BA: "nordeste",
  CE: "nordeste", DF: "centro_oeste", ES: "sudeste", GO: "centro_oeste",
  MA: "nordeste", MG: "sudeste", MS: "centro_oeste", MT: "centro_oeste",
  PA: "norte", PB: "nordeste", PE: "nordeste", PI: "nordeste", PR: "sul",
  RJ: "sudeste", RN: "nordeste", RO: "norte", RR: "norte", RS: "sul",
  SC: "sul", SE: "nordeste", SP: "sudeste", TO: "norte",
};

const CheckoutPage = () => {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [deliveryType, setDeliveryType] = useState<Enums<"delivery_type">>("retirada");
  const [form, setForm] = useState({
    customer_name: "", phone: "", address: "", city: "", state: "", zip_code: "",
  });

  const shippingCost = deliveryType === "envio" && form.state
    ? SHIPPING_RATES[STATES[form.state] ?? "sudeste"] ?? 20
    : 0;

  const grandTotal = total + shippingCost;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Carrinho vazio");
    if (deliveryType === "envio" && (!form.address || !form.city || !form.state || !form.zip_code)) {
      return toast.error("Preencha o endereço completo");
    }

    setLoading(true);

    const { data: order, error: orderError } = await supabase.from("orders").insert({
      customer_name: form.customer_name,
      phone: form.phone,
      address: deliveryType === "envio" ? form.address : null,
      city: deliveryType === "envio" ? form.city : null,
      state: deliveryType === "envio" ? form.state : null,
      zip_code: deliveryType === "envio" ? form.zip_code : null,
      delivery_type: deliveryType,
      shipping_cost: shippingCost,
      total: grandTotal,
    }).select().single();

    if (orderError || !order) {
      setLoading(false);
      return toast.error("Erro ao criar pedido");
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      product_name: item.product.name,
      quantity: item.quantity,
      unit_price: Number(item.product.promotional_price ?? item.product.price),
    }));

    const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
    setLoading(false);

    if (itemsError) return toast.error("Erro ao salvar itens");

    clearCart();
    setSuccess(true);
    toast.success("Pedido realizado com sucesso!");
  };

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4">
        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center animate-fade-in">
          <CheckCircle className="h-12 w-12 text-primary" />
        </div>
        <div className="text-center animate-fade-in" style={{ animationDelay: "200ms" }}>
          <h2 className="text-3xl font-bold text-foreground mb-2">Pedido Confirmado!</h2>
          <p className="text-muted-foreground">Entraremos em contato em breve com os detalhes.</p>
        </div>
        <Link to="/"><Button size="lg" className="rounded-full px-8 animate-fade-in" style={{ animationDelay: "400ms" }}>Voltar à Loja</Button></Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl text-muted-foreground">Carrinho vazio</p>
        <Link to="/"><Button className="rounded-full">Voltar à Loja</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link to="/cart">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">Checkout</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Compra segura</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 py-8 md:py-12 max-w-5xl">
        <form onSubmit={handleSubmit}>
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Info */}
              <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in">
                <h2 className="text-lg font-bold text-foreground">Dados Pessoais</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Nome completo</Label>
                    <Input
                      className="bg-secondary border-border/50 rounded-xl h-12"
                      value={form.customer_name}
                      onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground mb-2 block">Telefone</Label>
                    <Input
                      className="bg-secondary border-border/50 rounded-xl h-12"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery */}
              <div className="glass-card rounded-2xl p-6 space-y-5 animate-fade-in" style={{ animationDelay: "100ms" }}>
                <h2 className="text-lg font-bold text-foreground">Entrega</h2>
                <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as Enums<"delivery_type">)}>
                  <label
                    htmlFor="retirada"
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-colors ${
                      deliveryType === "retirada" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent"
                    }`}
                  >
                    <RadioGroupItem value="retirada" id="retirada" />
                    <div>
                      <p className="font-medium text-foreground">Retirar na loja</p>
                      <p className="text-sm text-muted-foreground">Grátis</p>
                    </div>
                  </label>
                  <label
                    htmlFor="envio"
                    className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer border transition-colors ${
                      deliveryType === "envio" ? "border-primary bg-primary/5" : "border-border/50 hover:bg-accent"
                    }`}
                  >
                    <RadioGroupItem value="envio" id="envio" />
                    <div>
                      <p className="font-medium text-foreground">Envio para todo o Brasil</p>
                      <p className="text-sm text-muted-foreground">A partir de R$ 15,00</p>
                    </div>
                  </label>
                </RadioGroup>

                {deliveryType === "envio" && (
                  <div className="space-y-4 pt-4 border-t border-border/50 animate-fade-in">
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">CEP</Label>
                      <Input className="bg-secondary border-border/50 rounded-xl h-12" value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} required placeholder="00000-000" />
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground mb-2 block">Endereço</Label>
                      <Input className="bg-secondary border-border/50 rounded-xl h-12" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Cidade</Label>
                        <Input className="bg-secondary border-border/50 rounded-xl h-12" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                      </div>
                      <div>
                        <Label className="text-sm text-muted-foreground mb-2 block">Estado</Label>
                        <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                          <SelectTrigger className="bg-secondary border-border/50 rounded-xl h-12">
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(STATES).map((uf) => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="glass-card rounded-2xl p-6 space-y-4 animate-fade-in" style={{ animationDelay: "200ms" }}>
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold text-foreground">Pagamento</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                  Opções de pagamento (PIX e Cartão) serão disponibilizadas em breve. Após o pedido, entraremos em contato para combinar o pagamento.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="glass-card rounded-2xl p-6 space-y-6 animate-fade-in" style={{ animationDelay: "150ms" }}>
                <h2 className="text-lg font-bold text-foreground">Resumo</h2>
                <div className="space-y-3">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground truncate pr-4">{product.name} ×{quantity}</span>
                      <span className="text-foreground font-medium flex-shrink-0">
                        R$ {(Number(product.promotional_price ?? product.price) * quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-border/50 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">R$ {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Frete</span>
                    <span className="text-foreground">{shippingCost > 0 ? `R$ ${shippingCost.toFixed(2)}` : "Grátis"}</span>
                  </div>
                </div>
                <div className="border-t border-border/50 pt-4">
                  <div className="flex justify-between text-xl font-bold text-foreground">
                    <span>Total</span>
                    <span>R$ {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full rounded-full font-semibold text-base py-6"
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Confirmar Pedido"}
                </Button>
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Lock className="h-3 w-3" />
                  <span>Seus dados estão protegidos</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
