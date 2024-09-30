let map;
const villageLayerGroup = L.layerGroup();

export function initializeMap(mapBounds) {
  map = L.map('map');
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  if (Array.isArray(mapBounds) && mapBounds.length === 2) {
    map.fitBounds(mapBounds);
  } else {
    console.warn('Invalid map bounds, using default view');
    map.setView([-7.7956, 113.4148], 13);
  }

  return map;
}

export function processData(data, map) {
  console.log('Processing data:', data);
  if (!map) {
    console.error('Map object is undefined in processData');
    return;
  }
  data.forEach(item => {
    const lat = parseFloat(item.Latitude);
    const lng = parseFloat(item.Longitude);
    console.log(`Processing item: ${item.Nama}, Lat: ${lat}, Lng: ${lng}`);
    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: './E0A9.png',
          iconSize: [25, 25],
          iconAnchor: [10, 10],
          popupAnchor: [1, -34],
        })
      }).addTo(map);
      
      marker.bindPopup(`<b>${item.Nama}</b><br>Desa: ${item.Desa}<br>Tahun: ${item.TahunAnggaran}`);
    } else {
      console.warn(`Invalid coordinates for item: ${item.Nama}`);
    }
  });
}

export function setupControls(map) {
  if (!map) {
    console.error('Map object is undefined in setupControls');
    return;
  }
  L.control.zoom({position: 'topright'}).addTo(map);
}

export async function loadVillageBoundaries(desaIds) {
  if (!map) {
    console.error('Map object is undefined in loadVillageBoundaries');
    return;
  }
  try {
    const villagePromises = desaIds.map(async (desaId) => {
      const response = await fetch(`/api/geojson/${desaId}.geojson`);
      if (!response.ok) {
        throw new Error(`Failed to fetch GeoJSON for ${desaId}: ${response.status}`);
      }
      return await response.json();
    });

    const villages = await Promise.all(villagePromises);
    villageLayerGroup.clearLayers();
    villages.forEach((village) => {
      L.geoJSON(village, {
        style: {
          color: '#808080',
          weight: 1,
          opacity: 0.5,
          fill: false,
          fillOpacity: 0
        }
      }).addTo(villageLayerGroup);
    });
    villageLayerGroup.addTo(map);
  } catch (error) {
    console.error('Error loading village boundaries:', error);
  }
}

export function toggleVillageBoundaries(show) {
  if (show) {
    map.addLayer(villageLayerGroup);
  } else {
    map.removeLayer(villageLayerGroup);
  }
}