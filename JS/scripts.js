// Constants
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcuDcfLiekqPQHm_bUpWZ9lsrDW261au1m1raUv8dHGHp1MlYZB50yNyqEEJ-mZmiSeC2Odj4giUcD/pub?gid=0&single=true&output=csv';
const YEARS = ['2021', '2022', '2023', '2024'];
const MAP_BOUNDS = [[-7.77793, 113.38048], [-7.81793, 113.45052]];

let map;
let clusterGroups = {};
let layerControl;

// Map initialization
function initMap() {
  map = L.map('map', {
    zoomControl: true,
    maxZoom: 19
  }).fitBounds(MAP_BOUNDS);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Add title to map
  let title = L.control();
  title.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info');
    this.update();
    return this._div;
  };
  title.update = function () {
    this._div.innerHTML = '<h2>PAMAN DeDe</h2>Pantau Manfaat Dana Desa Kecamatan Krejengan';
  };
  title.addTo(map);
}

// Cluster groups initialization
function initClusterGroups() {
  YEARS.forEach(year => {
    clusterGroups[year] = L.markerClusterGroup({
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      spiderfyOnMaxZoom: true
    });
  });
}

// Main function to fetch and process data
async function initializeMap() {
  try {
    showLoadingIndicator();
    initMap();
    initClusterGroups();
    const data = await fetchCSVData();
    processData(data);
    addLayersToMap();
    setupControls();
    hideLoadingIndicator();
  } catch (error) {
    console.error('Error initializing map:', error);
    showErrorMessage('Failed to load map data. Please try again later.');
    hideLoadingIndicator();
  }
}

// Fetch CSV data
async function fetchCSVData() {
  const response = await fetch(SHEET_URL);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const csvData = await response.text();
  return new Promise((resolve, reject) => {
    Papa.parse(csvData, {
      header: true,
      complete: (results) => resolve(results.data),
      error: (error) => reject(error)
    });
  });
}

let allMarkersGroup;

// Process fetched data
function processData(data) {
  console.log('Processing data:', data);
  allMarkersGroup = L.markerClusterGroup();

  data.forEach(row => {
    const { Latitude, Longitude, Nama, Desa, 'Tahun Anggaran': tahunAnggaran } = row;
    const lat = parseFloat(Latitude);
    const lon = parseFloat(Longitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      console.warn('Invalid coordinates:', lat, lon);
      return;
    }

    console.log('Adding marker:', lat, lon, Nama, Desa, tahunAnggaran);
    const marker = L.marker([lat, lon]).bindPopup(`<b>${Nama}</b><br>${Desa}<br>Tahun Anggaran: ${tahunAnggaran || 'Tidak diketahui'}`);
    
    // Add to all markers group
    allMarkersGroup.addLayer(marker);

    // Add to year-specific group if available
    if (tahunAnggaran && YEARS.includes(tahunAnggaran)) {
      clusterGroups[tahunAnggaran].addLayer(marker);
    } else {
      console.warn('Unknown or undefined Tahun Anggaran:', tahunAnggaran);
    }
  });

  // Add all markers to the map
  map.addLayer(allMarkersGroup);
}

// Add layers to map
function addLayersToMap() {
  map.addLayer(allMarkersGroup);
  YEARS.forEach(year => {
    map.addLayer(clusterGroups[year]);
  });
}

// Setup additional controls
function setupControls() {
  const overlayMaps = {
    'Semua Tahun': allMarkersGroup,
    ...YEARS.reduce((acc, year) => {
      acc[`Tahun ${year}`] = clusterGroups[year];
      return acc;
    }, {})
  };
  
  layerControl = L.control.layers(null, overlayMaps, {collapsed: false}).addTo(map);
  
  // Add event listeners to layer control checkboxes
  const layerControlElement = layerControl.getContainer();
  layerControlElement.addEventListener('change', function(e) {
    const checkbox = e.target;
    const layerName = checkbox.parentElement.textContent.trim();
    if (layerName === 'Semua Tahun') {
      if (checkbox.checked) {
        map.addLayer(allMarkersGroup);
      } else {
        map.removeLayer(allMarkersGroup);
      }
    } else {
      const year = layerName.split(' ')[1];
      if (checkbox.checked) {
        map.addLayer(clusterGroups[year]);
      } else {
        map.removeLayer(clusterGroups[year]);
      }
    }
  });

  // Ensure 'Semua Tahun' is checked by default
  const allYearsCheckbox = layerControlElement.querySelector('input[type="checkbox"]');
  if (allYearsCheckbox) {
    allYearsCheckbox.checked = true;
  }
}

// Update layer opacity
function updateOpacity(value) {
  Object.values(clusterGroups).forEach(group => {
    group.eachLayer(layer => {
      layer.setOpacity(value);
    });
  });
}

// UI Helpers
function showLoadingIndicator() {
  document.getElementById('loading').style.display = 'block';
}

function hideLoadingIndicator() {
  document.getElementById('loading').style.display = 'none';
}

function showErrorMessage(message) {
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

// Initialize the map when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeMap);