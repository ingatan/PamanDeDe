import { fetchConfig, fetchSheetData, fetchPlaceData } from './data.js';
import { initializeMap, processData, setupControls, loadVillageBoundaries, toggleVillageBoundaries, clearMarkers, addPlaceMarkers } from './map.js';

let map;
let originalData;
let placeData;

async function initializeApp() {
  try {
    const config = await fetchConfig();
    
    window.YEARS = config.YEARS;
    window.MAP_BOUNDS = config.MAP_BOUNDS;
    window.desaIds = config.desaIds;

    map = await initializeMap(config.MAP_BOUNDS);
    
    originalData = await fetchSheetData();
    placeData = await fetchPlaceData();
    
    if (originalData && originalData.length > 0) {
      processData(originalData, map);
      setupYearFilter(originalData);
    } else {
      console.error('No data to process');
    }
    
    if (placeData && placeData.length > 0) {
      addPlaceMarkers(placeData, map);
    } else {
      console.error('No place data to process');
    }
    
    setupControls(map);
    await loadVillageBoundaries(window.desaIds);

  } catch (error) {
    console.error('Error initializing app:', error);
    showErrorMessage(`Failed to load map data: ${error.message}. Please try again later.`);
  }
}

function setupYearFilter(data) {
  const years = [...new Set(data.map(item => item.TahunAnggaran))].sort();
  const yearCheckboxes = document.getElementById('year-checkboxes');
  
  if (yearCheckboxes) {
    years.forEach(year => {
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = year;
      checkbox.checked = true;
      checkbox.addEventListener('change', filterDataByYear);
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${year}`));
      yearCheckboxes.appendChild(label);
    });
    console.log('Year filter setup complete');
  } else {
    console.error('Year checkboxes container not found');
  }
}

function filterDataByYear() {
  clearMarkers();
  
  const checkedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked'))
    .map(checkbox => checkbox.value);
  
  const filteredData = originalData.filter(item => checkedYears.includes(item.TahunAnggaran));
  
  processData(filteredData, map);
  addPlaceMarkers(placeData, map);
}

function showErrorMessage(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);