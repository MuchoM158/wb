let roomId = "";
let playerId = "";

function joinRoom() {
  roomId = document.getElementById("room-id").value.trim();
  if (!roomId) {
    alert("Ingresa un ID de sala válido");
    return;
  }

  playerId = "jugador" + Math.floor(Math.random() * 10000);
  document.getElementById("game").style.display = "block";

  firebase.database().ref(`salas/${roomId}/jugadores/${playerId}`).set({
    conectado: true,
    timestamp: Date.now()
  });

  firebase.database().ref(`salas/${roomId}/estado`).on("value", (snapshot) => {
    const data = snapshot.val();
    if (data) {
      document.getElementById("status").textContent = data.mensaje || "";

      if (data.playerHand) {
        renderHand(data.playerHand, "player-cards", false);
        document.getElementById("player-score").textContent =
          `Puntos: ${calcularPuntaje(data.playerHand)}`;
      }

      if (data.dealerHand) {
        const ocultar = !data.terminado;
        renderHand(data.dealerHand, "dealer-cards", ocultar);
        document.getElementById("dealer-score").textContent =
          data.terminado ? `Puntos: ${calcularPuntaje(data.dealerHand)}` : "";
      }
    }
  });
}

function crearMazo() {
  const palos = ['♠', '♣', '♥', '♦'];
  const valores = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  let mazo = [];

  palos.forEach(palo => {
    valores.forEach(valor => {
      mazo.push({ valor, palo });
    });
  });

  for (let i = mazo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mazo[i], mazo[j]] = [mazo[j], mazo[i]];
  }

  return mazo;
}

function calcularPuntaje(mano) {
  let total = 0;
  let ases = 0;

  mano.forEach(carta => {
    if (carta.valor === 'A') {
      ases++;
      total += 11;
    } else if (['K', 'Q', 'J'].includes(carta.valor)) {
      total += 10;
    } else {
      total += parseInt(carta.valor);
    }
  });

  while (total > 21 && ases > 0) {
    total -= 10;
    ases--;
  }

  return total;
}

function startGame() {
  const deck = crearMazo();
  const playerHand = [deck.pop(), deck.pop()];
  const dealerHand = [deck.pop(), deck.pop()];

  firebase.database().ref(`salas/${roomId}/estado`).set({
    deck,
    playerHand,
    dealerHand,
    turno: playerId,
    mensaje: "¡Juego iniciado!",
    terminado: false
  });
}

function renderHand(hand, containerId, ocultar = false) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  hand.forEach((card, index) => {
    const div = document.createElement("div");
    div.className = "card";

    if (ocultar && index === 1) {
      div.classList.add("back");
      div.textContent = "🂠";
    } else {
      div.textContent = `${card.valor}${card.palo}`;
    }

    container.appendChild(div);
  });
}

function hit() {
  const estadoRef = firebase.database().ref(`salas/${roomId}/estado`);

  estadoRef.once("value").then((snapshot) => {
    const estado = snapshot.val();
    if (estado.turno !== playerId || estado.terminado) return;

    const deck = estado.deck || [];
    const playerHand = estado.playerHand || [];

    if (deck.length === 0) {
      alert("No quedan cartas");
      return;
    }

    const nuevaCarta = deck.pop();
    playerHand.push(nuevaCarta);

    const nuevoPuntaje = calcularPuntaje(playerHand);

    let mensaje = `Carta recibida: ${nuevaCarta.valor}${nuevaCarta.palo}`;
    let terminado = false;

    if (nuevoPuntaje > 21) {
      mensaje = "¡Te pasaste! Perdiste.";
      terminado = true;
    }

    estadoRef.update({
      deck,
      playerHand,
      mensaje,
      terminado
    });
  });
}

function stand() {
  const estadoRef = firebase.database().ref(`salas/${roomId}/estado`);

  estadoRef.once("value").then((snapshot) => {
    const estado = snapshot.val();
    if (!estado || estado.turno !== playerId || estado.terminado) return;

    let dealerHand = estado.dealerHand || [];
    let deck = estado.deck || [];

    while (calcularPuntaje(dealerHand) < 17 && deck.length > 0) {
      dealerHand.push(deck.pop());
    }

    const dealerScore = calcularPuntaje(dealerHand);
    const playerScore = calcularPuntaje(estado.playerHand);
    let mensaje = "";

    if (dealerScore > 21 || playerScore > dealerScore) {
      mensaje = "¡Ganaste!";
    } else if (dealerScore > playerScore) {
      mensaje = "Perdiste.";
    } else {
      mensaje = "Empate.";
    }

    estadoRef.update({
      dealerHand,
      deck,
      mensaje,
      terminado: true
    });
  });
}

function reiniciarJuego() {
  const estadoRef = firebase.database().ref(`salas/${roomId}/estado`);

  estadoRef.once("value").then((snapshot) => {
    const estado = snapshot.val();
    if (!estado || !estado.terminado) {
      alert("La partida aún está en curso.");
      return;
    }

    const deck = crearMazo();
    const playerHand = [deck.pop(), deck.pop()];
    const dealerHand = [deck.pop(), deck.pop()];

    estadoRef.set({
      deck,
      playerHand,
      dealerHand,
      turno: playerId, // empieza quien pulsó "Revancha"
      mensaje: "¡Nueva ronda iniciada!",
      terminado: false
    });
  });
}
