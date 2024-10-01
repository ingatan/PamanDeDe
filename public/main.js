import { fetchConfig, fetchSheetData, fetchPlaceData } from './data.js';
import { initializeMap, processData, setupControls, loadVillageBoundaries, toggleVillageBoundaries, clearMarkers, addPlaceMarkers } from './map.js';

let map;
let originalData;
let placeData;
let villages = [];

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
      setupFilters(originalData);
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

function setupFilters(data) {
  setupYearFilter(data);
  setupVillageFilter(data);
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
      checkbox.addEventListener('change', applyFilters);
      
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(` ${year}`));
      yearCheckboxes.appendChild(label);
    });
  } else {
    console.error('Year checkboxes container not found');
  }
}

function setupVillageFilter(data) {
  villages = [...new Set(data.map(item => item.Desa))].sort();
  const villageSelect = document.getElementById('village-select');
  
  if (villageSelect) {
    villages.forEach(village => {
      const option = document.createElement('option');
      option.value = village;
      option.textContent = village;
      option.selected = true;
      villageSelect.appendChild(option);
    });
    villageSelect.addEventListener('change', applyFilters);
  } else {
    console.error('Village select element not found');
  }
}

function applyFilters() {
  clearMarkers();
  
  const checkedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked'))
    .map(checkbox => checkbox.value);
  
  const selectedVillages = Array.from(document.getElementById('village-select').selectedOptions)
    .map(option => option.value);
  
  const filteredData = originalData.filter(item => 
    checkedYears.includes(item.TahunAnggaran) && selectedVillages.includes(item.Desa)
  );
  
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