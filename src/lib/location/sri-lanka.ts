export interface ProvinceData {
  name: string
  districts: {
    name: string
    cities: string[]
  }[]
}

export const SRI_LANKA_LOCATIONS: ProvinceData[] = [
  {
    name: 'Western',
    districts: [
      {
        name: 'Colombo',
        cities: [
          'Colombo',
          'Dehiwala-Mount Lavinia',
          'Moratuwa',
          'Sri Jayawardenepura Kotte',
          'Maharagama',
          'Kesbewa',
          'Kaduwela',
          'Homagama',
          'Kolonnawa',
          'Hanwella',
          'Avissawella',
          'Padukka',
          'Battaramulla',
          'Nugegoda',
          'Kohuwala',
          'Piliyandala',
          'Rajagiriya',
          'Wellawatte',
        ],
      },
      {
        name: 'Gampaha',
        cities: [
          'Gampaha',
          'Negombo',
          'Ja-Ela',
          'Katunayake',
          'Wattala',
          'Kelaniya',
          'Kandana',
          'Minuwangoda',
          'Mirigama',
          'Nittambuwa',
          'Veyangoda',
          'Divulapitiya',
          'Biyagama',
          'Ragama',
          'Seeduwa',
        ],
      },
      {
        name: 'Kalutara',
        cities: [
          'Kalutara',
          'Panadura',
          'Horana',
          'Beruwala',
          'Aluthgama',
          'Matugama',
          'Bandaragama',
          'Wadduwa',
          'Agalawatte',
          'Bulathsinhala',
          'Ingiriya',
        ],
      },
    ],
  },
  {
    name: 'Central',
    districts: [
      {
        name: 'Kandy',
        cities: [
          'Kandy',
          'Peradeniya',
          'Katugastota',
          'Gampola',
          'Nawalapitiya',
          'Akurana',
          'Teldeniya',
          'Kundasale',
          'Wattegama',
          'Kadugannawa',
          'Digana',
          'Pilimathalawa',
        ],
      },
      {
        name: 'Matale',
        cities: [
          'Matale',
          'Dambulla',
          'Sigiriya',
          'Galewela',
          'Rattota',
          'Ukuwela',
          'Yatawatta',
          'Naula',
          'Palapathwela',
        ],
      },
      {
        name: 'Nuwara Eliya',
        cities: [
          'Nuwara Eliya',
          'Hatton',
          'Maskeliya',
          'Talawakele',
          'Ginigathena',
          'Walapane',
          'Ragala',
          'Kotagala',
          'Nanu Oya',
        ],
      },
    ],
  },
  {
    name: 'Southern',
    districts: [
      {
        name: 'Galle',
        cities: [
          'Galle',
          'Hikkaduwa',
          'Ambalangoda',
          'Karapitiya',
          'Bentota',
          'Elpitiya',
          'Baddegama',
          'Ahangama',
          'Koggala',
          'Unawatuna',
        ],
      },
      {
        name: 'Matara',
        cities: [
          'Matara',
          'Weligama',
          'Akuressa',
          'Dikwella',
          'Hakmana',
          'Kamburupitiya',
          'Deniyaya',
          'Mirissa',
          'Kekanadurra',
        ],
      },
      {
        name: 'Hambantota',
        cities: [
          'Hambantota',
          'Tangalle',
          'Tissamaharama',
          'Beliatta',
          'Ambalantota',
          'Walasmulla',
          'Kataragama',
          'Weerawila',
        ],
      },
    ],
  },
  {
    name: 'Northern',
    districts: [
      {
        name: 'Jaffna',
        cities: [
          'Jaffna',
          'Nallur',
          'Chavakachcheri',
          'Point Pedro',
          'Karainagar',
          'Velanai',
          'Manipay',
          'Chankanai',
          'Kopay',
        ],
      },
      {
        name: 'Kilinochchi',
        cities: [
          'Kilinochchi',
          'Pallai',
          'Poonakary',
          'Paranthan',
        ],
      },
      {
        name: 'Mannar',
        cities: [
          'Mannar',
          'Pesalai',
          'Murunkan',
          'Adampan',
        ],
      },
      {
        name: 'Mullaitivu',
        cities: [
          'Mullaitivu',
          'Puthukkudiyiruppu',
          'Oddusuddan',
          'Mulliyawalai',
        ],
      },
      {
        name: 'Vavuniya',
        cities: [
          'Vavuniya',
          'Cheddikulam',
          'Nedunkeni',
          'Omanthai',
        ],
      },
    ],
  },
  {
    name: 'Eastern',
    districts: [
      {
        name: 'Batticaloa',
        cities: [
          'Batticaloa',
          'Kattankudy',
          'Eravur',
          'Valachchenai',
          'Kaluwanchikudy',
          'Chenkalady',
        ],
      },
      {
        name: 'Ampara',
        cities: [
          'Ampara',
          'Kalmunai',
          'Sammanthurai',
          'Akkaraipattu',
          'Sainthamaruthu',
          'Pottuvil',
          'Arugam Bay',
        ],
      },
      {
        name: 'Trincomalee',
        cities: [
          'Trincomalee',
          'Kinniya',
          'Muttur',
          'Kantale',
          'Nilaveli',
          'China Bay',
        ],
      },
    ],
  },
  {
    name: 'North Western',
    districts: [
      {
        name: 'Kurunegala',
        cities: [
          'Kurunegala',
          'Kuliyapitiya',
          'Pannala',
          'Giriulla',
          'Mawathagama',
          'Wariyapola',
          'Nikaweratiya',
          'Maho',
          'Narammala',
          'Alawwa',
          'Bingiriya',
        ],
      },
      {
        name: 'Puttalam',
        cities: [
          'Puttalam',
          'Chilaw',
          'Wennappuwa',
          'Marawila',
          'Dankotuwa',
          'Anamaduwa',
          'Kalpitiya',
          'Nattandiya',
        ],
      },
    ],
  },
  {
    name: 'North Central',
    districts: [
      {
        name: 'Anuradhapura',
        cities: [
          'Anuradhapura',
          'Kekirawa',
          'Eppawala',
          'Medawachchiya',
          'Galenbindunuwewa',
          'Tambuttegama',
          'Mihintale',
          'Nochchiyagama',
        ],
      },
      {
        name: 'Polonnaruwa',
        cities: [
          'Polonnaruwa',
          'Kaduruwela',
          'Hingurakgoda',
          'Medirigiriya',
          'Dimbulagala',
        ],
      },
    ],
  },
  {
    name: 'Uva',
    districts: [
      {
        name: 'Badulla',
        cities: [
          'Badulla',
          'Bandarawela',
          'Haputale',
          'Welimada',
          'Ella',
          'Diyatalawa',
          'Mahiyanganaya',
          'Passara',
          'Hali Ela',
        ],
      },
      {
        name: 'Monaragala',
        cities: [
          'Monaragala',
          'Wellawaya',
          'Bibile',
          'Kataragama',
          'Buttala',
          'Siyambalanduwa',
        ],
      },
    ],
  },
  {
    name: 'Sabaragamuwa',
    districts: [
      {
        name: 'Ratnapura',
        cities: [
          'Ratnapura',
          'Balangoda',
          'Embilipitiya',
          'Pelmadulla',
          'Kuruwita',
          'Eheliyagoda',
          'Kahawatta',
          'Rakwana',
        ],
      },
      {
        name: 'Kegalle',
        cities: [
          'Kegalle',
          'Mawanella',
          'Rambukkana',
          'Warakapola',
          'Dehiowita',
          'Ruwanwella',
          'Yatiyantota',
          'Deraniyagala',
        ],
      },
    ],
  },
]

/**
 * Returns list of all 9 provinces in Sri Lanka.
 */
export function getAllProvinces(): string[] {
  return SRI_LANKA_LOCATIONS.map((p) => p.name)
}

/**
 * Returns list of districts belonging to a specific province.
 */
export function getDistrictsByProvince(provinceName: string): string[] {
  if (!provinceName) return []
  const province = SRI_LANKA_LOCATIONS.find(
    (p) => p.name.toLowerCase() === provinceName.toLowerCase()
  )
  return province ? province.districts.map((d) => d.name) : []
}

/**
 * Returns list of cities belonging to a specific district (or province + district).
 */
export function getCitiesByDistrict(districtName: string, provinceName?: string): string[] {
  if (!districtName) return []

  for (const province of SRI_LANKA_LOCATIONS) {
    if (provinceName && province.name.toLowerCase() !== provinceName.toLowerCase()) {
      continue
    }
    const district = province.districts.find(
      (d) => d.name.toLowerCase() === districtName.toLowerCase()
    )
    if (district) {
      return district.cities
    }
  }

  return []
}

/**
 * Returns a flat, sorted array of all unique canonical cities across Sri Lanka.
 */
export function getAllCities(): string[] {
  const citySet = new Set<string>()
  for (const province of SRI_LANKA_LOCATIONS) {
    for (const district of province.districts) {
      for (const city of district.cities) {
        citySet.add(city)
      }
    }
  }
  return Array.from(citySet).sort((a, b) => a.localeCompare(b))
}

/**
 * Resolves province and district hierarchy from a city name.
 * Useful for backwards-compatibility with existing records that only store city string.
 */
export function getLocationHierarchy(
  cityName: string
): { province: string; district: string; city: string } | null {
  if (!cityName) return null

  const searchCity = cityName.trim().toLowerCase()

  for (const province of SRI_LANKA_LOCATIONS) {
    for (const district of province.districts) {
      for (const city of district.cities) {
        if (city.toLowerCase() === searchCity) {
          return {
            province: province.name,
            district: district.name,
            city,
          }
        }
      }
    }
  }

  return null
}

/**
 * Validates whether a city exists in the canonical Sri Lanka dataset.
 */
export function isValidCity(cityName: string): boolean {
  if (!cityName || typeof cityName !== 'string') return false
  return getLocationHierarchy(cityName) !== null
}

/**
 * Validates whether a (province, district, city) combination is valid in Sri Lanka.
 */
export function isValidLocation(
  provinceName: string,
  districtName: string,
  cityName: string
): boolean {
  if (!provinceName || !districtName || !cityName) return false

  const hierarchy = getLocationHierarchy(cityName)
  if (!hierarchy) return false

  return (
    hierarchy.province.toLowerCase() === provinceName.trim().toLowerCase() &&
    hierarchy.district.toLowerCase() === districtName.trim().toLowerCase()
  )
}
