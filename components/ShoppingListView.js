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
  // Sørg for at endDate er i 'YYYY-MM-DD' format, hvis den kommer fra et date input
  const endDate = document.getElementById("end-date").value; 

  try {
    const items = await api.get(`/shopping-list?start=${startDate}&slut=${endDate}`);
    state.shoppingList = items; // Opdater global state
    renderShoppingList(items);
  } catch (error) {
    console.error("Fejl ved generering af indkøbsliste:", error);
    displayContainer.innerHTML =
      '<div class="empty-state"><h3>Kunne ikke generere indkøbsliste</h3><p>Tjek at backend kører og at datoer er gyldige. Fejl: ' + error.message + '</p></div>';
  }
}

function renderShoppingList(items) {
  const displayContainer = document.getElementById("shopping-list-display");

  if (items.length === 0) {
    displayContainer.innerHTML =
      '<div class="empty-state"><h3>Indkøbslisten er tom</h3><p>Ingen måltider planlagt for den valgte periode, eller ingen ingredienser tilknyttet.</p></div>';
    return;
  }

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
                    
                    <label for="item-${item.ingredientName.replace(/\s/g, '-')}" class="shopping-item-text-name">
                        ${item.ingredientName}
                    </label>
                    
                    <input type="number" 
                           class="shopping-item-quantity" 
                           value="${item.totalQuantity}" 
                           step="0.1" 
                           min="0.1" 
                           oninput="window.updateShoppingItemQuantityFrontend(this, '${item.ingredientName}')">
                    
                    <span class="shopping-item-unit">${item.unit}</span>
                    
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
    const itemElement = document.querySelector(`.shopping-item[data-ingredient-name="${ingredientName}"] .shopping-item-text-name`);
    itemElement.classList.toggle('checked');
};

// Global remove (FRONTEND ONLY)
window.removeShoppingItemFrontend = (ingredientName) => {
    const itemElement = document.querySelector(`.shopping-item[data-ingredient-name="${ingredientName}"]`);
    if (itemElement) {
        // Fjerner også fra DOM
        itemElement.remove(); 
        // Opdater state, så elementet ikke dukker op ved en senere render (f.eks. ved mængdeændring)
        state.shoppingList = state.shoppingList.filter(item => item.ingredientName !== ingredientName);
        // Ingen re-render her, medmindre vi vil have en tom kategori til at forsvinde,
        // hvilket kan gøres ved at kalde renderShoppingList(state.shoppingList);
    }
};

// Ny funktion: Global update quantity (FRONTEND ONLY)
window.updateShoppingItemQuantityFrontend = (inputElement, ingredientName) => {
    const newQuantity = parseFloat(inputElement.value);
    if (isNaN(newQuantity) || newQuantity < 0.1) {
        inputElement.value = 0.1; // Sæt en minimumsværdi
        return;
    }

    const itemToUpdate = state.shoppingList.find(item => item.ingredientName === ingredientName);
    if (itemToUpdate) {
        itemToUpdate.totalQuantity = newQuantity;
        // Vi kalder ikke renderShoppingList igen her, da input-feltet allerede opdateres af brugeren.
        // Dette forhindrer, at cursor flyttes, hvilket giver en bedre UX.
    }
};


// Global copy to clipboard (FRONTEND ONLY)
window.copyShoppingListToClipboard = () => {
    let listText = "Indkøbsliste:\n\n";
    document.querySelectorAll('.shopping-category').forEach(categoryDiv => {
        const categoryName = categoryDiv.querySelector('h3').textContent;
        listText += `${categoryName}:\n`;
        
        state.shoppingList
            .filter(item => item.unit === categoryName) // Filtrer for items i den specifikke kategori
            .forEach(item => {
                // Inkluder kun varer, der stadig findes i state.shoppingList (hvis de er blevet slettet fra UI)
                // og kun hvis mængden er > 0
                if (item.totalQuantity > 0) {
                    listText += `- ${item.ingredientName} - ${item.totalQuantity} ${item.unit}\n`;
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