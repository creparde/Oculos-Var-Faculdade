
/* VISIONGUIDE VR - Anhanguera Antonio Carlos */

"use strict";

const cenas = [
  {
    imagem: "imgBoasVindas",
    titulo: "Bem-vindo",
    descricao: "Campus Virtual Anhanguera Antonio Carlos",
    fala: "Bem-vindo ao Campus Virtual Anhanguera Antonio Carlos, em Belo Horizonte. Esta experiencia foi desenvolvida para promover acessibilidade e inovacao. Gire a cabeca para explorar o ambiente."
  },
  {
    imagem: "imgPortal",
    titulo: "Portal de Entrada",
    descricao: "Entrada principal da unidade",
    fala: "Voce esta no portal de entrada da unidade Anhanguera Antonio Carlos."
  },
  {
    imagem: "imgBiblioteca",
    titulo: "Biblioteca",
    descricao: "Espaco para estudo e pesquisa",
    fala: "Biblioteca. Ambiente destinado a leitura, pesquisa e desenvolvimento do conhecimento."
  },
  {
    imagem: "imgLaboratorio",
    titulo: "Laboratorio",
    descricao: "Tecnologia e inovacao",
    fala: "Laboratorio de informatica. Ambiente destinado as atividades tecnologicas e praticas."
  },
  {
    imagem: "imgSala",
    titulo: "Sala de Aula",
    descricao: "Aprendizagem e desenvolvimento",
    fala: "Sala de aula. Ambiente voltado ao ensino e a aprendizagem."
  },
  {
    imagem: "imgSecretaria",
    titulo: "Secretaria Academica",
    descricao: "Atendimento ao estudante",
    fala: "Secretaria academica. Atendimento e suporte aos estudantes."
  },
  {
    imagem: "imgCantina",
    titulo: "Cantina",
    descricao: "Convivencia e alimentacao",
    fala: "Cantina. Espaco de integracao, convivencia e alimentacao da comunidade academica."
  },
  {
    imagem: "imgEncerramento",
    titulo: "Encerramento",
    descricao: "Obrigado pela visita!",
    fala: "Obrigado por visitar o Campus Virtual Anhanguera Antonio Carlos. Esperamos que esta experiencia tenha sido inspiradora."
  }
];

const PAUSA_APOS_FALA = 4000;

const $ = (id) => document.getElementById(id);

const ceu = $("ceu");
const startScreen = $("startScreen");
const startButton = $("startButton");

let indice = 0;
let timer = null;
let idFala = 0;
let wakeLock = null;
let experienciaIniciada = false;

function cancelarAvanco() {
  clearTimeout(timer);
  timer = null;
}

function atualizarTexto(id, texto) {
  $(id).setAttribute("value", texto);
}

async function manterTelaLigada() {
  try {
    if ("wakeLock" in navigator) {
      if (wakeLock) {
        await wakeLock.release().catch(() => {});
      }

      wakeLock = await navigator.wakeLock.request("screen");

      wakeLock.addEventListener("release", () => {
        wakeLock = null;
      });
    }
  } catch (erro) {
    console.warn("Bloqueio de tela indisponivel:", erro);
  }
}

function falar(texto, aoTerminar) {
  const meuId = ++idFala;

  if (!("speechSynthesis" in window)) {
    console.warn("Sintese de voz nao suportada neste navegador.");
    aoTerminar();
    return;
  }

  window.speechSynthesis.cancel();

  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 0.95;
  fala.pitch = 1;
  fala.volume = 1;

  const vozes = window.speechSynthesis.getVoices();
  const vozPortugues = vozes.find(
    (voz) => /^pt-BR$/i.test(voz.lang)
  ) || vozes.find(
    (voz) => /^pt([-_])/i.test(voz.lang)
  );

  if (vozPortugues) {
    fala.voice = vozPortugues;
  }

  let finalizada = false;

  function finalizar() {
    if (finalizada || meuId !== idFala) return;

    finalizada = true;
    aoTerminar();
  }

  fala.onend = finalizar;

  fala.onerror = (evento) => {
    console.warn("Erro na narracao:", evento.error);
    finalizar();
  };

  window.speechSynthesis.speak(fala);
}

function mostrarCena(novoIndice) {
  cancelarAvanco();

  // Invalida callbacks de falas anteriores.
  idFala++;

  indice = Math.max(
    0,
    Math.min(novoIndice, cenas.length - 1)
  );

  const cena = cenas[indice];
  const imagem = $(cena.imagem);

  if (!imagem) {
    console.error("Imagem nao encontrada:", cena.imagem);
    return;
  }

  ceu.setAttribute("src", `#${cena.imagem}`);

  atualizarTexto("titulo", cena.titulo);
  atualizarTexto("descricao", cena.descricao);
  atualizarTexto(
    "progresso",
    `Cena ${indice + 1} de ${cenas.length}`
  );

  // No encerramento, aguarda a fala sem avancar novamente.
  falar(cena.fala, () => {
    if (indice < cenas.length - 1) {
      timer = setTimeout(() => {
        mostrarCena(indice + 1);
      }, PAUSA_APOS_FALA);
    }
  });
}

function navegar(direcao) {
  mostrarCena(indice + direcao);
}

$("btnProximo").addEventListener("click", () => {
  navegar(1);
});

$("btnAnterior").addEventListener("click", () => {
  navegar(-1);
});

$("btnRepetir").addEventListener("click", () => {
  mostrarCena(indice);
});

startButton.addEventListener("click", async () => {
  if (experienciaIniciada) return;

  experienciaIniciada = true;
  startButton.disabled = true;

  try {
    // Solicita permissao de orientacao em dispositivos compativeis.
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const permissao =
        await DeviceOrientationEvent.requestPermission();

      if (permissao !== "granted") {
        console.warn("Permissao de orientacao nao concedida.");
      }
    }
  } catch (erro) {
    console.warn("Nao foi possivel solicitar orientacao:", erro);
  }

  await manterTelaLigada();

  startScreen.style.display = "none";
  mostrarCena(0);
});

// Tenta recuperar o bloqueio de tela ao retornar ao aplicativo.
document.addEventListener("visibilitychange", async () => {
  if (
    document.visibilityState === "visible" &&
    experienciaIniciada
  ) {
    await manterTelaLigada();
  }
});

// Carrega vozes quando o navegador disponibiliza a lista.
if ("speechSynthesis" in window) {
  window.speechSynthesis.getVoices();

  window.speechSynthesis.addEventListener(
    "voiceschanged",
    () => window.speechSynthesis.getVoices()
  );
}

/* MODO VR COM TELA DIVIDIDA */

const toggleVR = document.getElementById("toggleVR");
const exitVR = document.getElementById("exitVR");
const stereoOverlay = document.getElementById("stereoOverlay");
const leftEye = document.getElementById("leftEye");
const rightEye = document.getElementById("rightEye");

let stereoActive = false;
let stereoFrame = null;

function desenharTelaDividida() {
  if (!stereoActive) return;

  const scene = document.querySelector("a-scene");
  const source = scene && scene.canvas;

  if (source && source.width > 0 && source.height > 0) {
    [leftEye, rightEye].forEach((canvas) => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = window.devicePixelRatio || 1;

      if (
        canvas.width !== Math.round(width * dpr) ||
        canvas.height !== Math.round(height * dpr)
      ) {
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
      }

      const context = canvas.getContext("2d");

      if (context && width > 0 && height > 0) {
        context.drawImage(
          source,
          0,
          0,
          canvas.width,
          canvas.height
        );
      }
    });
  }

  stereoFrame = requestAnimationFrame(desenharTelaDividida);
}

function entrarNoModoVR() {
  if (!experienciaIniciada) {
    alert("Toque primeiro em INICIAR EXPERIÊNCIA.");
    return;
  }

  stereoActive = true;
  document.body.classList.add("vr-active");

  if (stereoFrame !== null) {
    cancelAnimationFrame(stereoFrame);
  }

  desenharTelaDividida();
}

function sairDoModoVR() {
  stereoActive = false;
  document.body.classList.remove("vr-active");

  if (stereoFrame !== null) {
    cancelAnimationFrame(stereoFrame);
    stereoFrame = null;
  }
}

toggleVR.addEventListener("click", entrarNoModoVR);
exitVR.addEventListener("click", sairDoModoVR);

window.addEventListener("resize", () => {
  if (stereoActive) {
    desenharTelaDividida();
  }
});

