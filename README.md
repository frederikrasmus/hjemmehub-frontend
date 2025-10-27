# Hjemme-Hub - Madplanlægning

En moderne madplanlægningsapplikation bygget med Vanilla JavaScript.

## Funktioner

- **Madplan**: Planlæg ugens måltider dag for dag
- **Opskrifter**: Administrer dine opskrifter (kommer snart)
- **Ingredienser**: Hold styr på alle ingredienser med kategorier og enheder
- **Indkøbsliste**: Generer automatisk indkøbsliste baseret på madplanen

## Sådan kører du applikationen

### Backend (Java/Spring Boot)
1. Åbn backend-projektet i IntelliJ IDEA
2. Kør applikationen på `localhost:8080`

### Frontend (Vanilla JavaScript)
1. Åbn denne mappe i Visual Studio Code
2. Installer Live Server extension (hvis du ikke har den)
3. Højreklik på `index.html` og vælg "Open with Live Server"
4. Applikationen åbner i din browser på `http://localhost:5500` (eller lignende)

## Alternativ: Kør uden Live Server

Du kan også bare åbne `index.html` direkte i din browser, men vær opmærksom på CORS-problemer hvis backend kræver det.

## API Konfiguration

Backend API forventes at køre på `http://localhost:8080/api`. Hvis din backend kører på en anden port, skal du ændre `API_BASE_URL` i `app.js`:

\`\`\`javascript
const API_BASE_URL = 'http://localhost:DIN_PORT/api';
\`\`\`

## Teknologier

- HTML5
- CSS3 (Custom Properties for tema)
- Vanilla JavaScript (ES6+)
- Fetch API til backend kommunikation

## Browser Support

Moderne browsere (Chrome, Firefox, Safari, Edge) med ES6+ support.
