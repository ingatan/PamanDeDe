import { fetchConfig, fetchSheetData, fetchPlaceData } from './data.js';
import { initializeMap, processData, setupControls, loadVillageBoundaries, clearMarkers, addPlaceMarkers, focusOnVillage, searchLocations } from './map.js';

let map;
let originalData;
let placeData;
const villageMapping = {
  "Temenggungan": "35.13.15.2001",
  "Patemon": "35.13.15.2002",
  "Jatiurip": "35.13.15.2003",
  "Opo Opo": "35.13.15.2004",
  "Kamalkuning": "35.13.15.2005",
  "Tanjungsari": "35.13.15.2006",
  "Krejengan": "35.13.15.2007",
  "Sentong": "35.13.15.2008",
  "Sumberkatimoho": "35.13.15.2009",
  "Karangren": "35.13.15.2010",
  "Rawan": "35.13.15.2011",
  "Seboro": "35.13.15.2012",
  "Kedungcaluk": "35.13.15.2013",
  "Widoro": "35.13.15.2014",
  "Gebangan": "35.13.15.2015",
  "Dawuhan": "35.13.15.2016",
  "Sokaan": "35.13.15.2017"
};

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
      throw new Error('No data to process');
    }
    
    if (placeData && placeData.length > 0) {
      addPlaceMarkers(placeData, map);
    } else {
      console.warn('No place data to process');
    }
    
    setupControls(map);
    await loadVillageBoundaries(window.desaIds);
    setupSearch();

  } catch (error) {
    console.error('Error initializing app:', error);
    showErrorMessage(`Gagal memuat data: ${error.message}. Coba lagi.`);
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
    console.error('Tahun Anggaran Belum Tersedia');
  }
}

function setupVillageFilter(data) {
  const dataVillages = [...new Set(data.map(item => item.Desa))];
  const allVillages = [...new Set([...Object.keys(villageMapping), ...dataVillages])].sort();
  
  const villageSelect = document.getElementById('village-select');
  
  if (villageSelect) {
    villageSelect.innerHTML = '';

    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Pilih Desa';
    villageSelect.appendChild(defaultOption);

    allVillages.forEach(village => {
      const option = document.createElement('option');
      option.value = village;
      option.textContent = village;
      villageSelect.appendChild(option);
    });
    
    villageSelect.addEventListener('change', applyFilters);
  } else {
    console.error('Tidak ada Desa dimaksud');
  }
}

function applyFilters() {
  clearMarkers();
  
  const checkedYears = Array.from(document.querySelectorAll('#year-checkboxes input:checked'))
    .map(checkbox => checkbox.value);
  
  const selectedVillage = document.getElementById('village-select').value;
  
  const filteredData = originalData.filter(item => 
    checkedYears.includes(item.TahunAnggaran) && 
    (selectedVillage === '' || item.Desa === selectedVillage)
  );
  
  processData(filteredData, map);
  addPlaceMarkers(placeData, map);

  if (selectedVillage !== '') {
    focusOnVillage(selectedVillage);
  } else {
    map.fitBounds(window.MAP_BOUNDS);
  }
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const searchButton = document.getElementById('search-button');

  searchButton.addEventListener('click', () => performSearch());
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });
}

function performSearch() {
  const searchTerm = document.getElementById('search-input').value.trim();
  if (searchTerm) {
    const results = searchLocations(searchTerm, originalData, placeData);
    if (results.length > 0) {
      const firstResult = results[0];
      map.setView([firstResult.lat, firstResult.lng], 15);
    } else {
      showErrorMessage('No results found for your search.');
    }
  }
}

function showErrorMessage(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000); 
  }
}

document.addEventListener('DOMContentLoaded', initializeApp);
export { villageMapping };