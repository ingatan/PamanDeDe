import { villageMapping } from './main.js';
let map;
const villageLayerGroup = L.layerGroup();
let markers = [];
let placeMarkers = [];

export function initializeMap(mapBounds) {
    map = L.map('map', {
        zoomControl: false 
    });
    
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

export function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
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
            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: '/png/E0A9.png',
                    iconSize: [25, 25],
                    iconAnchor: [12, 12],
                    popupAnchor: [1, -34],
                })
            }).addTo(map);
            
            const popupContent = `
                <div class="custom-popup">
                    <h3>${item.Nama}</h3>
                    <p><strong>Desa:</strong> ${item.Desa}</p>
                    <p><strong>Tahun:</strong> ${item.TahunAnggaran}</p>
                    ${item.Keterangan ? `<p>${item.Keterangan}</p>` : ''}
                    ${item.ImageUrl ? `<img src="${item.ImageUrl}" alt="${item.Nama}">` : ''}
                </div>
            `;
            
            marker.bindPopup(popupContent);
            addHoverEffect(marker);
            markers.push(marker);
        } else {
            console.warn(`Invalid coordinates for item: ${item.Nama}`);
        }
    });
}

export function addPlaceMarkers(data, map) {
    if (!map) {
        console.error('Map object is undefined in addPlaceMarkers');
        return;
    }
    placeMarkers.forEach(marker => map.removeLayer(marker));
    placeMarkers = [];
    
    data.forEach(item => {
        const lat = parseFloat(item.Latitude);
        const lng = parseFloat(item.Longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
            const iconUrl = getIconUrlByCode(item.Kode);
            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: iconUrl,
                    iconSize: [25, 25],
                    iconAnchor: [12, 12],
                    popupAnchor: [1, -34],
                })
            }).addTo(map);
            
            const popupContent = `
                <div class="custom-popup">
                    <h3>${item.Keterangan}</h3>
                    ${item.Deskripsi ? `<p>${item.Deskripsi}</p>` : ''}
                    ${item.ImageUrl ? `<img src="${item.ImageUrl}" alt="${item.Keterangan}">` : ''}
                </div>
            `;
            
            marker.bindPopup(popupContent);
            addHoverEffect(marker);
            placeMarkers.push(marker);
        } else {
            console.warn(`Invalid coordinates for place: ${item.Keterangan}`);
        }
    });
}

function addHoverEffect(marker) {
    marker.on('mouseover', function (e) {
        this.openPopup();
        this.setZIndexOffset(1000); 
        this.getElement().style.transform += ' scale(1.2)';
        this.getElement().style.transition = 'transform 0.3s';
    });
    
    marker.on('mouseout', function (e) {
        this.closePopup();
        this.setZIndexOffset(0);
        this.getElement().style.transform = this.getElement().style.transform.replace(' scale(1.2)', '');
    });
}

function getIconUrlByCode(code) {
  switch (code) {
    case 1:
      return './png/balai.png';
    case 2:
      return './png/kantor.png';
    case 3:
      return './png/koramil.png';
    case 4:
      return './png/polisi.png';      
    case 5:
      return './png/puskesmas.png';
    case 6:
      return './png/kua.png';
    case 7:
      return './png/garpu.png';  
    default:
      return './default.png';
  }
}

export function setupControls(map) {
    if (!map) {
        console.error('Map object is undefined in setupControls');
        return;
    }
    L.control.zoom({position: 'topright'}).addTo(map);
}

let villageGeoJSONs = {};

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
            return { id: desaId, data: await response.json() };
        });

        const villages = await Promise.all(villagePromises);
        villageLayerGroup.clearLayers();
        villages.forEach((village) => {
            villageGeoJSONs[village.id] = village.data;
            L.geoJSON(village.data, {
                style: {
                    color: '#FF69B4',
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

export function focusOnVillage(villageName) {
    console.log('focusOnVillage called with:', villageName);
    console.log('Available villageGeoJSONs:', Object.keys(villageGeoJSONs));
    
    const villageCode = villageMapping[villageName];
    console.log('Village code:', villageCode);
    
    if (!villageCode) {
        console.warn(`Village code not found for: ${villageName}`);
        return;
    }
    
    const villageGeoJSON = villageGeoJSONs[villageCode];
    if (villageGeoJSON) {
        console.log('GeoJSON found for village:', villageName);
        const bounds = L.geoJSON(villageGeoJSON).getBounds();
        console.log('Bounds:', bounds);
        map.fitBounds(bounds, { padding: [50, 50] });
    } else {
        console.warn(`GeoJSON data not found for village code: ${villageCode}`);
    }
}