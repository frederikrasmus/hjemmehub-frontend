// Modal Management
export function openModal(title, content) { // Bemærk 'export' her!
    const modal = document.getElementById("modal-overlay")
    const modalTitle = document.getElementById("modal-title")
    const modalBody = document.getElementById("modal-body")
  
    modalTitle.textContent = title
    modalBody.innerHTML = content
    modal.classList.add("active")
  }
  
  export function closeModal() { // Bemærk 'export' her!
    const modal = document.getElementById("modal-overlay")
    modal.classList.remove("active")
  }
  
  export function initModal() { // Bemærk 'export' her!
    const closeBtn = document.getElementById("modal-close-btn")
    const overlay = document.getElementById("modal-overlay")
  
    closeBtn.addEventListener("click", closeModal)
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal()
    })
  }