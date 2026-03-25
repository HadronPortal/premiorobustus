import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center gap-4 bg-background">
      <Button className="bg-blue-btn text-blue-btn-foreground hover:bg-blue-btn/90">
        Botão Azul
      </Button>
      <Button className="bg-orange-500 text-white hover:bg-orange-600">
        Botão Laranja
      </Button>
      <Button variant="destructive">
        Botão Vermelho
      </Button>
    </div>
  );
};

export default Index;
