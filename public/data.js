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

function detectDelimiter(csvData) {
  const delimiters = [',', ';', '\t', '|'];
  const counts = delimiters.map(delimiter => 
    csvData.split('\n')[0].split(delimiter).length - 1
  );
  const maxCount = Math.max(...counts);
  return delimiters[counts.indexOf(maxCount)];
}

function manualCSVParse(csvData, delimiter) {
  const lines = csvData.split('\n');
  const headers = lines[0].split(delimiter);
  return lines.slice(1).map(line => {
    const values = line.split(delimiter);
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index] ? values[index].trim() : '';
      return obj;
    }, {});
  });
}

export async function fetchSheetData() {
  try {
    const response = await fetch('/api/sheet-data');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    let csvData = await response.text();

    // Remove BOM if present
    csvData = csvData.replace(/^\uFEFF/, '');

    // Normalize line breaks
    csvData = csvData.replace(/\r\n/g, '\n');

    console.log('First few lines of CSV:', csvData.split('\n').slice(0, 5).join('\n'));

    // Detect delimiter
    const delimiter = detectDelimiter(csvData);
    console.log('Detected delimiter:', delimiter);

    return new Promise((resolve, reject) => {
      Papa.parse(csvData, {
        header: true,
        delimiter: delimiter,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error('CSV parsing errors:', results.errors);
          }
          if (results.data.length === 0) {
            console.warn('Papa Parse returned empty data. Attempting manual parse.');
            const manuallyParsedData = manualCSVParse(csvData, delimiter);
            console.log('Manually parsed data sample:', manuallyParsedData.slice(0, 5));
            resolve(manuallyParsedData);
          } else {
            console.log('Parsed data sample:', results.data.slice(0, 5));
            resolve(results.data);
          }
        },
        error: (error) => {
          console.error('Papa Parse error:', error);
          console.warn('Attempting manual parse due to Papa Parse error.');
          const manuallyParsedData = manualCSVParse(csvData, delimiter);
          console.log('Manually parsed data sample:', manuallyParsedData.slice(0, 5));
          resolve(manuallyParsedData);
        }
      });
    });
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw error;
  }
}