import { useState } from "react";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <CheckCircle className="h-16 w-16 text-green-600" />
        <h2 className="text-2xl font-bold text-foreground">Pedido Realizado!</h2>
        <p className="text-muted-foreground">Entraremos em contato em breve.</p>
        <Link to="/"><Button>Voltar à Loja</Button></Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
        <p className="text-xl text-muted-foreground">Carrinho vazio</p>
        <Link to="/"><Button>Voltar à Loja</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <Link to="/cart"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button></Link>
          <h1 className="text-3xl font-bold text-foreground">Checkout</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Nome completo</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required placeholder="(11) 99999-9999" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Entrega</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={deliveryType} onValueChange={(v) => setDeliveryType(v as Enums<"delivery_type">)}>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="retirada" id="retirada" />
                  <Label htmlFor="retirada">Retirar na loja (grátis)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="envio" id="envio" />
                  <Label htmlFor="envio">Envio para todo o Brasil</Label>
                </div>
              </RadioGroup>

              {deliveryType === "envio" && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <div><Label>CEP</Label><Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} required placeholder="00000-000" /></div>
                  <div><Label>Endereço</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required /></div>
                    <div>
                      <Label>Estado</Label>
                      <Select value={form.state} onValueChange={(v) => setForm({ ...form, state: v })}>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resumo do Pedido</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between text-sm">
                  <span>{product.name} x{quantity}</span>
                  <span>R$ {(Number(product.promotional_price ?? product.price) * quantity).toFixed(2)}</span>
                </div>
              ))}
              {shippingCost > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-border">
                  <span>Frete</span><span>R$ {shippingCost.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-border">
                <span>Total</span><span>R$ {grandTotal.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Pagamento</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Opções de pagamento (PIX e Cartão) serão disponibilizadas em breve. Por enquanto, entre em contato após o pedido.</p>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Processando..." : `Finalizar Pedido - R$ ${grandTotal.toFixed(2)}`}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
