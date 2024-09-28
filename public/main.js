import { fetchConfig, fetchSheetData } from './data.js';
import { initializeMap, processData, setupControls, loadVillageBoundaries, toggleVillageBoundaries } from './map.js';

let map;

async function initializeApp() {
  try {
    const config = await fetchConfig();
    
    window.YEARS = config.YEARS;
    window.MAP_BOUNDS = config.MAP_BOUNDS;
    window.desaIds = config.desaIds;

    map = await initializeMap(config.MAP_BOUNDS);
    
    const data = await fetchSheetData();
    if (!Array.isArray(data)) {
      throw new Error('Fetched data is not an array');
    }
    
    processData(data, map);
    setupControls(map);
    await loadVillageBoundaries(window.desaIds);

    // Setup UI controls
    setupUIControls();

  } catch (error) {
    console.error('Error initializing app:', error);
    showErrorMessage(`Failed to load map data: ${error.message}. Please try again later.`);
  }
}

function setupUIControls() {
  const yearSelect = document.getElementById('year-select');
  if (yearSelect) {
    window.YEARS.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    });
    yearSelect.addEventListener('change', (e) => filterDataByYear(e.target.value));
  }

  const boundaryToggle = document.getElementById('boundary-toggle');
  if (boundaryToggle) {
    boundaryToggle.addEventListener('change', (e) => toggleVillageBoundaries(e.target.checked));
  }
}

function filterDataByYear(year) {
  // Implement filtering logic here
  console.log(`Filtering data for year: ${year}`);
}

function showErrorMessage(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);