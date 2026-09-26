export type FieldVisibility = 'PUBLIC' | 'PRIVATE'

export type CategoryFieldConfig = {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'textarea' | 'boolean' | 'multiselect'
  required?: boolean
  placeholder?: string
  options?: string[]
  helpText?: string
  visibility?: FieldVisibility
  group?: string
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

export type CategoryConfig = {
  id: string
  name: string
  slug: string
  icon?: string
  description?: string
  fields: CategoryFieldConfig[]
}

export const DEFAULT_CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  'camera-video': {
    id: 'camera-video',
    name: 'Camera & Video',
    slug: 'camera-video',
    icon: '📸',
    description: 'Cameras, lenses, video gear, cinema rigs, and accessories',
    fields: [
      // Identification
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'e.g. Sony, Canon, RED, ARRI', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'cameraModel', label: 'Model', type: 'text', required: true, placeholder: 'e.g. FX3, A7S III, R5 C', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'cameraType', label: 'Camera Type', type: 'select', required: true, options: ['DSLR', 'Mirrorless', 'Cinema Camera', 'Action Camera', 'Camcorder', 'Lens', 'Lighting', 'Gimbal / Stabilizer', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'serialNumberPrivate', label: 'Serial Number', type: 'text', placeholder: 'Internal serial number (kept private)', group: 'Identification', visibility: 'PRIVATE' },
      
      // Technical Specifications
      { key: 'sensorType', label: 'Sensor Type', type: 'select', options: ['Full Frame', 'APS-C', 'Micro Four Thirds', 'Medium Format', 'Super 35', '1-inch', 'Other'], group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'resolution', label: 'Megapixels / Resolution', type: 'text', placeholder: 'e.g. 24.2 MP, 12.1 MP', group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'videoResolution', label: 'Max Video Resolution', type: 'select', options: ['1080p Full HD', '4K UHD', '6K Cinema', '8K DCI', 'Other'], group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'frameRates', label: 'Max Frame Rates', type: 'text', placeholder: 'e.g. 4K 120fps, 1080p 240fps', group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'lensMount', label: 'Lens Mount', type: 'select', options: ['Sony E', 'Canon EF', 'Canon RF', 'Nikon F', 'Nikon Z', 'Micro Four Thirds', 'PL Mount', 'L-Mount', 'Fuji X', 'Other'], group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'storageType', label: 'Storage Type', type: 'select', options: ['SD Card', 'CFexpress Type A', 'CFexpress Type B', 'CFAST 2.0', 'SSD / Internal', 'Other'], group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'batteryType', label: 'Battery Type', type: 'text', placeholder: 'e.g. NP-FZ100, LP-E6NH, V-Mount', group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'batteryCount', label: 'Batteries Included (Qty)', type: 'number', placeholder: '2', group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'chargerIncluded', label: 'Battery Charger Included', type: 'boolean', group: 'Technical Specifications', visibility: 'PUBLIC' },
      { key: 'memoryCardIncluded', label: 'Memory Card Included', type: 'boolean', group: 'Technical Specifications', visibility: 'PUBLIC' },

      // Rental Info
      { key: 'recommendedUse', label: 'Recommended Use', type: 'text', placeholder: 'e.g. Weddings, Commercials, Events, Documentaries', group: 'Rental Information', visibility: 'PUBLIC' },
      { key: 'cleaningInspectionTime', label: 'Inspection / Prep Buffer (mins)', type: 'number', placeholder: '30', group: 'Rental Information', visibility: 'PUBLIC' },
    ],
  },

  'mobile-tablets': {
    id: 'mobile-tablets',
    name: 'Mobile Phones & Tablets',
    slug: 'mobile-tablets',
    icon: '📱',
    description: 'Smartphones, tablets, iPads, smartwatches, and mobile accessories',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'e.g. Apple, Samsung, Google', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'deviceModel', label: 'Model', type: 'text', required: true, placeholder: 'e.g. iPhone 15 Pro Max, Galaxy S24 Ultra', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'deviceType', label: 'Device Type', type: 'select', required: true, options: ['Smartphone', 'Tablet', 'Smartwatch', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'imei1', label: 'IMEI 1 Number', type: 'text', placeholder: '15-digit IMEI 1 (Kept Private)', group: 'Identification', visibility: 'PRIVATE' },
      { key: 'imei2', label: 'IMEI 2 Number (eSIM / Dual SIM)', type: 'text', placeholder: 'Optional 15-digit IMEI 2 (Kept Private)', group: 'Identification', visibility: 'PRIVATE' },

      { key: 'operatingSystem', label: 'Operating System', type: 'select', options: ['iOS', 'Android', 'iPadOS', 'Windows', 'Other'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'storageCapacity', label: 'Storage Capacity', type: 'select', options: ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', 'Other'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'ram', label: 'RAM', type: 'text', placeholder: 'e.g. 8 GB, 12 GB', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'screenSize', label: 'Screen Size', type: 'text', placeholder: 'e.g. 6.7 inches, 11 inches', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Titanium Natural, Space Black', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'networkType', label: 'Network / SIM Support', type: 'select', options: ['Single SIM', 'Dual SIM', 'eSIM + Physical SIM', 'Wi-Fi Only', 'Wi-Fi + Cellular'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'supports5G', label: '5G Cellular Support', type: 'boolean', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'batteryHealth', label: 'Battery Health (%)', type: 'number', placeholder: 'e.g. 95', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'chargerIncluded', label: 'Charger & Cable Included', type: 'boolean', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'originalBoxIncluded', label: 'Original Box Included', type: 'boolean', group: 'Specifications', visibility: 'PUBLIC' },

      { key: 'imeiVerifiedStatus', label: 'TRCSL / IMEI Verification Status', type: 'select', options: ['TRCSL Approved', 'Pending Verification', 'International Model'], group: 'Risk & Verification', visibility: 'PUBLIC' },
      { key: 'deviceLockStatus', label: 'Device Lock Status', type: 'select', options: ['Unlocked (All Networks)', 'iCloud / Google Account Clean', 'Network Locked'], group: 'Risk & Verification', visibility: 'PUBLIC' },
      { key: 'damageNotesPrivate', label: 'Existing Scratches / Notes', type: 'textarea', placeholder: 'Private inspection notes before rental', group: 'Risk & Verification', visibility: 'PRIVATE' },
    ],
  },

  'it-equipment': {
    id: 'it-equipment',
    name: 'Laptops & IT Equipment',
    slug: 'it-equipment',
    icon: '💻',
    description: 'Laptops, MacBooks, desktops, monitors, servers, projectors, and IT hardware',
    fields: [
      { key: 'brand', label: 'Brand', type: 'text', required: true, placeholder: 'e.g. Apple, Dell, HP, Lenovo, ASUS', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'computerModel', label: 'Model Name / Number', type: 'text', required: true, placeholder: 'e.g. MacBook Pro M3 Max 16"', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'deviceType', label: 'Device Type', type: 'select', required: true, options: ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Projector', 'Server', 'Networking / Router', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'assetTag', label: 'Internal Asset Tag / Code', type: 'text', placeholder: 'Optional internal asset identifier', group: 'Identification', visibility: 'PRIVATE' },

      { key: 'processor', label: 'Processor (CPU)', type: 'text', placeholder: 'e.g. Intel Core i7-13700H, Apple M3 Pro, Ryzen 9', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'ram', label: 'RAM Memory', type: 'select', options: ['8 GB', '16 GB', '24 GB', '32 GB', '64 GB', '128 GB', 'Other'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'storageType', label: 'Storage Type', type: 'select', options: ['NVMe SSD', 'SATA SSD', 'HDD', 'Hybrid'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'storageCapacity', label: 'Storage Capacity', type: 'select', options: ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB', 'Other'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'operatingSystem', label: 'Operating System', type: 'select', options: ['macOS', 'Windows 11 Pro', 'Windows 10', 'Linux / Ubuntu', 'No OS'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'screenSize', label: 'Screen Size', type: 'text', placeholder: 'e.g. 14", 16", 27"', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'graphicsCard', label: 'GPU / Graphics Card', type: 'text', placeholder: 'e.g. NVIDIA RTX 4080 12GB, Integrated', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'chargerIncluded', label: 'Power Adapter / Charger Included', type: 'boolean', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'carryingBagIncluded', label: 'Carrying Bag / Sleeve Included', type: 'boolean', group: 'Specifications', visibility: 'PUBLIC' },
    ],
  },

  'vehicles': {
    id: 'vehicles',
    name: 'Vehicles',
    slug: 'vehicles',
    icon: '🚗',
    description: 'Cars, vans, SUVs, bikes, three-wheelers, trucks, and transport',
    fields: [
      // Vehicle Identification
      { key: 'vehicleType', label: 'Vehicle Type', type: 'select', required: true, options: ['Car', 'Van', 'SUV', 'Bike / Motorcycle', 'Three-Wheeler / Tuk', 'Truck / Lorry', 'Bus', 'Other'], group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'vehicleBrand', label: 'Vehicle Brand', type: 'text', required: true, placeholder: 'e.g. Toyota, Honda, Nissan, Suzuki, BMW', group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'vehicleModel', label: 'Vehicle Model', type: 'text', required: true, placeholder: 'e.g. Axio, Grace, Vezel, KDH, Alto', group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'manufacturingYear', label: 'Manufacturing Year', type: 'number', placeholder: 'e.g. 2021', group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'registrationNumber', label: 'Registration / License Plate Number', type: 'text', required: true, placeholder: 'e.g. CAB-1234 or WP CB-5678', group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'chassisNumber', label: 'Chassis Number (VIN)', type: 'text', required: true, placeholder: '17-digit Chassis Number (Kept Private)', group: 'Vehicle Identification', visibility: 'PRIVATE' },
      { key: 'engineNumber', label: 'Engine Number', type: 'text', placeholder: 'Engine Serial Number (Kept Private)', group: 'Vehicle Identification', visibility: 'PRIVATE' },
      { key: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Pearl White, Black', group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'fuelType', label: 'Fuel Type', type: 'select', required: true, options: ['Petrol', 'Diesel', 'Hybrid (Petrol)', 'Electric (EV)', 'Plug-in Hybrid', 'Other'], group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'transmission', label: 'Transmission', type: 'select', required: true, options: ['Automatic', 'Manual', 'Tiptronic / Semi-Auto'], group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'seatingCapacity', label: 'Seating Capacity', type: 'number', placeholder: 'e.g. 5, 7, 14', group: 'Vehicle Identification', visibility: 'PUBLIC' },
      { key: 'engineCapacity', label: 'Engine Capacity (cc)', type: 'number', placeholder: 'e.g. 1500', group: 'Vehicle Identification', visibility: 'PUBLIC' },

      // Legal Documents & Expiry Dates
      { key: 'insuranceExpiryDate', label: 'Insurance Expiry Date', type: 'date', required: true, helpText: 'Mandatory legal document expiry check', group: 'Legal Documents & Expiry Dates', visibility: 'PRIVATE' },
      { key: 'licenseExpiryDate', label: 'Revenue License Expiry Date', type: 'date', required: true, helpText: 'Mandatory revenue license validity', group: 'Legal Documents & Expiry Dates', visibility: 'PRIVATE' },
      { key: 'registrationExpiryDate', label: 'Registration Expiry Date', type: 'date', group: 'Legal Documents & Expiry Dates', visibility: 'PRIVATE' },
      { key: 'emissionTestExpiryDate', label: 'Emission Test Expiry Date', type: 'date', group: 'Legal Documents & Expiry Dates', visibility: 'PRIVATE' },
      { key: 'fitnessCertificateExpiryDate', label: 'Fitness Certificate Expiry Date', type: 'date', group: 'Legal Documents & Expiry Dates', visibility: 'PRIVATE' },
      { key: 'lastServiceDate', label: 'Last Service Date', type: 'date', group: 'Legal Documents & Expiry Dates', visibility: 'PUBLIC' },
      { key: 'nextServiceDueDate', label: 'Next Service Due Date', type: 'date', group: 'Legal Documents & Expiry Dates', visibility: 'PRIVATE' },

      // Usage Status
      { key: 'currentMileage', label: 'Current Mileage', type: 'number', required: true, placeholder: 'e.g. 45000', validation: { min: 0 }, group: 'Usage Status', visibility: 'PUBLIC' },
      { key: 'mileageUnit', label: 'Mileage Unit', type: 'select', options: ['km', 'miles'], group: 'Usage Status', visibility: 'PUBLIC' },
      { key: 'fuelLevel', label: 'Current Fuel Level', type: 'select', options: ['Full Tank', '3/4 Tank', '1/2 Tank', '1/4 Tank', 'Reserve'], group: 'Usage Status', visibility: 'PUBLIC' },
      { key: 'existingDamageNotes', label: 'Existing Damage / Inspection Notes', type: 'textarea', placeholder: 'Describe existing scratches, dents or mechanical notes', group: 'Usage Status', visibility: 'PRIVATE' },

      // Rental Settings
      { key: 'selfDriveAvailable', label: 'Self-Drive Available', type: 'boolean', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'driverIncluded', label: 'Driver Included / Available', type: 'boolean', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'driverDailyCharge', label: 'Driver Charge per Day (LKR)', type: 'number', placeholder: 'e.g. 3000', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'dailyKmAllowance', label: 'Free Mileage Allowance per Day (km)', type: 'number', placeholder: 'e.g. 100', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'extraKmCharge', label: 'Extra Mileage Charge per km (LKR)', type: 'number', placeholder: 'e.g. 80', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'lateReturnFeePerHour', label: 'Overtime / Late Return Fee per Hour (LKR)', type: 'number', placeholder: 'e.g. 500', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'deliveryAvailable', label: 'Vehicle Delivery to Customer Location', type: 'boolean', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'pickupLocation', label: 'Primary Vehicle Pickup Location / City', type: 'text', placeholder: 'e.g. Colombo 03, Nugegoda', group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'requiredDocuments', label: 'Required Customer Verification Documents', type: 'multiselect', options: ['Driving License', 'NIC', 'Passport', 'Utility Bill'], group: 'Rental Settings', visibility: 'PUBLIC' },
      { key: 'minDriverAge', label: 'Minimum Driver Age', type: 'number', placeholder: '21', group: 'Rental Settings', visibility: 'PUBLIC' },
    ],
  },

  'clothing-bridal': {
    id: 'clothing-bridal',
    name: 'Clothing & Bridal',
    slug: 'clothing-bridal',
    icon: '👗',
    description: 'Bridal wear, suits, sarees, tuxedos, costumes, shoes, and jewelry',
    fields: [
      { key: 'clothingType', label: 'Clothing Type', type: 'select', required: true, options: ['Wedding Dress / Gown', 'Men Suit / Tuxedo', 'Saree / Lehenga', 'National Outfit', 'Costume / Cosplay', 'Party Dress', 'Shoes', 'Jewelry / Crown', 'Other'], group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'designerBrand', label: 'Brand / Designer', type: 'text', placeholder: 'e.g. Designer Name or Brand', group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'size', label: 'Primary Size', type: 'select', required: true, options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Custom Measurement', 'Free Size'], group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'color', label: 'Primary Color', type: 'text', required: true, placeholder: 'e.g. Ivory White, Royal Blue, Gold', group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'materialFabric', label: 'Material / Fabric', type: 'text', placeholder: 'e.g. Silk, Satin, Velvet, Lace', group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'gender', label: 'Gender / Target Category', type: 'select', options: ['Female', 'Male', 'Unisex', 'Kids / Children'], group: 'Item Details', visibility: 'PUBLIC' },
      
      { key: 'bustMeasurement', label: 'Bust / Chest Measurement (inches)', type: 'text', placeholder: 'e.g. 34-36"', group: 'Measurements', visibility: 'PUBLIC' },
      { key: 'waistMeasurement', label: 'Waist Measurement (inches)', type: 'text', placeholder: 'e.g. 28-30"', group: 'Measurements', visibility: 'PUBLIC' },
      { key: 'hipMeasurement', label: 'Hip Measurement (inches)', type: 'text', placeholder: 'e.g. 38-40"', group: 'Measurements', visibility: 'PUBLIC' },
      { key: 'length', label: 'Length / Height (inches)', type: 'text', placeholder: 'e.g. 60"', group: 'Measurements', visibility: 'PUBLIC' },
      
      { key: 'alterationAvailable', label: 'Fitting Alterations Available', type: 'boolean', group: 'Rental & Fitting', visibility: 'PUBLIC' },
      { key: 'alterationNotes', label: 'Alteration Terms & Notes', type: 'text', placeholder: 'e.g. Temporary stitching allowed', group: 'Rental & Fitting', visibility: 'PUBLIC' },
      { key: 'fittingAppointmentRequired', label: 'Fitting Appointment Required First', type: 'boolean', group: 'Rental & Fitting', visibility: 'PUBLIC' },
      { key: 'cleaningStatus', label: 'Current Cleaning Status', type: 'select', options: ['Dry Cleaned & Ready', 'Pending Cleaning', 'Needs Alteration'], group: 'Rental & Fitting', visibility: 'PUBLIC' },
      { key: 'dryCleaningFee', label: 'Dry-Cleaning Fee (LKR)', type: 'number', placeholder: 'e.g. 1500', group: 'Rental & Fitting', visibility: 'PUBLIC' },
    ],
  },

  'party-events': {
    id: 'party-events',
    name: 'Party & Events',
    slug: 'party-events',
    icon: '🎉',
    description: 'Tents, chairs, tables, lighting, backdrops, catering equipment, and event supplies',
    fields: [
      { key: 'eventType', label: 'Item Type', type: 'select', required: true, options: ['Chair', 'Table', 'Tent / Canopy', 'Decoration / Backdrop', 'Lighting System', 'Crockery / Cutlery', 'Cooler / Ice Box', 'Generator', 'Other'], group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'quantityAvailable', label: 'Total Available Quantity (Stock)', type: 'number', required: true, placeholder: 'e.g. 100', validation: { min: 1 }, group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'unitType', label: 'Unit Type', type: 'select', options: ['Piece / Each', 'Set', 'Pack', 'Square Feet / Meter', 'Batch'], group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'color', label: 'Color / Theme', type: 'text', placeholder: 'e.g. White, Gold, Transparent', group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'dimensions', label: 'Size / Dimensions', type: 'text', placeholder: 'e.g. 20ft x 40ft', group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'seatingCapacity', label: 'Seating / Guest Capacity', type: 'number', placeholder: 'e.g. 50', group: 'Item Details', visibility: 'PUBLIC' },
      { key: 'indoorOutdoorUse', label: 'Indoor / Outdoor Compatibility', type: 'select', options: ['Both Indoor & Outdoor', 'Indoor Only', 'Outdoor Only'], group: 'Item Details', visibility: 'PUBLIC' },

      { key: 'deliveryAvailable', label: 'Transport & Delivery Service Available', type: 'boolean', group: 'Services & Setup', visibility: 'PUBLIC' },
      { key: 'deliveryCharge', label: 'Delivery Charge (LKR)', type: 'number', placeholder: 'e.g. 2500', group: 'Services & Setup', visibility: 'PUBLIC' },
      { key: 'setupServiceAvailable', label: 'Setup / Installation Service Included', type: 'boolean', group: 'Services & Setup', visibility: 'PUBLIC' },
      { key: 'setupCharge', label: 'Setup Fee (LKR)', type: 'number', placeholder: 'e.g. 1500', group: 'Services & Setup', visibility: 'PUBLIC' },
      { key: 'missingItemCharge', label: 'Charge per Missing / Broken Piece (LKR)', type: 'number', placeholder: 'e.g. 350', group: 'Services & Setup', visibility: 'PUBLIC' },
    ],
  },

  'tools-equipment': {
    id: 'tools-equipment',
    name: 'Tools & Equipment',
    slug: 'tools-equipment',
    icon: '🔧',
    description: 'Power tools, construction machinery, ladders, drills, and hardware',
    fields: [
      { key: 'toolType', label: 'Tool / Machine Type', type: 'select', required: true, options: ['Drill / Hammer Drill', 'Saw / Cutter', 'Generator', 'Pressure Washer', 'Ladder / Scaffolding', 'Welding Plant', 'Concrete Mixer', 'Compactor', 'Lawn Mower', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Bosch, Makita, DeWalt', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'model', label: 'Model Number', type: 'text', placeholder: 'e.g. GSB 18V-55', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'serialNumber', label: 'Serial Number', type: 'text', placeholder: 'Private Serial Number', group: 'Identification', visibility: 'PRIVATE' },

      { key: 'powerSource', label: 'Power Source', type: 'select', options: ['Corded Electric (230V)', 'Battery / Cordless', 'Petrol', 'Diesel', 'Manual / Hydraulic'], group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'voltage', label: 'Voltage / Wattage', type: 'text', placeholder: 'e.g. 18V, 2200W', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'hourMeterReading', label: 'Current Running Hours (Machine)', type: 'number', placeholder: 'e.g. 120', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'operatorRequired', label: 'Machine Operator Required', type: 'boolean', group: 'Usage & Safety', visibility: 'PUBLIC' },
      { key: 'operatorCharge', label: 'Operator Daily Fee (LKR)', type: 'number', placeholder: 'e.g. 3500', group: 'Usage & Safety', visibility: 'PUBLIC' },
      { key: 'safetyGearIncluded', label: 'Safety Equipment Included (Goggles, Gloves)', type: 'boolean', group: 'Usage & Safety', visibility: 'PUBLIC' },
      { key: 'instructionsIncluded', label: 'Manual / Operating Instructions Included', type: 'boolean', group: 'Usage & Safety', visibility: 'PUBLIC' },
    ],
  },

  'sports-outdoors': {
    id: 'sports-outdoors',
    name: 'Sports & Outdoors',
    slug: 'sports-outdoors',
    icon: '⚽',
    description: 'Camping tents, kayaks, bicycles, surfing gear, hiking equipment, and sports gear',
    fields: [
      { key: 'sportType', label: 'Item Type', type: 'select', required: true, options: ['Camping Tent', 'Bicycle', 'Kayak / SUP Board', 'Surfboard', 'Hiking Gear', 'Cricket / Sports Kit', 'Diving Gear', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Quechua, Giant, Decathlon', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'sizeCapacity', label: 'Size / Person Capacity', type: 'text', placeholder: 'e.g. 4-Person Tent, 29" Wheel Bike', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'weightLimit', label: 'Max Weight Limit (kg)', type: 'number', placeholder: 'e.g. 120', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'helmetIncluded', label: 'Helmet / Safety Gear Included', type: 'boolean', group: 'Safety & Gear', visibility: 'PUBLIC' },
      { key: 'cleaningRequired', label: 'Post-Rental Cleaning Required', type: 'boolean', group: 'Safety & Gear', visibility: 'PUBLIC' },
    ],
  },

  'sound-stage': {
    id: 'sound-stage',
    name: 'Sound & Stage',
    slug: 'sound-stage',
    icon: '🔊',
    description: 'PA speakers, mixers, microphones, stage lights, DJ gear, and instruments',
    fields: [
      { key: 'equipmentType', label: 'Equipment Type', type: 'select', required: true, options: ['PA Speaker', 'Subwoofer', 'Audio Mixer', 'Wireless Microphone', 'Stage Lighting', 'DJ Controller', 'Guitar Amplifier', 'Drums', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. JBL, Yamaha, Shure, Pioneer DJ', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'model', label: 'Model', type: 'text', placeholder: 'e.g. EON715, DDJ-FLX6', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'outputWattage', label: 'Power Output (RMS Wattage)', type: 'text', placeholder: 'e.g. 1300W RMS', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'channels', label: 'Mixer Channels / Inputs', type: 'text', placeholder: 'e.g. 12 Channels, 2 Mic Inputs', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'technicianRequired', label: 'Sound Engineer / Technician Required', type: 'boolean', group: 'Services', visibility: 'PUBLIC' },
      { key: 'technicianCharge', label: 'Technician Fee (LKR)', type: 'number', placeholder: 'e.g. 5000', group: 'Services', visibility: 'PUBLIC' },
    ],
  },

  'furniture-appliances': {
    id: 'furniture-appliances',
    name: 'Furniture & Appliances',
    slug: 'furniture-appliances',
    icon: '🛏️',
    description: 'Sofa sets, beds, refrigerators, washing machines, TVs, and home appliances',
    fields: [
      { key: 'itemType', label: 'Item Type', type: 'select', required: true, options: ['Sofa / Couch', 'Bed / Mattress', 'Dining Table Set', 'Refrigerator', 'Washing Machine', 'Smart TV', 'Air Conditioner', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Damro, Singer, Samsung', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'dimensions', label: 'Dimensions (LxWxH)', type: 'text', placeholder: 'e.g. 6ft x 4ft', group: 'Specifications', visibility: 'PUBLIC' },
      { key: 'deliveryAvailable', label: 'Delivery & Transport Service', type: 'boolean', group: 'Services', visibility: 'PUBLIC' },
      { key: 'installationRequired', label: 'Installation Needed on Site', type: 'boolean', group: 'Services', visibility: 'PUBLIC' },
    ],
  },

  'medical': {
    id: 'medical',
    name: 'Medical Equipment',
    slug: 'medical',
    icon: '🏥',
    description: 'Wheelchairs, hospital beds, oxygen concentrators, and home medical devices',
    fields: [
      { key: 'equipmentType', label: 'Equipment Type', type: 'select', required: true, options: ['Wheelchair', 'Electric Hospital Bed', 'Oxygen Concentrator', 'Suction Machine', 'Patient Lift', 'Air Mattress', 'Other'], group: 'Identification', visibility: 'PUBLIC' },
      { key: 'brand', label: 'Brand', type: 'text', placeholder: 'e.g. Drive Medical, Yuwell', group: 'Identification', visibility: 'PUBLIC' },
      { key: 'medicalCertNumber', label: 'Medical / Safety Certificate Number', type: 'text', placeholder: 'ISO / NMRA Certificate No.', group: 'Certifications', visibility: 'PRIVATE' },
      { key: 'sanitizationDate', label: 'Last Sanitization & Sterilization Date', type: 'date', required: true, group: 'Safety & Hygiene', visibility: 'PUBLIC' },
      { key: 'patientWeightCapacity', label: 'Max Patient Weight Capacity (kg)', type: 'number', placeholder: 'e.g. 150', group: 'Specifications', visibility: 'PUBLIC' },
    ],
  },

  'rooms-halls-studios': {
    id: 'rooms-halls-studios',
    name: 'Rooms, Halls & Studios',
    slug: 'rooms-halls-studios',
    icon: '🏠',
    description: 'Event halls, photo/video studios, meeting rooms, and venue spaces',
    fields: [
      { key: 'spaceType', label: 'Space Type', type: 'select', required: true, options: ['Banquet Hall', 'Photo / Video Studio', 'Meeting / Conference Room', 'Outdoor Lawn / Garden', 'Dance / Rehearsal Studio', 'Other'], group: 'Space Details', visibility: 'PUBLIC' },
      { key: 'capacity', label: 'Max Capacity (Guests / People)', type: 'number', required: true, placeholder: 'e.g. 200', validation: { min: 1 }, group: 'Space Details', visibility: 'PUBLIC' },
      { key: 'locationCity', label: 'Venue Location / Address', type: 'text', required: true, placeholder: 'e.g. Nugegoda, Colombo 05', group: 'Space Details', visibility: 'PUBLIC' },
      { key: 'airConditioned', label: 'Air Conditioning Available', type: 'boolean', group: 'Amenities', visibility: 'PUBLIC' },
      { key: 'wifiAvailable', label: 'High-Speed Wi-Fi Available', type: 'boolean', group: 'Amenities', visibility: 'PUBLIC' },
      { key: 'parkingCapacity', label: 'Vehicle Parking Spots', type: 'number', placeholder: 'e.g. 30', group: 'Amenities', visibility: 'PUBLIC' },
      { key: 'soundSystemIncluded', label: 'Sound System Included in Rent', type: 'boolean', group: 'Amenities', visibility: 'PUBLIC' },
    ],
  },

  'other': {
    id: 'other',
    name: 'Other',
    slug: 'other',
    icon: '📦',
    description: 'Custom categories and general rental items',
    fields: [],
  },
}

export function getCategoryConfig(slug: string, customFieldsJson?: any): CategoryConfig {
  const baseConfig = DEFAULT_CATEGORY_CONFIGS[slug] || {
    id: slug,
    name: slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Other',
    slug: slug || 'other',
    icon: '📦',
    fields: [],
  }

  // Merge custom fields defined in database or custom category JSON
  if (customFieldsJson && Array.isArray(customFieldsJson) && customFieldsJson.length > 0) {
    return {
      ...baseConfig,
      fields: [...baseConfig.fields, ...customFieldsJson],
    }
  }

  return baseConfig
}

export function validateCategoryData(
  categorySlug: string,
  categoryData: Record<string, any>,
  customFields?: CategoryFieldConfig[]
): { isValid: boolean; errors: Record<string, string> } {
  const config = getCategoryConfig(categorySlug, customFields)
  const errors: Record<string, string> = {}

  config.fields.forEach(field => {
    const val = categoryData?.[field.key]

    // Check required fields
    if (field.required) {
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        errors[field.key] = `${field.label} is required`
      }
    }

    // Number validation
    if (val !== undefined && val !== null && val !== '' && field.type === 'number') {
      const num = Number(val)
      if (isNaN(num)) {
        errors[field.key] = `${field.label} must be a valid number`
      } else if (field.validation?.min !== undefined && num < field.validation.min) {
        errors[field.key] = `${field.label} cannot be less than ${field.validation.min}`
      }
    }
  })

  // Category-specific hard constraints
  if (categorySlug === 'vehicles') {
    if (categoryData.currentMileage !== undefined && Number(categoryData.currentMileage) < 0) {
      errors.currentMileage = 'Current mileage cannot be negative'
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export function sanitizeCategoryDataForPublic(
  categorySlug: string,
  categoryData: Record<string, any> | null,
  customFields?: CategoryFieldConfig[]
): Record<string, any> {
  if (!categoryData || typeof categoryData !== 'object') return {}

  const config = getCategoryConfig(categorySlug, customFields)
  const sanitized: Record<string, any> = {}

  // Map of keys to their visibility
  const privateKeys = new Set<string>()
  config.fields.forEach(f => {
    if (f.visibility === 'PRIVATE') {
      privateKeys.add(f.key)
    }
  })

  // Hardcode explicit sensitive keys across all categories
  const globalPrivateKeys = [
    'chassisNumber', 'engineNumber', 'insurancePolicyNumber',
    'imei1', 'imei2', 'serialNumberPrivate', 'assetTag', 'medicalCertNumber',
    'damageNotesPrivate', 'internalNotes'
  ]
  globalPrivateKeys.forEach(k => privateKeys.add(k))

  Object.entries(categoryData).forEach(([key, value]) => {
    if (!privateKeys.has(key)) {
      sanitized[key] = value
    }
  })

  return sanitized
}
