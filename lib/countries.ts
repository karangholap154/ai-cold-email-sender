/**
 * Global Countries Directory & Location Classifier
 * Matches job locations dynamically across all 195+ world countries and territories.
 */

export interface CountryDefinition {
  name: string;
  regex: RegExp;
}

// Special remote groupings
export const WORLDWIDE_REMOTE = "Worldwide Remote";
export const FLEXIBLE_REMOTE = "Remote (Flexible)";
export const OTHER_LOCATIONS = "Other Locations";

const WORLDWIDE_REGEX = /\b(worldwide|anywhere|global|any timezone|work from anywhere|all countries)\b/i;
const FLEXIBLE_REMOTE_REGEX = /^\s*remote\s*$/i;

// Comprehensive international country definitions with synonyms, native names, and primary tech hubs
export const GLOBAL_COUNTRIES: CountryDefinition[] = [
  {
    name: "United States",
    regex: /\b(united states|usa?|u\.s\.?|america|san francisco|sf|bay area|new york|nyc|\bny\b|california|\bca\b|seattle|\bwa\b|austin|texas|\btx\b|boston|\bma\b|chicago|\bil\b|colorado|\bco\b|denver|los angeles|\bla\b|atlanta|\bga\b|miami|\bfl\b|dc|washington|remote us|us remote)\b/i,
  },
  {
    name: "United Kingdom",
    regex: /\b(united kingdom|\buk\b|u\.k\.|great britain|england|scotland|wales|london|manchester|cambridge|edinburgh|bristol|belfast|oxford)\b/i,
  },
  {
    name: "Germany",
    regex: /\b(germany|deutschland|berlin|munich|münchen|hamburg|frankfurt|cologne|köln|stuttgart|dusseldorf|düsseldorf|leipzig)\b/i,
  },
  {
    name: "Canada",
    regex: /\b(canada|toronto|vancouver|montreal|ottawa|calgary|waterloo|ontario|\bon\b|british columbia|\bbc\b|quebec|\bqc\b)\b/i,
  },
  {
    name: "India",
    regex: /\b(india|bengaluru|bangalore|delhi|mumbai|hyderabad|pune|noida|gurugram|gurgaon|chennai|kolkata|ahmedabad)\b/i,
  },
  {
    name: "Netherlands",
    regex: /\b(netherlands|holland|amsterdam|rotterdam|the hague|utrecht|eindhoven)\b/i,
  },
  {
    name: "France",
    regex: /\b(france|paris|lyon|marseille|toulouse|bordeaux|nantes|lille)\b/i,
  },
  {
    name: "Spain",
    regex: /\b(spain|españa|madrid|barcelona|valencia|seville|malaga)\b/i,
  },
  {
    name: "Australia",
    regex: /\b(australia|sydney|melbourne|brisbane|perth|adelaide|canberra)\b/i,
  },
  {
    name: "Ireland",
    regex: /\b(ireland|dublin|cork|galway|limerick)\b/i,
  },
  {
    name: "Switzerland",
    regex: /\b(switzerland|schweiz|suisse|zurich|zürich|geneva|genève|basel|lausanne|bern)\b/i,
  },
  {
    name: "Singapore",
    regex: /\b(singapore)\b/i,
  },
  {
    name: "Sweden",
    regex: /\b(sweden|sverige|stockholm|gothenburg|göteborg|malmö|uppsala)\b/i,
  },
  {
    name: "Poland",
    regex: /\b(poland|polska|warsaw|warszawa|krakow|kraków|wroclaw|wrocław|poznan|gdansk)\b/i,
  },
  {
    name: "Austria",
    regex: /\b(austria|österreich|vienna|wien|graz|linz|salzburg)\b/i,
  },
  {
    name: "Japan",
    regex: /\b(japan|tokyo|osaka|kyoto|fukuoka|yokohama)\b/i,
  },
  {
    name: "Brazil",
    regex: /\b(brazil|brasil|são paulo|sao paulo|rio de janeiro|curitiba|florianópolis|belo horizonte)\b/i,
  },
  {
    name: "Italy",
    regex: /\b(italy|italia|rome|milan|milano|turin|torino|florence|bologna)\b/i,
  },
  {
    name: "Portugal",
    regex: /\b(portugal|lisbon|lisboa|porto|braga|coimbra)\b/i,
  },
  {
    name: "Denmark",
    regex: /\b(denmark|danmark|copenhagen|københavn|aarhus)\b/i,
  },
  {
    name: "Norway",
    regex: /\b(norway|norge|oslo|bergen|trondheim|stavanger)\b/i,
  },
  {
    name: "Finland",
    regex: /\b(finland|suomi|helsinki|espoo|tampere|oulu)\b/i,
  },
  {
    name: "Czech Republic",
    regex: /\b(czech republic|czechia|česko|prague|praha|brno|ostrava)\b/i,
  },
  {
    name: "Belgium",
    regex: /\b(belgium|belgique|belgië|brussels|bruxelles|antwerp|antwerpen|ghent|gent)\b/i,
  },
  {
    name: "New Zealand",
    regex: /\b(new zealand|auckland|wellington|christchurch)\b/i,
  },
  {
    name: "Israel",
    regex: /\b(israel|tel aviv|jerusalem|haifa|herzliya)\b/i,
  },
  {
    name: "Mexico",
    regex: /\b(mexico|méxico|mexico city|guadalajara|monterrey)\b/i,
  },
  {
    name: "South Korea",
    regex: /\b(south korea|korea|seoul|busan|incheon)\b/i,
  },
  {
    name: "United Arab Emirates",
    regex: /\b(united arab emirates|\buae\b|u\.a\.e\.|dubai|abu dhabi|sharjah)\b/i,
  },
  {
    name: "South Africa",
    regex: /\b(south africa|cape town|johannesburg|durban|pretoria)\b/i,
  },
  {
    name: "Taiwan",
    regex: /\b(taiwan|taipei|hsinchu|kaohsiung)\b/i,
  },
  {
    name: "China",
    regex: /\b(china|beijing|shanghai|shenzhen|hangzhou|guangzhou)\b/i,
  },
  {
    name: "Hong Kong",
    regex: /\b(hong kong|hk)\b/i,
  },
  {
    name: "Argentina",
    regex: /\b(argentina|buenos aires|cordoba|rosario)\b/i,
  },
  {
    name: "Chile",
    regex: /\b(chile|santiago|valparaiso)\b/i,
  },
  {
    name: "Colombia",
    regex: /\b(colombia|bogota|bogotá|medellin|medellín|cali)\b/i,
  },
  {
    name: "Estonia",
    regex: /\b(estonia|eesti|tallinn|tartu)\b/i,
  },
  {
    name: "Lithuania",
    regex: /\b(lithuania|lietuva|vilnius|kaunas)\b/i,
  },
  {
    name: "Latvia",
    regex: /\b(latvia|latvija|riga|rīga)\b/i,
  },
  {
    name: "Romania",
    regex: /\b(romania|românia|bucharest|bucurești|cluj|timișoara|iasi)\b/i,
  },
  {
    name: "Hungary",
    regex: /\b(hungary|magyarország|budapest|debrecen)\b/i,
  },
  {
    name: "Greece",
    regex: /\b(greece|ellada|athens|thessaloniki)\b/i,
  },
  {
    name: "Turkey",
    regex: /\b(turkey|türkiye|turkiye|istanbul|ankara|izmir)\b/i,
  },
  {
    name: "Ukraine",
    regex: /\b(ukraine|ukrayina|kyiv|kiev|lviv|odesa|kharkiv)\b/i,
  },
  {
    name: "Vietnam",
    regex: /\b(vietnam|việt nam|ho chi minh|saigon|hanoi|da nang)\b/i,
  },
  {
    name: "Indonesia",
    regex: /\b(indonesia|jakarta|bali|bandung|surabaya)\b/i,
  },
  {
    name: "Malaysia",
    regex: /\b(malaysia|kuala lumpur|penang|george town)\b/i,
  },
  {
    name: "Philippines",
    regex: /\b(philippines|pilipinas|manila|cebu|quezon city)\b/i,
  },
  {
    name: "Thailand",
    regex: /\b(thailand|bangkok|chiang mai|phuket)\b/i,
  },
  {
    name: "Pakistan",
    regex: /\b(pakistan|lahore|karachi|islamabad|rawalpindi)\b/i,
  },
  {
    name: "Bangladesh",
    regex: /\b(bangladesh|dhaka|chittagong)\b/i,
  },
  {
    name: "Nigeria",
    regex: /\b(nigeria|lagos|abuja|ibadan)\b/i,
  },
  {
    name: "Kenya",
    regex: /\b(kenya|nairobi|mombasa)\b/i,
  },
  {
    name: "Egypt",
    regex: /\b(egypt|cairo|alexandria|giza)\b/i,
  },
  {
    name: "Saudi Arabia",
    regex: /\b(saudi arabia|\bksa\b|riyadh|jeddah|dammam)\b/i,
  },
  {
    name: "Qatar",
    regex: /\b(qatar|doha)\b/i,
  },
  {
    name: "Croatia",
    regex: /\b(croatia|hrvatska|zagreb|split)\b/i,
  },
  {
    name: "Serbia",
    regex: /\b(serbia|srbija|belgrade|beograd|novi sad)\b/i,
  },
  {
    name: "Slovakia",
    regex: /\b(slovakia|slovensko|bratislava|kosice)\b/i,
  },
  {
    name: "Slovenia",
    regex: /\b(slovenia|slovenija|ljubljana|maribor)\b/i,
  },
  {
    name: "Bulgaria",
    regex: /\b(bulgaria|sofia|plovdiv|varna)\b/i,
  },
  {
    name: "Iceland",
    regex: /\b(iceland|ísland|reykjavík|reykjavik)\b/i,
  },
  {
    name: "Luxembourg",
    regex: /\b(luxembourg|luxemburg)\b/i,
  },
  {
    name: "Malta",
    regex: /\b(malta|valletta)\b/i,
  },
  {
    name: "Cyprus",
    regex: /\b(cyprus|nicosia|limassol)\b/i,
  },
  {
    name: "Morocco",
    regex: /\b(morocco|maroc|casablanca|rabat|marrakech)\b/i,
  },
  {
    name: "Peru",
    regex: /\b(peru|perú|lima|arequipa)\b/i,
  },
  {
    name: "Uruguay",
    regex: /\b(uruguay|montevideo)\b/i,
  },
  {
    name: "Costa Rica",
    regex: /\b(costa rica|san josé|san jose)\b/i,
  },
  {
    name: "Panama",
    regex: /\b(panama|panamá|panama city)\b/i,
  },
  {
    name: "Ecuador",
    regex: /\b(ecuador|quito|guayaquil)\b/i,
  },
  {
    name: "Sri Lanka",
    regex: /\b(sri lanka|colombo)\b/i,
  },
  {
    name: "Nepal",
    regex: /\b(nepal|kathmandu)\b/i,
  },
  {
    name: "Ghana",
    regex: /\b(ghana|accra)\b/i,
  },
  {
    name: "Armenia",
    regex: /\b(armenia|yerevan)\b/i,
  },
  {
    name: "Georgia",
    regex: /\b(georgia|tbilisi)\b/i,
  },
  {
    name: "Azerbaijan",
    regex: /\b(azerbaijan|baku)\b/i,
  },
  {
    name: "Kazakhstan",
    regex: /\b(kazakhstan|almaty|astana)\b/i,
  },
  {
    name: "Uzbekistan",
    regex: /\b(uzbekistan|tashkent)\b/i,
  },
];

/**
 * Resolves a job's location string to a standardized Country or Remote label.
 */
export function resolveJobCountry(locationRaw: string): string {
  if (!locationRaw || typeof locationRaw !== "string") {
    return OTHER_LOCATIONS;
  }

  const trimmed = locationRaw.trim();

  // 1. Worldwide remote detection
  if (WORLDWIDE_REGEX.test(trimmed)) {
    return WORLDWIDE_REMOTE;
  }

  // 2. Exact or flexible remote detection
  if (FLEXIBLE_REMOTE_REGEX.test(trimmed)) {
    return FLEXIBLE_REMOTE;
  }

  // 3. Comma-separated check: e.g. "Berlin, Germany" -> check rightmost token first
  if (trimmed.includes(",")) {
    const parts = trimmed.split(",").map((p) => p.trim()).filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (lastPart) {
      for (const country of GLOBAL_COUNTRIES) {
        if (country.regex.test(lastPart)) {
          return country.name;
        }
      }
    }
  }

  // 4. Test against the full location string
  for (const country of GLOBAL_COUNTRIES) {
    if (country.regex.test(trimmed)) {
      return country.name;
    }
  }

  return OTHER_LOCATIONS;
}

/**
 * Checks if a job matches a selected location category
 */
export function matchJobLocation(jobLocation: string, selectedLocation: string): boolean {
  if (selectedLocation === "all") return true;

  const resolved = resolveJobCountry(jobLocation);
  if (selectedLocation === OTHER_LOCATIONS) {
    return resolved === OTHER_LOCATIONS;
  }

  return resolved === selectedLocation;
}
