// hjemme-hub-frontend/utils/ingredientFormHelpers.js

import { api } from '../api/index.js'; // Import API-service
import { state } from '../main.js'; // Import global state for 'ingredients'

let selectedAutocompleteIndex = -1;

// Global hjælpefunktion til at tilføje ingrediens input felter
// Bruges af både MealPlanView og RecipesView
export function addIngredientInputField(container, initialMealIngredient = null) {
    const uniqueId = `ingredient-entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const div = document.createElement('div');
    div.classList.add('ingredient-entry');
    div.style.display = 'flex';
    div.style.gap = 'var(--spacing-xs)';
    div.style.marginBottom = 'var(--spacing-xs)';
    div.innerHTML = `
        <div class="form-group autocomplete-container" style="flex: 3;">
            <label for="ingredient-name-${uniqueId}" class="sr-only">Ingrediens navn</label>
            <input type="text" id="ingredient-name-${uniqueId}" class="ingredient-name" placeholder="Ingrediens" value="${initialMealIngredient?.ingredient?.name || ""}" style="width: 100%;">
            <div id="autocomplete-results-${uniqueId}" class="autocomplete-results"></div>
            <input type="hidden" class="ingredient-id" value="${initialMealIngredient?.ingredient?.id || ""}">
        </div>
        <div class="form-group" style="flex: 1;">
            <label for="ingredient-unit-${uniqueId}" class="sr-only">Enhed</label>
            <input type="text" id="ingredient-unit-${uniqueId}" class="ingredient-unit" placeholder="Enhed" value="${initialMealIngredient?.ingredient?.unit || ""}" style="width: 100%;" ${initialMealIngredient?.ingredient?.id ? "readonly" : ""}>
        </div>
        <div class="form-group" style="flex: 1;">
            <label for="ingredient-quantity-${uniqueId}" class="sr-only">Mængde</label>
            <input type="number" step="0.1" class="ingredient-quantity" placeholder="Mængde" value="${initialMealIngredient?.quantity || "1"}" min="0.1" style="width: 100%;">
        </div>
        <button type="button" class="btn-danger" style="flex-shrink: 0; padding: var(--spacing-xs); height: auto;" onclick="this.closest('.ingredient-entry').remove()">X</button>
    `;
    container.appendChild(div);

    const nameInput = div.querySelector('.ingredient-name');
    const unitInput = div.querySelector('.ingredient-unit');
    const idInput = div.querySelector('.ingredient-id');
    const autocompleteResultsContainer = div.querySelector(`#autocomplete-results-${uniqueId}`);

    let currentSearchTimeout;
    

    nameInput.addEventListener('input', async () => {
        const query = nameInput.value.trim();
        if (query.length < 2) {
            autocompleteResultsContainer.innerHTML = '';
            idInput.value = '';
            unitInput.value = '';
            unitInput.readOnly = false;
            return;
        }

        clearTimeout(currentSearchTimeout);
        currentSearchTimeout = setTimeout(async () => {
            try {
                const results = await api.get(`/ingredients/search?name=${encodeURIComponent(query)}`);
                renderAutocompleteResults(results, nameInput, unitInput, idInput, autocompleteResultsContainer);
            } catch (error) {
                console.error("[Hjemme-Hub] Fejl ved autocomplete søgning:", error);
                autocompleteResultsContainer.innerHTML = '<div class="autocomplete-item">Kunne ikke søge efter ingredienser.</div>';
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!div.contains(e.target)) {
            autocompleteResultsContainer.innerHTML = '';
            selectedAutocompleteIndex = -1;
        }
    });

    nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedAutocompleteIndex !== -1) {
                const selectedItem = autocompleteResultsContainer.children[selectedAutocompleteIndex];
                if (selectedItem) {
                    selectAutocompleteItem(selectedItem, nameInput, unitInput, idInput, autocompleteResultsContainer);
                }
            } else if (autocompleteResultsContainer.children.length > 0) {
                const firstItem = autocompleteResultsContainer.children[0];
                selectAutocompleteItem(firstItem, nameInput, unitInput, idInput, autocompleteResultsContainer);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            navigateAutocompleteResults(1, autocompleteResultsContainer, nameInput, unitInput, idInput);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            navigateAutocompleteResults(-1, autocompleteResultsContainer, nameInput, unitInput, idInput);
        }
    });

    if (initialMealIngredient && initialMealIngredient.ingredient && initialMealIngredient.ingredient.id) {
        unitInput.readOnly = true;
    }
}


function renderAutocompleteResults(results, nameInput, unitInput, idInput, container) {
    container.innerHTML = '';
    if (results.length === 0) {
        container.innerHTML = '<div class="autocomplete-item">Ingen ingrediens fundet.</div>';
        return;
    }

    results.forEach(ingredient => {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('autocomplete-item');
        itemDiv.textContent = `${ingredient.name} (${ingredient.unit})`;
        itemDiv.dataset.id = ingredient.id;
        itemDiv.dataset.name = ingredient.name;
        itemDiv.dataset.unit = ingredient.unit;
        itemDiv.addEventListener('click', () => {
            selectAutocompleteItem(itemDiv, nameInput, unitInput, idInput, container);
        });
        container.appendChild(itemDiv);
    });
}

function selectAutocompleteItem(itemDiv, nameInput, unitInput, idInput, container) {
    nameInput.value = itemDiv.dataset.name;
    unitInput.value = itemDiv.dataset.unit;
    idInput.value = itemDiv.dataset.id;
    unitInput.readOnly = true;
    container.innerHTML = '';
    selectedAutocompleteIndex = -1;
}

function navigateAutocompleteResults(direction, container, nameInput, unitInput, idInput) {
    const items = Array.from(container.children);
    if (items.length === 0) return;

    items.forEach(item => item.classList.remove('selected'));

    selectedAutocompleteIndex += direction;
    if (selectedAutocompleteIndex < 0) {
        selectedAutocompleteIndex = items.length - 1;
    } else if (selectedAutocompleteIndex >= items.length) {
        selectedAutocompleteIndex = 0;
    }

    const selectedItem = items[selectedAutocompleteIndex];
    selectedItem.classList.add('selected');
    selectedItem.scrollIntoView({ block: 'nearest' });

    nameInput.value = selectedItem.dataset.name;
    unitInput.value = selectedItem.dataset.unit;
    idInput.value = selectedItem.dataset.id;
    unitInput.readOnly = true;
}