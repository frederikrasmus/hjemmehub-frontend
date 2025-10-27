// hjemme-hub-frontend/components/RecipesView.js

import { api } from '../api/index.js';
import { openModal, closeModal } from '../utils/modal.js';
import { state } from '../main.js'; // Global state (ingredients)

// (window.addIngredientInputField er globalt defineret i main.js via utils/ingredientFormHelpers.js)

export async function loadRecipesData() {
    const grid = document.getElementById("recipes-grid");
    grid.innerHTML = '<div class="loading">Indlæser opskrifter...</div>';

    try {
        const recipes = await api.get("/meal-plans?isRecipeTemplate=true"); // Henter kun opskriftstemplater
        state.recipes = recipes; // Gem i global state, hvis nødvendigt for andre visninger
        renderRecipes(recipes);
    } catch (error) {
        console.error("[Hjemme-Hub] Fejl ved indlæsning af opskrifter:", error);
        grid.innerHTML =
            '<div class="empty-state"><h3>Kunne ikke indlæse opskrifter</h3><p>Tjek at backend kører på localhost:8080</p></div>';
    }
}

function renderRecipes(recipes) { // omdøbt parameter til 'recipes' for klarhed
    const grid = document.getElementById("recipes-grid");

    if (recipes.length === 0) {
        grid.innerHTML =
            '<div class="empty-state"><h3>Ingen opskrifter endnu</h3><p>Klik på "Ny Opskrift" for at tilføje din første opskrift.</p></div>';
        return;
    }

    grid.innerHTML = recipes
        .map(recipe => `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">${recipe.description}</h3>
                    <div class="card-actions">
                        <button class="btn-secondary btn-small" onclick="window.editRecipe(${recipe.id})"></button>
                        <button class="btn-danger btn-small" onclick="window.deleteRecipe(${recipe.id})"></button>
                    </div>
                </div>
                <div class="card-content">
                    <p><strong>Måltidstype:</strong> ${recipe.mealType.replace(/_/g, ' ')}</p>
                    ${recipe.ingredients && recipe.ingredients.length > 0 ? `
                      <p><strong>Ingredienser:</strong></p>
                      <ul>
                          ${recipe.ingredients.map(mi => `<li>${mi.ingredient.name} - ${mi.quantity} ${mi.ingredient.unit}</li>`).join('')}
                      </ul>
                    ` : '<p>Ingen ingredienser.</p>'}
                </div>
            </div>
        `)
        .join('');
    
    // Tilføj CSS for ikoner i RecipesView (Rediger/Slet knapper)
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
        .card-actions .btn-secondary::before {
            content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pencil"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>');
            display: block;
            width: 14px;
            height: 14px;
            line-height: 1;
        }
        .card-actions .btn-danger::before {
            content: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>');
            display: block;
            width: 14px;
            height: 14px;
            line-height: 1;
        }
    `;
    document.head.appendChild(styleTag);
}

// --- OPDATERET: Eksporter `initRecipesView` ---
export function initRecipesView() {
  document.getElementById("add-recipe-btn").addEventListener("click", () => window.showAddRecipeForm());
}
// --- SLUT OPDATERET ---

window.showAddRecipeForm = (recipe = null) => {
  const mealTypes = ["MORGENMAD", "FROKOST", "AFTENSMAD", "SNACK", "ANDET"];

  const content = `
      <form id="recipe-form">
          <input type="hidden" id="recipe-id" value="${recipe?.id || ''}">
          <div class="form-group">
              <label for="recipe-type">Måltidstype</label>
              <select id="recipe-type" required>
                  ${mealTypes
                    .map(
                      (type) =>
                        `<option value="${type}" ${
                          recipe?.mealType === type ? "selected" : ""
                        }>${type.replace(/_/g, " ")}</option>`
                    )
                    .join("")}
              </select>
          </div>
          <div class="form-group">
              <label for="recipe-description">Beskrivelse</label>
              <input type="text" id="recipe-description" value="${
                recipe?.description || ""
              }" placeholder="F.eks. Spaghetti Bolognese" required>
          </div>
          <div id="ingredients-container" class="form-group">
              <label>Ingredienser</label>
              <div id="ingredient-inputs"><!-- Eksisterende ingredienser indsættes her --></div>
              <button type="button" class="btn-secondary" 
                      id="add-ingredient-field-btn" style="margin-top: 10px;">
                      + Tilføj Ingrediens
              </button>
          </div>
          <div class="form-actions">
              <button type="button" class="btn-secondary" onclick="window.closeModal()">Annuller</button>
              <button type="submit" class="btn-primary">${
                recipe ? "Opdater Opskrift" : "Tilføj Opskrift"
              }</button>
          </div>
      </form>
  `;

  openModal(recipe ? "Rediger Opskrift" : "Ny Opskrift", content);

  const ingredientInputsContainer = document.getElementById("ingredient-inputs");

  if (recipe && recipe.ingredients) {
    recipe.ingredients.forEach((mi) =>
      window.addIngredientInputField(ingredientInputsContainer, mi)
    );
  } else {
    window.addIngredientInputField(ingredientInputsContainer);
  }

  document
    .getElementById("add-ingredient-field-btn")
    .addEventListener("click", () =>
      window.addIngredientInputField(ingredientInputsContainer)
    );

  document
    .getElementById("recipe-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const id = document.getElementById("recipe-id").value;
      const mealType = document.getElementById("recipe-type").value;
      const description = document.getElementById("recipe-description").value;

      const mealIngredients = [];
      document.querySelectorAll(".ingredient-entry").forEach((entryDiv) => {
        const ingredientId = entryDiv.querySelector(".ingredient-id").value;
        const ingredientName = entryDiv.querySelector(".ingredient-name").value;
        const ingredientUnit = entryDiv.querySelector(".ingredient-unit").value;
        const quantity = parseFloat(
          entryDiv.querySelector(".ingredient-quantity").value
        );

        if ((ingredientId || ingredientName) && quantity > 0) {
          const miRequest = { quantity: quantity };
          if (ingredientId) {
            miRequest.ingredientId = parseInt(ingredientId);
          } else if (ingredientName && ingredientUnit) {
            miRequest.ingredientName = ingredientName;
            miRequest.ingredientUnit = ingredientUnit;
          } else {
            return; // Håndter fejl
          }
          mealIngredients.push(miRequest);
        }
      });

      const mealData = {
        id: id ? parseInt(id) : null,
        mealType: mealType,
        description: description,
        ingredients: mealIngredients,
      };

      try {
        if (id) {
          await api.put(`/meal-plans/${id}?isRecipeTemplate=true`, mealData);
        } else {
          await api.post(`/meal-plans?isRecipeTemplate=true`, mealData);
        }
        window.closeModal();
        await loadRecipesData();
      } catch (error) {
        console.error("[Hjemme-Hub] Fejl ved gem/opdater opskrift:", error);
        alert(
          "Kunne ikke gemme opskrift. Tjek at backend kører og ingredienser er gyldige."
        );
      }
    });
};

window.editRecipe = async (recipeId) => {
    try {
        const recipe = await api.get(`/meal-plans/${recipeId}`);
        window.showAddRecipeForm(recipe);
    } catch (error) {
        console.error("[Hjemme-Hub] Fejl ved hentning af opskrift til redigering:", error);
        alert("Kunne ikke hente opskrift til redigering.");
    }
};

window.deleteRecipe = async (recipeId) => {
    if (confirm("Er du sikker på at du vil slette denne opskrift?")) {
        try {
            await api.delete(`/meal-plans/${recipeId}`); // Sletter opskriften
            await loadRecipesData();
        } catch (error) {
            console.error("[Hjemme-Hub] Fejl ved sletning af opskrift:", error);
            alert("Kunne ikke slette opskrift.");
        }
    }
};