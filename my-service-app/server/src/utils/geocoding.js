// Simple geocoding utility for converting addresses to coordinates
// In production, you would use a real geocoding service like Google Maps API or OpenStreetMap Nominatim

const hcmcCoordinates = {
  'Quận 1': [10.7769, 106.7009],
  'Quận 2': [10.7851, 106.7356],
  'Quận 3': [10.7825, 106.6822],
  'Quận 4': [10.7618, 106.7030],
  'Quận 5': [10.7565, 106.6603],
  'Quận 6': [10.7524, 106.6330],
  'Quận 7': [10.7458, 106.7014],
  'Quận 8': [10.7297, 106.6435],
  'Quận 10': [10.7722, 106.6580],
  'Quận 11': [10.7616, 106.6327],
  'Quận 12': [10.8587, 106.6327],
  'Quận Bình Thạnh': [10.8085, 106.7130],
  'Quận Gò Vấp': [10.8384, 106.6510],
  'Quận Phú Nhuận': [10.8009, 106.6670],
  'Quận Tân Bình': [10.8029, 106.6296],
  'Quận Tân Phú': [10.7957, 106.6074],
  'Quận Thủ Đức': [10.8485, 106.7495],
  'Huyện Bình Chánh': [10.8234, 106.5809],
  'Huyện Hóc Môn': [10.8701, 106.6097],
  'Huyện Nhà Bè': [10.6584, 106.7089],
  'Huyện Củ Chi': [11.1137, 106.4335],
  'Huyện Cần Giờ': [10.5333, 106.7333]
};

// Default coordinates for Ho Chi Minh City
const defaultCoordinates = [10.8231, 106.6297]; // Center of HCMC

const getCoordinatesFromAddress = (address) => {
  // Try to match district names in the address
  for (const [district, coords] of Object.entries(hcmcCoordinates)) {
    if (address.toLowerCase().includes(district.toLowerCase()) || 
        address.toLowerCase().includes(district.replace('Quận ', '').toLowerCase())) {
      return coords;
    }
  }
  
  // Return default coordinates if no match found
  return defaultCoordinates;
};

module.exports = {
  getCoordinatesFromAddress
};
