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
        console.log(`Processing item: ${item.Nama}, Lat: ${lat}, Lng: ${lng}`);
        if (!isNaN(lat) && !isNaN(lng)) {
            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: '/png/E0A9.png',
                    iconSize: [25, 25],
                    iconAnchor: [12, 12],
                    popupAnchor: [1, -34],
                })
            }).addTo(map);
            
            marker.bindPopup(`<b>${item.Nama}</b><br>Desa: ${item.Desa}<br>Tahun: ${item.TahunAnggaran}`);
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
            
            marker.bindPopup(`<b>${item.Keterangan}</b>`);
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