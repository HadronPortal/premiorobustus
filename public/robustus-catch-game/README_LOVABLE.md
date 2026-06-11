# Como importar o jogo da cesta RobustUS no Lovable

Importante: nao peca para o Lovable recriar o jogo. Ele deve copiar estes arquivos e embutir o jogo pronto.

## Arquivos

Copie a pasta `robustus-catch-game` inteira para:

```text
public/robustus-catch-game/
```

Dentro dela devem ficar estes arquivos:

```text
index.html
styles.css
game.js
robustus-logo.png
start-dog.png
start-cat.png
dog-basket-repaired.png
cat-basket-clean.png
package-cao-filhote.png
package-cao-mini.png
package-cao-adulto.png
package-gato-castrado.png
package-gato-adulto.png
BASKETCATCHER-LICENSE.txt
```

## Rota React

Crie uma pagina, por exemplo:

```text
src/pages/JogoCesta.tsx
```

Com este conteudo:

```tsx
export default function JogoCesta() {
  return (
    <main style={{ width: "100vw", height: "100dvh", overflow: "hidden", background: "#004fb6" }}>
      <iframe
        title="Desafio Pet RobustUS"
        src="/robustus-catch-game/index.html?v=20260611-score-rules"
        style={{ width: "100%", height: "100%", border: 0, display: "block" }}
        allow="fullscreen"
      />
    </main>
  );
}
```

Depois registre a rota no app, mantendo o jogo de quebra-cabeca/memoria existente. Exemplo:

```tsx
<Route path="/jogo-cesta" element={<JogoCesta />} />
```

## Prompt curto para o Lovable

```text
Nao recrie o jogo da cesta. Use exatamente os arquivos enviados na pasta robustus-catch-game.

Copie a pasta robustus-catch-game para public/robustus-catch-game/.
Crie uma pagina/rota chamada /jogo-cesta que renderiza um iframe fullscreen apontando para:
/robustus-catch-game/index.html?v=20260611-score-rules

Mantenha o jogo de quebra-cabeca/memoria existente sem apagar nem alterar.
Adicione acesso aos dois jogos na aplicacao:
- Quebra-cabeca/memoria
- Jogo da cesta RobustUS

Nao altere a logica interna do jogo da cesta.
Nao reescreva game.js.
Nao substitua os assets.
```

## Regras ja implementadas no jogo

- Produto normal do pet escolhido: +5 pontos
- Produto Life Special do pet escolhido: +10 pontos
- Produto normal do outro pet: -5 pontos
- Produto Life Special do outro pet: -10 pontos
- Pontuacao minima: 0
- Pontuacao maxima: 250
- Funciona em mobile e tablet em tela cheia

