// hjemme-hub-frontend/components/MealPlanView.js

import { api } from '../api/index.js';
import { openModal, closeModal } from '../utils/modal.js';
import { state } from '../main.js'; // Global state (recipes, ingredients)

// Globaliseret MEAL_CATEGORIES for genbrug i andre dele af modulet
const MEAL_CATEGORIES = [
  "VEGANSK", "VEGETARISK", "MED_KØD", "MED_FISK", "KYLLING", "SUPPE",
  "SALAT", "PASTA", "ASIATISK", "MEXICANSK", "ITALIENSK", "DANSK", "ANDRE"
];

let currentWeekStartDate = getStartOfWeek(new Date());

function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // juster så mandag er start
    return new Date(d.setDate(diff));
}

function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

export async function loadMealPlanData() {
  const grid = document.getElementById("meal-plan-grid");
  grid.innerHTML = '<div class="loading">Indlæser madplan...</div>';

  const datesForWeek = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(currentWeekStartDate);
    date.setDate(currentWeekStartDate.getDate() + i);
    datesForWeek.push(date.toISOString().split('T')[0]);
  }

  try {
    const mealPromises = datesForWeek.map(date => api.get(`/meal-plans?date=${date}&isRecipeTemplate=false`)); // Henter KUN planlagte måltider!
    const mealsForWeekArrays = await Promise.all(mealPromises);
    const allMeals = mealsForWeekArrays.flat();
    state.mealPlans = allMeals; // Opdater global state
    renderMealPlan(allMeals);
  } catch (error) {
    console.error("[Hjemme-Hub] Fejl ved indlæsning af madplan:", error);
    grid.innerHTML =
      '<div class="empty-state"><h3>Kunne ikke indlæse madplan</h3><p>Tjek at backend kører på localhost:8080</p></div>';
  }
}

function renderMealPlan(mealPlans) {
  const grid = document.getElementById("meal-plan-grid");

  const weekNumber = getWeekNumber(currentWeekStartDate);
  let weekNavHtml = `
    <div class="week-navigation">
        <button id="prev-week-btn" aria-label="Forrige Uge"></button>
        <h3>Uge ${weekNumber} (${currentWeekStartDate.getFullYear()})</h3>
        <button id="next-week-btn" aria-label="Næste Uge"></button>
    </div>
  `;
  grid.innerHTML = weekNavHtml;

  const mealsByDate = {};
  for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStartDate);
      date.setDate(currentWeekStartDate.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      mealsByDate[dateString] = { date: date, meals: [] };
  }

  mealPlans.forEach((meal) => {
    if (mealsByDate[meal.date]) {
      mealsByDate[meal.date].meals.push(meal);
    }
  });

  const dayColumnsContainer = document.createElement('div');
  dayColumnsContainer.className = 'meal-grid-columns';
  grid.appendChild(dayColumnsContainer);

  const MEAL_TYPES_ORDER = ["MORGENMAD", "FROKOST", "AFTENSMAD", "SNACK", "ANDET"];

  dayColumnsContainer.innerHTML = Object.values(mealsByDate)
    .map(
      ({ date, meals }) => {
        const dayName = date.toLocaleDateString('da-DK', { weekday: 'long' });
        const formattedDate = date.toLocaleDateString('da-DK', { day: '2-digit', month: '2-digit' });
        const dateString = date.toISOString().split('T')[0];

        const mealsGroupedByType = MEAL_TYPES_ORDER.reduce((acc, type) => {
            acc[type] = meals.filter(meal => meal.mealType === type);
            return acc;
        }, {});

        return `
            <div class="day-column">
                <div class="day-header">
                    <span>${dayName.charAt(0).toUpperCase() + dayName.slice(1)}</span>
                    <span class="date-label">${formattedDate}</span>
                </div>
                ${
                    MEAL_TYPES_ORDER.map(mealType => `
                        <div class="meal-type-section">
                            <h5>
                                <span>${mealType.replace(/_/g, ' ')}</span>
                                <button class="add-meal-type-btn" data-date="${dateString}" data-meal-type="${mealType}" aria-label="Tilføj ${mealType.replace(/_/g, ' ')}"></button>
                            </h5>
                            ${mealsGroupedByType[mealType].length > 0 ?
                                mealsGroupedByType[mealType].map(meal => `
                                    <div class="meal-card" onclick="window.viewMealDetails(${meal.id})">
                                        <h4>${meal.description || "Ingen beskrivelse"}</h4>
                                        <div class="meal-card-actions">
                                            <button class="btn-danger btn-small" onclick="event.stopPropagation(); window.deleteMeal(${meal.id})" aria-label="Slet måltid"></button>
                                        </div>
                                    </div>
                                `).join('')
                                : '<p style="font-size:0.8rem; color:var(--color-text-secondary);">Intet planlagt</p>'
                            }
                        </div>
                    `).join('')
                }
            </div>
        `;
      }
    )
    .join("");

  document.getElementById("prev-week-btn").addEventListener("click", () => {
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() - 7);
    loadMealPlanData();
  });

  document.getElementById("next-week-btn").addEventListener("click", () => {
    currentWeekStartDate.setDate(currentWeekStartDate.getDate() + 7);
    loadMealPlanData();
  });

  document.querySelectorAll(".add-meal-type-btn").forEach(btn => {
      btn.addEventListener('click', () => {
          window.showAddMealForm(btn.dataset.date, btn.dataset.mealType);
      });
  });
}

export function initMealPlanView() {
  // Event listeners tilføjes i renderMealPlan, da UI genereres dynamisk
}

window.showAddMealForm = (dateString, mealTypeSelected) => {
  // Robust filter: Ignorerer store/små bogstaver og håndterer null
  let recipesForModal = state.recipes.filter(
    (recipe) =>
      recipe.mealType &&
      recipe.mealType.toUpperCase() === mealTypeSelected.toUpperCase()
  );

  const content = `
        <form id="add-meal-form">
            <input type="hidden" id="meal-date" value="${dateString}">
            <p style="margin-bottom: var(--spacing-sm); color: var(--color-text-secondary);">
                Tilføj ${mealTypeSelected.replace(
                  /_/g,
                  " "
                )} til dato: ${new Date(dateString).toLocaleDateString("da-DK")}
            </p>

            <!-- NYT: Kategori-filter i modalen -->
           <div class="form-group">
               <label for="modal-meal-category-filter">Filtrer efter kategori</label>
               <select id="modal-meal-category-filter" class="form-control">
                   <option value="">Alle Kategorier</option>
                   ${MEAL_CATEGORIES.map(category => `<option value="${category}">${category.replace(/_/g, ' ').charAt(0).toUpperCase() + 
                      category.replace(/_/g, ' ').slice(1).toLowerCase()}</option>`).join('')}
               </select>
           </div>

             <div id="recipe-selection-grid" class="recipe-modal-grid">
              ${recipesForModal.length > 0
                  ? recipesForModal
                      .map(recipe => `
                          <div class="recipe-selection-card" data-recipe-id="${recipe.id}">
                              <img src="${recipe.imageUrl || 'https://picsum.photos/id/1018/150'}" alt="${recipe.description}" class="recipe-selection-image">
                              <h4 class="recipe-selection-title">${recipe.description}</h4>
                              <p class="recipe-selection-mealtype">${(recipe.mealCategory ? recipe.mealCategory.replace(/_/g, ' ') : "Ingen Kategori").charAt(0).toUpperCase() + (recipe.mealCategory ? recipe.mealCategory.replace(/_/g, ' ').slice(1).toLowerCase() : "ngen Kategori")}</p>
                          </div>
                      `)
                      .join("")
                  : `<p class="empty-state" style="margin-top: 1rem;">Ingen retter af den valgte type og kategori fundet. <br/> Opret en ny under "Retter".</p>`
              }
          </div>
            </div>
            <div class="form-actions">
                <button type="button" class="btn-secondary" onclick="window.closeModal()">Annuller</button>
                <button type="submit" class="btn-primary" id="add-meal-submit-btn" disabled>Tilføj valgt ret</button>
            </div>
        </form>
    `;

  openModal("Vælg opskrift", content);

  const modalCategoryFilter = document.getElementById('modal-meal-category-filter');
  const recipeSelectionGrid = document.getElementById("recipe-selection-grid");
  const addMealSubmitBtn = document.getElementById("add-meal-submit-btn");
  let selectedRecipeId = null;

  const renderFilteredRecipesGrid = (currentFilteredRecipes) => {
      recipeSelectionGrid.innerHTML = currentFilteredRecipes.length > 0
          ? currentFilteredRecipes
              .map(recipe => `
                  <div class="recipe-selection-card" data-recipe-id="${recipe.id}">
                      <img src="${recipe.imageUrl || 'https://picsum.photos/id/1018/150'}" alt="${recipe.description}" class="recipe-selection-image">
                      <h4 class="recipe-selection-title">${recipe.description}</h4>
                      <p class="recipe-selection-mealtype">${(recipe.mealCategory ? recipe.mealCategory.replace(/_/g, ' ') : "Ingen Kategori").charAt(0).toUpperCase() + (recipe.mealCategory ? recipe.mealCategory.replace(/_/g, ' ').slice(1).toLowerCase() : "ngen Kategori")}</p>
                  </div>
              `)
              .join("")
          : `<p class="empty-state" style="margin-top: 1rem;">Ingen opskrifter af typen '${mealTypeSelected.replace(/_/g, ' ')}' og den valgte kategori fundet.</p>`;
      
      selectedRecipeId = null;
      addMealSubmitBtn.disabled = true;
  };

  modalCategoryFilter.addEventListener('change', () => {
      const selectedCategory = modalCategoryFilter.value;
      let tempFilteredRecipes = state.recipes.filter(
        (recipe) =>
          recipe.mealType &&
          recipe.mealType.toUpperCase() === mealTypeSelected.toUpperCase()
      );

      if (selectedCategory) {
          tempFilteredRecipes = tempFilteredRecipes.filter(
              recipe => recipe.mealCategory && recipe.mealCategory.toUpperCase() === selectedCategory.toUpperCase() ||
                        !recipe.mealCategory && selectedCategory.toUpperCase() === "ANDRE" // Matcher "ANDRE" hvis kategori mangler
          );
      }
      renderFilteredRecipesGrid(tempFilteredRecipes);
  });


  recipeSelectionGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.recipe-selection-card');
      if (card) {
          document.querySelectorAll('.recipe-selection-card').forEach(item => {
              item.classList.remove('selected');
          });
          card.classList.add('selected');
          selectedRecipeId = card.dataset.recipeId;
          addMealSubmitBtn.disabled = false; // Aktiver "Tilføj"-knappen
      }
  });

  if (recipesForModal.length === 1) { // <--- RETTELSE HER: Brug 'recipesForModal'
      const singleCard = document.querySelector('.recipe-selection-card');
      if (singleCard) {
          singleCard.classList.add('selected');
          selectedRecipeId = singleCard.dataset.recipeId;
          addMealSubmitBtn.disabled = false;
      }
  }


  document
    .getElementById("add-meal-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!selectedRecipeId) { // Brug den lokalt valgte ID
        alert("Vælg venligst en opskrift.");
        return;
      }
      const selectedRecipe = state.recipes.find((r) => r.id == selectedRecipeId);
      const mealData = {
        date: dateString,
        mealType: mealTypeSelected,
        description: selectedRecipe.description,
        ingredients: selectedRecipe.ingredients.map((mi) => ({
          ingredientId: mi.ingredient.id,
          quantity: mi.quantity,
        })),
        mealCategory: selectedRecipe.mealCategory,
      };

      try {
        await api.post("/meal-plans", mealData);
        closeModal();
        await loadMealPlanData();
      } catch (error) {
        console.error("Fejl ved POST til /meal-plans:", error);
        alert("Kunne ikke tilføje måltid: " + error.message);
      }
    });
};

window.viewMealDetails = async (mealId) => {
  try {
    const meal = await api.get(`/meal-plans/${mealId}`);
    const ingredientsHtml = meal.ingredients.map(mi => `
      <li>${mi.ingredient.name}: ${mi.quantity} ${mi.ingredient.unit}</li>
    `).join('');

    const content = `
            <div style="margin-bottom: 1.5rem;">
                <p><strong>Dato:</strong> ${meal.date}</p>
                <p><strong>Type:</strong> ${meal.mealType.replace(/_/g, ' ')}</p>
                <p><strong>Beskrivelse:</strong> ${meal.description}</p>
                ${meal.ingredients.length > 0 ? `
                  <p><strong>Ingredienser:</strong></p>
                  <ul>${ingredientsHtml}</ul>
                ` : '<p>Ingen ingredienser til dette måltid.</p>'}
            </div>
            <div class="form-actions">
                <button class="btn-danger" onclick="window.deleteMeal(${meal.id})">Slet Måltid</button>
                <button class="btn-secondary" onclick="window.closeModal()">Luk</button>
            </div>
        `;
    window.openModal("Måltidsdetaljer", content);
  } catch (error) {
    alert("Kunne ikke hente måltidsdetaljer");
    console.error("[Hjemme-Hub] Fejl ved hentning af måltidsdetaljer:", error);
  }
};

window.showEditMealForm = async (mealId) => {
    try {
        const meal = await api.get(`/meal-plans/${mealId}`);
        const mealTypes = ["MORGENMAD", "FROKOST", "AFTENSMAD", "SNACK", "ANDET"];
        const allIngredients = state.ingredients || [];

        const content = `
            <form id="edit-meal-form">
                <input type="hidden" id="meal-id" value="${meal.id}">
                <div class="form-group">
                    <label for="meal-date">Dato</label>
                    <input type="date" id="meal-date" value="${meal.date}" required>
                </div>
                <div class="form-group">
                    <label for="meal-type">Måltidstype</label>
                    <select id="meal-type" required>
                        ${mealTypes.map((type) => `<option value="${type}" ${meal.mealType === type ? "selected" : ""}>${type.replace(/_/g, ' ')}</option>`).join("")}
                    </select>
                </div>
                <div class="form-group">
                    <label for="meal-description">Beskrivelse</label>
                    <input type="text" id="meal-description" value="${meal.description}" placeholder="F.eks. Spaghetti Bolognese" required>
                </div>
                <div id="ingredients-container" class="form-group">
                    <label>Ingredienser</label>
                    <div id="ingredient-inputs">
                        <!-- Eksisterende ingredienser indsættes her -->
                    </div>
                    <button type="button" class="btn-secondary" id="add-ingredient-field-btn" style="margin-top: 10px;">+ Tilføj Ingrediens</button>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="window.closeModal()">Annuller</button>
                    <button type="submit" class="btn-primary">Gem ændringer</button>
                </div>
            </form>
        `;

        window.openModal("Rediger Måltid", content);

        const ingredientInputsContainer = document.getElementById("ingredient-inputs");
        // Fyld eksisterende ingredienser op og init autocomplete
        meal.ingredients.forEach(mi => {
            window.addIngredientInputField(ingredientInputsContainer, mi);
        });

        document.getElementById("add-ingredient-field-btn").addEventListener("click", () => {
            window.addIngredientInputField(ingredientInputsContainer, { ingredient: { name: '', unit: '' }, quantity: 1 });
        });

        document.getElementById("edit-meal-form").addEventListener("submit", async (e) => {
            e.preventDefault();

            const id = document.getElementById("meal-id").value;
            const mealType = document.getElementById("meal-type").value;
            const description = document.getElementById("meal-description").value;

            const mealIngredients = [];
            document.querySelectorAll('.ingredient-entry').forEach(entryDiv => {
                const ingredientId = entryDiv.querySelector('.ingredient-id').value;
                const ingredientName = entryDiv.querySelector('.ingredient-name').value;
                const ingredientUnit = entryDiv.querySelector('.ingredient-unit').value;
                const quantity = parseFloat(entryDiv.querySelector('.ingredient-quantity').value);

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
                id: parseInt(id),
                mealType: mealType,
                description: description,
                ingredients: mealIngredients
            };

            try {
                await api.put(`/meal-plans/${id}`, mealData);
                window.closeModal();
                await loadMealPlanData();
            } catch (error) {
                console.error("[Hjemme-Hub] Fejl ved opdatering af måltid:", error);
                alert("Kunne ikke opdatere måltid. Tjek at backend kører og ingredienser er gyldige.");
            }
        });

    } catch (error) {
        console.error("[Hjemme-Hub] Fejl ved hentning af måltid til redigering:", error);
        alert("Kunne ikke hente måltidsdetaljer til redigering.");
    }
};


window.deleteMeal = async (mealId) => {
  if (confirm("Er du sikker på at du vil slette dette måltid?")) {
    try {
      await api.delete(`/meal-plans/${mealId}`);
      window.closeModal();
      await loadMealPlanData();
    } catch (error) {
      console.error("[Hjemme-Hub] Fejl ved sletning af måltid:", error);
      alert("Kunne ikke slette måltid.");
    }
  }
};