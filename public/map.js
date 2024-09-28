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
    map.setView([-7.7956, 113.4148], 12);
  }

  return map;
}

export function processData(data, map) {
  if (!map) {
    console.error('Map object is undefined in processData');
    return;
  }
  data.forEach(item => {
    const lat = parseFloat(item.Latitude);
    const lng = parseFloat(item.Longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      L.marker([lat, lng]).addTo(map)
        .bindPopup(`<b>${item.Nama}</b><br>Desa: ${item.Desa}<br>Tahun: ${item.TahunAnggaran}`);
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
          color: '#ff7800',
          weight: 2,
          opacity: 0.65
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