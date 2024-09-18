// Constants
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRcuDcfLiekqPQHm_bUpWZ9lsrDW261au1m1raUv8dHGHp1MlYZB50yNyqEEJ-mZmiSeC2Odj4giUcD/pub?gid=0&single=true&output=csv';
const YEARS = ['2021', '2022', '2023', '2024'];
const MAP_BOUNDS = [[-7.77793, 113.38048], [-7.81793, 113.45052]];
const GEOJSON_BASE_URL = './geojson/35.13.15.geojson';
const GEOJSON_COUNT = 17;

let map;
let clusterGroups = {};
let layerControl;
let allMarkersGroup;
let boundaryLayers = L.featureGroup();

// Map initialization
function initMap() {
  map = L.map('map', {
    zoomControl: true,
    maxZoom: 19
  }).fitBounds(MAP_BOUNDS);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
  }).addTo(map);

  addMapTitle();
}

function addMapTitle() {
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
  allMarkersGroup = L.markerClusterGroup({
    showCoverageOnHover: false,
    zoomToBoundsOnClick: true,
    spiderfyOnMaxZoom: true
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
    await loadAllGeoJSON();
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

// Process fetched data
function processData(data) {
  console.log('Processing data:', data);

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
      // Tambahkan ke grup "Tidak diketahui" jika tahun anggaran tidak valid
      if (!clusterGroups['Tidak diketahui']) {
        clusterGroups['Tidak diketahui'] = L.markerClusterGroup({
          showCoverageOnHover: false,
          zoomToBoundsOnClick: true,
          spiderfyOnMaxZoom: true
        });
      }
      clusterGroups['Tidak diketahui'].addLayer(marker);
    }
  });
}

// Load all GeoJSON files
async function loadAllGeoJSON() {
  const loadPromises = [];
  for (let i = 1; i <= GEOJSON_COUNT; i++) {
    const paddedIndex = i.toString().padStart(4, '0');
    const url = `${GEOJSON_BASE_URL}${paddedIndex}.geojson`;
    loadPromises.push(loadSingleGeoJSON(url));
  }
  
  try {
    await Promise.all(loadPromises);
    console.log(`Loaded ${boundaryLayers.getLayers().length} GeoJSON layers`);
    if (boundaryLayers.getLayers().length > 0) {
      boundaryLayers.addTo(map);
      fitMapToBoundaries();
    } else {
      console.warn('No GeoJSON layers were loaded successfully');
    }
  } catch (error) {
    console.error('Error loading GeoJSON files:', error);
    showErrorMessage('Failed to load some boundary data. The map may not display all areas correctly.');
  }
}

// Load a single GeoJSON file
async function loadSingleGeoJSON(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Loaded GeoJSON from ${url}:`, data);
    
    if (!data.features || data.features.length === 0) {
      console.warn(`No features found in GeoJSON from ${url}`);
      return;
    }
    
    const geoJsonLayer = L.geoJSON(data, {
      style: {
        color: "#ff7800",
        weight: 2,
        opacity: 1,
        fillOpacity: 0.1
      }
    });
    
    console.log(`Created GeoJSON layer for ${url}:`, geoJsonLayer);
    boundaryLayers.addLayer(geoJsonLayer);
  } catch (error) {
    console.error(`Error loading GeoJSON from ${url}:`, error);
    // Tidak melempar error di sini, hanya mencatat
  }
}

// Fit map to all boundary layers
function fitMapToBoundaries() {
  if (boundaryLayers.getLayers().length > 0) {
    console.log('Fitting map to boundaries');
    const bounds = boundaryLayers.getBounds();
    console.log('Boundary bounds:', bounds);
    map.fitBounds(bounds, {
      padding: [20, 20] // 20 pixels padding on each side
    });
  } else {
    console.warn('No boundary layers to fit');
  }
}

// Add layers to map
function addLayersToMap() {
  map.addLayer(allMarkersGroup);
  YEARS.forEach(year => {
    map.addLayer(clusterGroups[year]);
  });
  map.addLayer(boundaryLayers);
  console.log('Added boundary layers to map');
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
  layerControlElement.addEventListener('change', handleLayerControlChange);

  // Ensure 'Semua Tahun' is checked by default
  const allYearsCheckbox = layerControlElement.querySelector('input[type="checkbox"]');
  if (allYearsCheckbox) {
    allYearsCheckbox.checked = true;
  }
}

function handleLayerControlChange(e) {
  const checkbox = e.target;
  const layerName = checkbox.parentElement.textContent.trim();
  if (layerName === 'Semua Tahun') {
    toggleAllMarkersLayer(checkbox.checked);
  } else {
    const year = layerName.split(' ')[1];
    toggleYearLayer(year, checkbox.checked);
  }
}

function toggleAllMarkersLayer(isChecked) {
  if (isChecked) {
    map.addLayer(allMarkersGroup);
  } else {
    map.removeLayer(allMarkersGroup);
  }
}

function toggleYearLayer(year, isChecked) {
  if (isChecked) {
    map.addLayer(clusterGroups[year]);
  } else {
    map.removeLayer(clusterGroups[year]);
  }
}

// Update layer opacity
function updateOpacity(value) {
  Object.values(clusterGroups).forEach(group => {
    group.eachLayer(layer => {
      layer.setOpacity(value);
    });
  });
  allMarkersGroup.eachLayer(layer => {
    layer.setOpacity(value);
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