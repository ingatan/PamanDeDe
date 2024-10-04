export async function fetchConfig() {
  try {
    const response = await fetch('/api/config');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
}

export async function fetchSheetData() {
  try {
    const response = await fetch('/api/sheet-data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let csvData = await response.text();

    csvData = csvData.replace(/^\uFEFF/, '').replace(/^"|"$/g, '');
    const lines = csvData.split('\\r\\n');
    const headers = lines[0].split(',').map(header => header.trim());
    const parsedData = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length === headers.length) {
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] ? values[index].trim() : '';
        });
        parsedData.push(row);
      }
    }

    return parsedData;
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}

export async function fetchPlaceData() {
  try {
    const response = await fetch('/api/place-data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // tambahkan logika parsing jika salah format 

    return data;
  } catch (error) {
    console.error('Error fetching place data:', error);
    throw error;
  }
}