import { api } from '../api/index.js';
import { openModal, closeModal } from '../utils/modal.js';
import { state } from '../main.js'; // Tilgå global state om nødvendigt

// Ingredients Functions
export async function loadIngredientsData() {
  const grid = document.getElementById("ingredients-grid");
  grid.innerHTML = '<div class="loading">Indlæser ingredienser...</div>';

  try {
    const ingredients = await api.get("/ingredients"); // Korrekt endpoint
    state.ingredients = ingredients; // Opdater global state for brug i andre views
    renderIngredients(ingredients);
  } catch (error) {
    grid.innerHTML =
      '<div class="empty-state"><h3>Kunne ikke indlæse ingredienser</h3><p>Tjek at backend kører på localhost:8080</p></div>';
  }
}

function renderIngredients(ingredients) {
  const grid = document.getElementById("ingredients-grid");
  const UNITS = [ // Skal matche listen i din frontend
    "stk", "gram", "ml", "dl", "spsk", "tsk", "pakke", "glas", "dåse", "flaske", "bundt", "fed", "andre",
  ];

  if (ingredients.length === 0) {
    grid.innerHTML =
      '<div class="empty-state"><h3>Ingen ingredienser</h3><p>Klik på "Ny Ingrediens" for at tilføje</p></div>';
    return;
  }

  // Group by unit
  const groupedIngredients = ingredients.reduce(
    (acc, ingredient) => {
      if (!acc[ingredient.unit]) {
        acc[ingredient.unit] = [];
      }
      acc[ingredient.unit].push(ingredient);
      return acc;
    },
    {}
  );

  grid.innerHTML = Object.entries(groupedIngredients)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([unit, items]) => `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">${unit}</h3>
                <div class="card-actions">
                    <!-- Ingen generel tilføj/rediger/slet for hele kategorien her -->
                </div>
            </div>
            <div class="card-content">
                <div class="grid-col-2"> <!-- Simpel grid for ingrediensliste -->
                  ${items
                    .map(
                      (ingredient) => `
                      <div class="flex-item-between">
                        <span>${ingredient.name}</span>
                        <div class="card-actions">
                            <button class="btn-secondary" onclick="window.editIngredient(${ingredient.id})">Rediger</button>
                            <button class="btn-danger" onclick="window.deleteIngredient(${ingredient.id})">Slet</button>
                        </div>
                      </div>
                    `,
                    )
                    .join("")}
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

// Exportér funktioner, der skal kaldes fra main.js eller globale event listeners
export function initIngredientsView() {
  document.getElementById("add-ingredient-btn").addEventListener("click", () => window.showAddIngredientForm());
}

window.showAddIngredientForm = (ingredient = null) => {
  const UNITS = [ "stk", "gram", "ml", "spsk", "tsk", "pakke", "glas", "dåse", "flaske", "bundt", "fed", "andre"]; // Skal matche den globale liste

  const content = `
        <form id="ingredient-form">
            <div class="form-group">
                <label for="ingredient-name">Navn</label>
                <input type="text" id="ingredient-name" value="${ingredient?.name || ""}" required>
            </div>
            <div class="form-group">
                <label for="ingredient-unit">Enhed</label>
                <select id="ingredient-unit" required>
                    ${UNITS.map((unit) => `<option value="${unit}" ${ingredient?.unit === unit ? "selected" : ""}>${unit}</option>`).join("")}
                </select>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="window.closeModal()">Annuller</button>
                <button type="submit" class="btn-primary">${ingredient ? "Opdater" : "Tilføj"}</button>
            </div>
        </form>
    `;

  window.openModal(ingredient ? "Rediger Ingrediens" : "Ny Ingrediens", content);

  document.getElementById("ingredient-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const data = {
      name: document.getElementById("ingredient-name").value,
      unit: document.getElementById("ingredient-unit").value,
    };

    try {
      if (ingredient) {
        await api.put(`/ingredients/${ingredient.id}`, data);
      } else {
        await api.post("/ingredients", data);
      }
      window.closeModal();
      await loadIngredientsData(); // Genindlæs ingredienser efter gem
    } catch (error) {
      console.error("Fejl ved gem/opdater ingrediens:", error);
      alert("Kunne ikke gemme ingrediens. Tjek at backend kører.");
    }
  });
};

window.editIngredient = async (id) => {
  try {
    const ingredient = await api.get(`/ingredients/${id}`);
    window.showAddIngredientForm(ingredient);
  } catch (error) {
    alert("Kunne ikke hente ingrediens til redigering");
  }
};

window.deleteIngredient = async (id) => {
  if (confirm("Er du sikker på at du vil slette denne ingrediens?")) {
    try {
      await api.delete(`/ingredients/${id}`);
      await loadIngredientsData(); // Genindlæs ingredienser efter slet
    } catch (error) {
      console.error("Fejl ved sletning af ingrediens:", error);
      alert("Kunne ikke slette ingrediens. Tjek om den er i brug af et måltid.");
    }
  }
};