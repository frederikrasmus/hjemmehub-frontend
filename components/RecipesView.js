// hjemme-hub-frontend/components/RecipesView.js

import { api } from '../api/index.js';
import { openModal, closeModal } from '../utils/modal.js';
import { state } from '../main.js'; // Global state (ingredients)

const MEAL_TYPES = ["MORGENMAD", "FROKOST", "AFTENSMAD", "SNACK", "ANDET"];

const MEAL_CATEGORIES_FOR_FORM = [ // Matcher din Java MealCategory Enum
  "VEGANSK", "VEGETARISK", "MED_KØD", "MED_FISK", "KYLLING", "SUPPE",
  "SALAT", "PASTA", "ASIATISK", "MEXICANSK", "ITALIENSK", "DANSK", "ANDRE"
];

// (window.addIngredientInputField er globalt defineret i main.js via utils/ingredientFormHelpers.js)

export async function loadRecipesData() {
    const grid = document.getElementById("recipes-grid");
    grid.innerHTML = '<div class="loading">Indlæser Retter...</div>';

    try {
        const recipes = await api.get("/meal-plans?isRecipeTemplate=true"); // Henter kun Retstemplater
        state.recipes = recipes; // Gem i global state, hvis nødvendigt for andre visninger
        renderRecipes(recipes);
    } catch (error) {
        console.error("[Hjemme-Hub] Fejl ved indlæsning af Retter:", error);
        grid.innerHTML =
            '<div class="empty-state"><h3>Kunne ikke indlæse Retter</h3><p>Tjek at backend kører på localhost:8080</p></div>';
    }
}

function renderRecipes(recipes) {
    const grid = document.getElementById("recipes-grid");

    if (recipes.length === 0) {
        grid.innerHTML =
            '<div class="empty-state"><h3>Ingen Retter endnu</h3><p>Klik på "Ny Ret" for at tilføje din første Ret.</p></div>';
        return;
    }

    grid.innerHTML = recipes
        .map(recipe => `
          <div class="card">
              <img src="${recipe.imageUrl || 'https://placehold.co/600x400'}" alt="${recipe.description}" class="recipe-card-image">
              
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
  const mealTypes = MEAL_TYPES;

  const content = `
      <form id="recipe-form">
          <input type="hidden" id="recipe-id" value="${recipe?.id || ''}">
          <div class="form-group">
            <label>Billede</label>
            <img id="image-preview" src="${recipe?.imageUrl || 'https://placehold.co/600x400'}" alt="Preview" style="max-width: 100%; height: auto; margin-bottom: 10px; border-radius: var(--radius);">
            <input type="file" id="recipe-image-input" accept="image/*">
        </div>
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
              <label for="recipe-category">Ret Kategori</label>
              <select id="recipe-category" required>
                  <option value="">Vælg Kategori</option>
                  ${MEAL_CATEGORIES_FOR_FORM.map(category => `<option value="
                    ${category}" ${recipe?.mealCategory === category ? "selected" : ""}>
                    ${category.replace(/_/g, ' ').charAt(0).toUpperCase() 
                      + category.replace(/_/g, ' ').slice(1).toLowerCase()}</option>`).join('')}
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
                recipe ? "Opdater Ret" : "Tilføj Ret"
              }</button>
          </div>
      </form>
  `;

  openModal(recipe ? "Rediger Ret" : "Ny Ret", content);

  const imageInput = document.getElementById('recipe-image-input');
  const imagePreview = document.getElementById('image-preview');

  imageInput.addEventListener('change', () => {
      const file = imageInput.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (e) => {
              imagePreview.src = e.target.result;
          };
          reader.readAsDataURL(file);
      }
  });

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

    // =============== Trin 1: Håndter billede-upload (hvis en ny fil er valgt) ===============
    let imageUrl = recipe?.imageUrl || null; // Start med det eksisterende billede, hvis der er et
    const imageInput = document.getElementById('recipe-image-input');
    
    if (imageInput.files[0]) {
      const formData = new FormData();
      formData.append('file', imageInput.files[0]);

      try {
        console.log("Uploader billede...");
        // Kald din api.post med 'true' for at indikere FormData
        const uploadResponse = await api.post("/upload", formData, true); 
        imageUrl = uploadResponse.url;
        console.log("Billede uploadet, URL:", imageUrl);
      } catch (error) {
        console.error("Fejl ved billede-upload:", error);
        alert("Kunne ikke uploade billede. Prøv igen.");
        return; // Stop processen hvis upload fejler
      }
    }

    // =============== Trin 2: Saml resten af data fra formularen ===============
    const id = document.getElementById("recipe-id").value;
    const mealType = document.getElementById("recipe-type").value;
    const description = document.getElementById("recipe-description").value;
    const mealCategory = document.getElementById("recipe-category").value;

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
          return;
        }
        mealIngredients.push(miRequest);
      }
    });

    // Opret det endelige mealData-objekt, der skal sendes til backend
    const mealData = {
      id: id ? parseInt(id) : null,
      mealType: mealType,
      description: description,
      ingredients: mealIngredients,
      imageUrl: imageUrl, // <-- Tilføj den nye eller eksisterende billede-URL
      mealCategory: mealCategory,
    };

    // =============== Trin 3: Gem Reten (med billede-URL) ===============
    try {
      if (id) {
        await api.put(`/meal-plans/${id}?isRecipeTemplate=true`, mealData);
      } else {
        await api.post(`/meal-plans?isRecipeTemplate=true`, mealData);
      }
      window.closeModal();
      await loadRecipesData();
    } catch (error) {
      console.error("[Hjemme-Hub] Fejl ved gem/opdater Ret:", error);
      alert(
        "Kunne ikke gemme Ret. Tjek at backend kører og ingredienser er gyldige."
      );
    }
  });
};

export async function editRecipe(recipeId) {
    try {
        const recipe = await api.get(`/meal-plans/${recipeId}`);
        window.showAddRecipeForm(recipe);
    } catch (error) {
        console.error("[Hjemme-Hub] Fejl ved hentning af Ret til redigering:", error);
        alert("Kunne ikke hente Ret til redigering.");
    }
};
window.editRecipe = editRecipe; 

export async function deleteRecipe(recipeId) {
    if (confirm("Er du sikker på at du vil slette denne Ret?")) {
        try {
            await api.delete(`/meal-plans/${recipeId}`); // Sletter Reten
            await loadRecipesData();
        } catch (error) {
            console.error("[Hjemme-Hub] Fejl ved sletning af Ret:", error);
            alert("Kunne ikke slette Ret.");
        }
    }
}
window.deleteRecipe = deleteRecipe; 