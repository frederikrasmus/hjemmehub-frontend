import { api } from '../api/index.js';
import { openModal, closeModal } from '../utils/modal.js';
import { state } from '../main.js'; // Tilgå global state om nødvendigt

// Shopping List Functions
export async function loadShoppingListData() {
  const container = document.getElementById("shopping-list");
  container.innerHTML = `
    <div class="view-header" style="margin-bottom: var(--spacing-md);">
        <h3>Generer Indkøbsliste</h3>
        <div>
            <label for="start-date">Fra:</label>
            <input type="date" id="start-date" value="${new Date().toISOString().split('T')[0]}" style="margin-right: var(--spacing-xs);">
            <label for="end-date">Til:</label>
            <input type="date" id="end-date" value="${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}">
            <button class="btn-primary" id="generate-shopping-btn" style="margin-left: var(--spacing-sm);">Generer Liste</button>
        </div>
    </div>
    <div id="shopping-list-display">
        <div class="loading">Indlæser indkøbsliste...</div>
    </div>
  `;

  // Tilføj event listener til den dynamisk genererede knap
  document.getElementById("generate-shopping-btn").addEventListener("click", generateShoppingList);

  // Forsøg at generere en liste for standardperioden ved indlæsning
  await generateShoppingList();
}

async function generateShoppingList() {
  const displayContainer = document.getElementById("shopping-list-display");
  displayContainer.innerHTML = '<div class="loading">Genererer indkøbsliste...</div>';

  const startDate = document.getElementById("start-date").value;
  const endDate = document.getElementById("end-date").value;

  try {
    // Korrekt endpoint og parametre for GET
    const items = await api.get(`/shopping-list?start=${startDate}&slut=${endDate}`);
    state.shoppingList = items; // Opdater global state
    renderShoppingList(items);
  } catch (error) {
    console.error("Fejl ved generering af indkøbsliste:", error);
    displayContainer.innerHTML =
      '<div class="empty-state"><h3>Kunne ikke generere indkøbsliste</h3><p>Tjek at backend kører og at datoer er gyldige. Fejl: ' + error.message + '</p></div>';
    //alert("Kunne ikke generere indkøbsliste. Tjek at backend kører.");
  }
}

function renderShoppingList(items) {
  const displayContainer = document.getElementById("shopping-list-display");

  if (items.length === 0) {
    displayContainer.innerHTML =
      '<div class="empty-state"><h3>Indkøbslisten er tom</h3><p>Ingen måltider planlagt for den valgte periode, eller ingen ingredienser tilknyttet.</p></div>';
    return;
  }

  // Group by unit (som du har i backend)
  const itemsByUnit = {};
  items.forEach((item) => {
    if (!itemsByUnit[item.unit]) {
      itemsByUnit[item.unit] = [];
    }
    itemsByUnit[item.unit].push(item);
  });


  const listHtml = Object.entries(itemsByUnit)
    .map(
      ([unit, categoryItems]) => `
        <div class="shopping-category">
            <h3>${unit}</h3> <!-- Grupperet efter enhed -->
            ${categoryItems
              .map(
                (item) => `
                <div class="shopping-item" data-ingredient-name="${item.ingredientName}">
                    <input type="checkbox" id="item-${item.ingredientName.replace(/\s/g, '-')}" 
                           onchange="window.toggleShoppingItemFrontend('${item.ingredientName}')">
                    <label for="item-${item.ingredientName.replace(/\s/g, '-')}" class="shopping-item-text">
                        ${item.ingredientName} - ${item.totalQuantity} ${item.unit}
                    </label>
                    <button class="btn-danger btn-small" onclick="window.removeShoppingItemFrontend('${item.ingredientName}')">X</button>
                </div>
            `,
              )
              .join("")}
        </div>
    `,
    )
    .join("");

  displayContainer.innerHTML = `
    ${listHtml}
    <div class="form-actions" style="margin-top: var(--spacing-lg);">
        <button class="btn-secondary" onclick="window.copyShoppingListToClipboard()">Kopier til udklipsholder</button>
    </div>
  `;
}

// Exportér funktioner, der skal kaldes fra main.js eller globale event listeners
export function initShoppingListView() {
  // Event listeners tilføjes i loadShoppingListData, da UI genereres dynamisk
}

// Global toggle (FRONTEND ONLY)
window.toggleShoppingItemFrontend = (ingredientName) => {
    const itemElement = document.querySelector(`.shopping-item[data-ingredient-name="${ingredientName}"] .shopping-item-text`);
    itemElement.classList.toggle('checked');
};

// Global remove (FRONTEND ONLY)
window.removeShoppingItemFrontend = (ingredientName) => {
    const itemElement = document.querySelector(`.shopping-item[data-ingredient-name="${ingredientName}"]`);
    if (itemElement) {
        itemElement.remove();
    }
};

// Global copy to clipboard (FRONTEND ONLY)
window.copyShoppingListToClipboard = () => {
    let listText = "Indkøbsliste:\n\n";
    document.querySelectorAll('.shopping-category').forEach(categoryDiv => {
        const categoryName = categoryDiv.querySelector('h3').textContent;
        listText += `${categoryName}:\n`;
        categoryDiv.querySelectorAll('.shopping-item').forEach(itemDiv => {
            const itemText = itemDiv.querySelector('.shopping-item-text').textContent.trim();
            if (!itemText.startsWith('(')) { // Undgå tomme markeringer
                listText += `- ${itemText}\n`;
            }
        });
        listText += "\n";
    });

    navigator.clipboard.writeText(listText).then(() => {
        alert("Indkøbslisten er kopieret til udklipsholder!");
    }).catch(err => {
        console.error('Kunne ikke kopiere indkøbsliste: ', err);
        alert("Kunne ikke kopiere indkøbsliste.");
    });
};