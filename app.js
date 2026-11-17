// ================================
// FLASHCARDS STUDY APP
// ================================

const STORAGE_KEY = "flashcardsApp_v1";

let state = {
  decks: [],
  cardsByDeckId: {},
  activeDeckId: null,
};

let cardIndex = 0;
let isFlipped = false;
let visibleCardIds = [];

// DOM Elements
const deckList = document.getElementById("deckList");
const deckTitle = document.getElementById("deckTitle");
const cardContent = document.getElementById("cardContent");
const flashcard = document.getElementById("flashcard");
const progress = document.getElementById("progress");
const searchInput = document.getElementById("searchInput");

const newDeckBtn = document.getElementById("newDeckBtn");
const newCardBtn = document.getElementById("newCardBtn");
const flipBtn = document.getElementById("flipBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const shuffleBtn = document.getElementById("shuffleBtn");

// Generate unique IDs
function createId() {
  return crypto.randomUUID();
}

// Save data
// function saveData() {
//   try {
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
//   } catch (error) {
//     alert("Unable to save data in this browser.");
//     console.error(error);
//   }
// }

function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: 1 }));
  } catch (error) {
    alert("Unable to save data in this browser.");
    console.error(error);
  }
}
// Load data
function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));

    if (
      saved &&
      saved.version === 1 &&
      Array.isArray(saved.decks) &&
      saved.cardsByDeckId &&
      typeof saved.cardsByDeckId === "object" &&
      !Array.isArray(saved.cardsByDeckId)
    ) {
      state = {
        decks: saved.decks.filter(
          (d) => d && typeof d.id === "string" && typeof d.name === "string",
        ),
        cardsByDeckId: saved.cardsByDeckId,
        activeDeckId: saved.activeDeckId,
      };
    }
  } catch (error) {
    console.warn("Could not load saved data.", error);
  }

  if (!state.decks.some((d) => d.id === state.activeDeckId)) {
    state.activeDeckId = state.decks[0]?.id || null;
  }
}

// Get active deck
function getActiveDeck() {
  return state.decks.find((deck) => deck.id === state.activeDeckId);
}

// Get active deck cards
function getCards() {
  return state.cardsByDeckId[state.activeDeckId] || [];
}

// Filter cards without changing saved data
function getVisibleCards() {
  const keyword = searchInput.value.trim().toLowerCase();

  return getCards().filter(
    (card) =>
      card.front.toLowerCase().includes(keyword) ||
      card.back.toLowerCase().includes(keyword),
  );
}

// Render everything
function render() {
  renderDecks();
  renderStudyCard();
}

// Display decks
function renderDecks() {
  deckList.replaceChildren();

  if (state.decks.length === 0) {
    const message = document.createElement("p");
    message.textContent = "No decks yet. Create your first deck!";
    deckList.append(message);
    return;
  }

  state.decks.forEach((deck) => {
    const item = document.createElement("div");
    item.className = "deck-item";
    item.classList.toggle("active", deck.id === state.activeDeckId);

    const selectButton = document.createElement("button");
    selectButton.textContent = deck.name;
    selectButton.style.width = "100%";
    selectButton.style.textAlign = "left";

    selectButton.addEventListener("click", () => {
      state.activeDeckId = deck.id;
      cardIndex = 0;
      searchInput.value = "";
      isFlipped = false;
      saveData();
      render();
    });

    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.setAttribute("aria-label", "Edit " + deck.name);

    editButton.addEventListener("click", () => {
      const name = prompt("Enter new deck name:", deck.name);

      if (name && name.trim()) {
        deck.name = name.trim();
        saveData();
        render();
      }
    });

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "Delete";
    deleteButton.setAttribute("aria-label", "Delete " + deck.name);

    deleteButton.addEventListener("click", () => {
      if (confirm("Delete this deck and all its cards?")) {
        state.decks = state.decks.filter((d) => d.id !== deck.id);

        delete state.cardsByDeckId[deck.id];

        if (state.activeDeckId === deck.id) {
          state.activeDeckId = state.decks[0]?.id || null;
        }

        cardIndex = 0;
        isFlipped = false;
        saveData();
        render();
      }
    });

    item.append(selectButton, editButton, deleteButton);
    deckList.append(item);
  });
}

// Display current flashcard
function renderStudyCard() {
  const deck = getActiveDeck();

  if (!deck) {
    deckTitle.textContent = "Select a Deck";
    cardContent.textContent = "Create a deck to get started!";
    progress.textContent = "0 / 0";
    visibleCardIds = [];
    return;
  }

  deckTitle.textContent = deck.name;

  const cards = getVisibleCards();
  visibleCardIds = cards.map((card) => card.id);

  if (cardIndex >= cards.length) {
    cardIndex = 0;
  }

  if (cards.length === 0) {
    cardContent.textContent = getCards().length
      ? "No cards found. Try another search!"
      : "No cards yet. Add your first flashcard!";
    progress.textContent = "0 / 0";
    isFlipped = false;
    flashcard.classList.remove("is-flipped");
    return;
  }

  const card = cards[cardIndex];

  cardContent.textContent = isFlipped ? card.back : card.front;

  flashcard.classList.toggle("is-flipped", isFlipped);

  progress.textContent = `${cardIndex + 1} / ${cards.length}`;
}

// Create deck
newDeckBtn.addEventListener("click", () => {
  const name = prompt("Enter deck name:");

  if (!name || !name.trim()) return;

  const deck = {
    id: createId(),
    name: name.trim(),
    createdAt: Date.now(),
  };

  state.decks.push(deck);
  state.cardsByDeckId[deck.id] = [];
  state.activeDeckId = deck.id;

  cardIndex = 0;
  isFlipped = false;

  saveData();
  render();
});

// Create flashcard
newCardBtn.addEventListener("click", () => {
  if (!getActiveDeck()) {
    alert("Please create a deck first!");
    return;
  }

  const front = prompt("Enter the question:");
  if (front === null || !front.trim()) return;

  const back = prompt("Enter the answer:");
  if (back === null || !back.trim()) return;

  const card = {
    id: createId(),
    front: front.trim(),
    back: back.trim(),
    updatedAt: Date.now(),
  };

  getCards().push(card);

  searchInput.value = "";
  cardIndex = getCards().length - 1;
  isFlipped = false;

  saveData();
  render();
});

// Flip card
function flipCard() {
  if (!visibleCardIds.length) return;

  isFlipped = !isFlipped;
  renderStudyCard();
}

flipBtn.addEventListener("click", flipCard);
flashcard.addEventListener("click", flipCard);

// Next card
nextBtn.addEventListener("click", () => {
  if (!visibleCardIds.length) return;

  cardIndex = (cardIndex + 1) % visibleCardIds.length;
  isFlipped = false;
  renderStudyCard();
});

// Previous card
prevBtn.addEventListener("click", () => {
  if (!visibleCardIds.length) return;

  cardIndex = (cardIndex - 1 + visibleCardIds.length) % visibleCardIds.length;

  isFlipped = false;
  renderStudyCard();
});

// Shuffle cards
shuffleBtn.addEventListener("click", () => {
  if (!visibleCardIds.length) return;

  const cards = getCards();
  const visible = new Set(visibleCardIds);

  const shuffled = cards.filter((card) => visible.has(card.id));

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const remaining = cards.filter((card) => !visible.has(card.id));

  state.cardsByDeckId[state.activeDeckId] = [...shuffled, ...remaining];

  cardIndex = 0;
  isFlipped = false;

  saveData();
  renderStudyCard();
});

// Search cards
searchInput.addEventListener("input", () => {
  cardIndex = 0;
  isFlipped = false;
  renderStudyCard();
});

// Edit and delete current card
const editCardBtn = document.createElement("button");
editCardBtn.textContent = "Edit Card";
editCardBtn.addEventListener("click", () => {
  const card = getCards().find((c) => c.id === visibleCardIds[cardIndex]);

  if (!card) return;

  const front = prompt("Edit question:", card.front);
  if (front === null || !front.trim()) return;

  const back = prompt("Edit answer:", card.back);
  if (back === null || !back.trim()) return;

  card.front = front.trim();
  card.back = back.trim();
  card.updatedAt = Date.now();

  isFlipped = false;
  saveData();
  renderStudyCard();
});

const deleteCardBtn = document.createElement("button");
deleteCardBtn.textContent = "Delete Card";

deleteCardBtn.addEventListener("click", () => {
  const cardId = visibleCardIds[cardIndex];

  if (!cardId) return;

  if (confirm("Delete this flashcard?")) {
    state.cardsByDeckId[state.activeDeckId] = getCards().filter(
      (c) => c.id !== cardId,
    );

    cardIndex = 0;
    isFlipped = false;

    saveData();
    render();
  }
});

document.querySelector(".controls").append(editCardBtn, deleteCardBtn);

// Keyboard shortcuts
document.addEventListener("keydown", (event) => {
  if (
    event.target.matches("input, textarea") ||
    event.target.isContentEditable ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;

  if (event.code === "Space") {
    event.preventDefault();
    flipCard();
  }

  if (event.key === "ArrowRight") {
    nextBtn.click();
  }

  if (event.key === "ArrowLeft") {
    prevBtn.click();
  }
});

// Start app
loadData();
saveData();
render();
