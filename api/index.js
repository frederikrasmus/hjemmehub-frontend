// Configuration
const API_BASE_URL = "http://localhost:8080/api"

// API Service
export const api = { // Bemærk 'export' her!
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`)
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Message: ${errorText}`);
      }
      return await response.json()
    } catch (error) {
      console.error("[Hjemme-Hub] API GET error:", error)
      throw error
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Message: ${errorText}`);
      }
      return await response.json()
    } catch (error) {
      console.error("[Hjemme-Hub] API POST error:", error)
      throw error
    }
  },

  async put(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Message: ${errorText}`);
      }
      return await response.json()
    } catch (error) {
      console.error("[Hjemme-Hub] API PUT error:", error)
      throw error
    }
  },

  async delete(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
      })
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${errorText}`);
      }
      return true
    } catch (error) {
      console.error("[Hjemme-Hub] API DELETE error:", error)
      throw error
    }
  },
}