// hjemme-hub-frontend/main.js

// Import moduler
import { api } from './api/index.js';
import { openModal, closeModal, initModal } from './utils/modal.js';
import { addIngredientInputField } from './utils/ingredientFormHelpers.js'; // Importerer helper

// Import view-moduler
import { initMealPlanView, loadMealPlanData } from './components/MealPlanView.js';
import { initIngredientsView, loadIngredientsData } from './components/IngredientsView.js';
import { initShoppingListView, loadShoppingListData } from './components/ShoppingListView.js';
import { initRecipesView, loadRecipesData } from './components/RecipesView.js';


// Global State Management
export const state = {
  currentView: "meal-plan",
  ingredients: [], // Alle ingredienser tilgængelige globalt for autocomplete
  mealPlans: [],   // Planlagte måltider (vises på Madplan)
  shoppingList: [],// Indkøbsliste (genereres dynamisk)
  recipes: [],     // Opskriftstemplater (bruges på Opskrifter og i Madplanens dropdown)
};


// --- Global Navigation Logik ---
function initNavigation() {
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const view = btn.dataset.view;
      switchView(view);
    });
  });
}

export function switchView(viewName) {
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.view === viewName);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.remove("active");
  });
  document.getElementById(`${viewName}-view`).classList.add("active");

  state.currentView = viewName;

  loadViewData(viewName);
}

async function loadViewData(viewName) {
  // ALTID indlæs ingredienser og opskrifter FØRST, da de er nødvendige for modals/dropdowns i ALLE views
  if (state.ingredients.length === 0) {
    state.ingredients = await api.get("/ingredients");
  }
  if (state.recipes.length === 0) {
    // Henter kun opskriftstemplater (isRecipeTemplate=true) for dette globale array
    state.recipes = await api.get("/meal-plans?isRecipeTemplate=true");
  }

  switch (viewName) {
    case "meal-plan":
      await loadMealPlanData();
      break;
    case "recipes":
      await loadRecipesData();
      break;
    case "ingredients":
      await loadIngredientsData();
      break;
    case "shopping":
      await loadShoppingListData();
      break;
  }
}

// --- Global App Initialisering ---
document.addEventListener("DOMContentLoaded", async () => {
  initModal();
  initNavigation();

  // Initialiser de individuelle view-moduler
  initMealPlanView();
  initIngredientsView();
  initRecipesView();
  initShoppingListView();

  // Indlæs den første side
  await loadViewData(state.currentView);
});

// Gør funktioner globale, så de kan kaldes direkte fra HTML's `onclick` attributter
window.openModal = openModal;
window.closeModal = closeModal;
window.addIngredientInputField = addIngredientInputField; // Gør helperen global

window.state = state;