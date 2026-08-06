// Todos os assets usados na versão offline ficam dentro de /public.
// Nada de URLs externas (robustus.com.br etc).

export const OFFLINE_LOGO = "/__l5e/assets-v1/c8fbb8db-df28-4f37-9625-32d0e5e69129/Robustus_Laranja.png";

export const OFFLINE_MEMORY_PRODUCTS = [
  {
    id: 1,
    name: "Cão Filhote",
    img: "/robustus-catch-game/package-cao-filhote.png",
  },
  {
    id: 2,
    name: "Cão Mini",
    img: "/robustus-catch-game/package-cao-mini.png",
  },
  {
    id: 3,
    name: "Cão Adulto",
    img: "/robustus-catch-game/package-cao-adulto.png",
  },
  {
    id: 4,
    name: "Gato Castrado",
    img: "/robustus-catch-game/package-gato-castrado.png",
  },
  {
    id: 5,
    name: "Gato Adulto",
    img: "/robustus-catch-game/package-gato-adulto.png",
  },
];

// Página HTML do jogo da cesta (já é totalmente self-contained dentro de /public).
export const OFFLINE_CATCH_GAME_URL = "/robustus-catch-game/index.html";
