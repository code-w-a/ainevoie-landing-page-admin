// Static Romania county + urban locality dataset generated from INS/SIRUTA 2025.
// Source: https://data.gov.ro/ro/dataset/siruta

export type RomaniaCounty = {
  code: string;
  name: string;
  slug: string;
};

export type RomaniaLocalityType =
  | "capital"
  | "county_seat_municipality"
  | "municipality"
  | "sector"
  | "town";

export type RomaniaUrbanLocality = {
  countyCode: string;
  countyName: string;
  cityCode: string;
  cityName: string;
  citySlug: string;
  type: RomaniaLocalityType;
};

export const ROMANIA_COUNTIES = [
  { code: "AB", name: "Alba", slug: "alba" },
  { code: "AR", name: "Arad", slug: "arad" },
  { code: "AG", name: "Argeș", slug: "arges" },
  { code: "BC", name: "Bacău", slug: "bacau" },
  { code: "BH", name: "Bihor", slug: "bihor" },
  { code: "BN", name: "Bistrița-Năsăud", slug: "bistrita-nasaud" },
  { code: "BT", name: "Botoșani", slug: "botosani" },
  { code: "BV", name: "Brașov", slug: "brasov" },
  { code: "BR", name: "Brăila", slug: "braila" },
  { code: "B", name: "București", slug: "bucuresti" },
  { code: "BZ", name: "Buzău", slug: "buzau" },
  { code: "CS", name: "Caraș-Severin", slug: "caras-severin" },
  { code: "CL", name: "Călărași", slug: "calarasi" },
  { code: "CJ", name: "Cluj", slug: "cluj" },
  { code: "CT", name: "Constanța", slug: "constanta" },
  { code: "CV", name: "Covasna", slug: "covasna" },
  { code: "DB", name: "Dâmbovița", slug: "dambovita" },
  { code: "DJ", name: "Dolj", slug: "dolj" },
  { code: "GL", name: "Galați", slug: "galati" },
  { code: "GR", name: "Giurgiu", slug: "giurgiu" },
  { code: "GJ", name: "Gorj", slug: "gorj" },
  { code: "HR", name: "Harghita", slug: "harghita" },
  { code: "HD", name: "Hunedoara", slug: "hunedoara" },
  { code: "IL", name: "Ialomița", slug: "ialomita" },
  { code: "IS", name: "Iași", slug: "iasi" },
  { code: "IF", name: "Ilfov", slug: "ilfov" },
  { code: "MM", name: "Maramureș", slug: "maramures" },
  { code: "MH", name: "Mehedinți", slug: "mehedinti" },
  { code: "MS", name: "Mureș", slug: "mures" },
  { code: "NT", name: "Neamț", slug: "neamt" },
  { code: "OT", name: "Olt", slug: "olt" },
  { code: "PH", name: "Prahova", slug: "prahova" },
  { code: "SM", name: "Satu Mare", slug: "satu-mare" },
  { code: "SJ", name: "Sălaj", slug: "salaj" },
  { code: "SB", name: "Sibiu", slug: "sibiu" },
  { code: "SV", name: "Suceava", slug: "suceava" },
  { code: "TR", name: "Teleorman", slug: "teleorman" },
  { code: "TM", name: "Timiș", slug: "timis" },
  { code: "TL", name: "Tulcea", slug: "tulcea" },
  { code: "VS", name: "Vaslui", slug: "vaslui" },
  { code: "VL", name: "Vâlcea", slug: "valcea" },
  { code: "VN", name: "Vrancea", slug: "vrancea" },
] as const satisfies readonly RomaniaCounty[];

export const ROMANIA_URBAN_LOCALITIES = [
  { countyCode: "AB", countyName: "Alba", cityCode: "1151", cityName: "Abrud", citySlug: "abrud", type: "town" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1213", cityName: "Aiud", citySlug: "aiud", type: "municipality" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1017", cityName: "Alba Iulia", citySlug: "alba-iulia", type: "county_seat_municipality" },
  { countyCode: "AB", countyName: "Alba", cityCode: "2915", cityName: "Baia de Arieș", citySlug: "baia-de-aries", type: "town" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1348", cityName: "Blaj", citySlug: "blaj", type: "municipality" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1455", cityName: "Câmpeni", citySlug: "campeni", type: "town" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1696", cityName: "Cugir", citySlug: "cugir", type: "town" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1794", cityName: "Ocna Mureș", citySlug: "ocna-mures", type: "town" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1874", cityName: "Sebeș", citySlug: "sebes", type: "municipality" },
  { countyCode: "AB", countyName: "Alba", cityCode: "8096", cityName: "Teiuș", citySlug: "teius", type: "town" },
  { countyCode: "AB", countyName: "Alba", cityCode: "1936", cityName: "Zlatna", citySlug: "zlatna", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9262", cityName: "Arad", citySlug: "arad", type: "county_seat_municipality" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9459", cityName: "Chișineu-Criș", citySlug: "chisineu-cris", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9495", cityName: "Curtici", citySlug: "curtici", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9538", cityName: "Ineu", citySlug: "ineu", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9574", cityName: "Lipova", citySlug: "lipova", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9627", cityName: "Nădlac", citySlug: "nadlac", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9654", cityName: "Pâncota", citySlug: "pancota", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "11584", cityName: "Pecica", citySlug: "pecica", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "12091", cityName: "Sântana", citySlug: "santana", type: "town" },
  { countyCode: "AR", countyName: "Arad", cityCode: "9690", cityName: "Sebiș", citySlug: "sebis", type: "town" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13490", cityName: "Câmpulung", citySlug: "campulung", type: "municipality" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13668", cityName: "Costești", citySlug: "costesti", type: "town" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13622", cityName: "Curtea de Argeș", citySlug: "curtea-de-arges", type: "municipality" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13301", cityName: "Mioveni", citySlug: "mioveni", type: "town" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13169", cityName: "Pitești", citySlug: "pitesti", type: "county_seat_municipality" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13392", cityName: "Ștefănești", citySlug: "stefanesti", type: "town" },
  { countyCode: "AG", countyName: "Argeș", cityCode: "13757", cityName: "Topoloveni", citySlug: "topoloveni", type: "town" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20297", cityName: "Bacău", citySlug: "bacau", type: "county_seat_municipality" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20778", cityName: "Buhuși", citySlug: "buhusi", type: "town" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20821", cityName: "Comănești", citySlug: "comanesti", type: "town" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "22166", cityName: "Dărmănești", citySlug: "darmanesti", type: "town" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20876", cityName: "Moinești", citySlug: "moinesti", type: "municipality" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20563", cityName: "Onești", citySlug: "onesti", type: "municipality" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20910", cityName: "Slănic-Moldova", citySlug: "slanic-moldova", type: "town" },
  { countyCode: "BC", countyName: "Bacău", cityCode: "20965", cityName: "Târgu Ocna", citySlug: "targu-ocna", type: "town" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26699", cityName: "Aleșd", citySlug: "alesd", type: "town" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26804", cityName: "Beiuș", citySlug: "beius", type: "municipality" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26877", cityName: "Marghita", citySlug: "marghita", type: "municipality" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26920", cityName: "Nucet", citySlug: "nucet", type: "town" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26564", cityName: "Oradea", citySlug: "oradea", type: "county_seat_municipality" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26975", cityName: "Salonta", citySlug: "salonta", type: "municipality" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "30915", cityName: "Săcueni", citySlug: "sacueni", type: "town" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "26840", cityName: "Ștei", citySlug: "stei", type: "town" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "32027", cityName: "Valea lui Mihai", citySlug: "valea-lui-mihai", type: "town" },
  { countyCode: "BH", countyName: "Bihor", cityCode: "27007", cityName: "Vașcău", citySlug: "vascau", type: "town" },
  { countyCode: "BN", countyName: "Bistrița-Năsăud", cityCode: "32483", cityName: "Beclean", citySlug: "beclean", type: "town" },
  { countyCode: "BN", countyName: "Bistrița-Năsăud", cityCode: "32394", cityName: "Bistrița", citySlug: "bistrita", type: "county_seat_municipality" },
  { countyCode: "BN", countyName: "Bistrița-Năsăud", cityCode: "32544", cityName: "Năsăud", citySlug: "nasaud", type: "town" },
  { countyCode: "BN", countyName: "Bistrița-Năsăud", cityCode: "32599", cityName: "Sângeorz-Băi", citySlug: "sangeorz-bai", type: "town" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "35731", cityName: "Botoșani", citySlug: "botosani", type: "county_seat_municipality" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "36453", cityName: "Bucecea", citySlug: "bucecea", type: "town" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "35946", cityName: "Darabani", citySlug: "darabani", type: "town" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "36006", cityName: "Dorohoi", citySlug: "dorohoi", type: "municipality" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "37280", cityName: "Flămânzi", citySlug: "flamanzi", type: "town" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "36060", cityName: "Săveni", citySlug: "saveni", type: "town" },
  { countyCode: "BT", countyName: "Botoșani", cityCode: "39168", cityName: "Ștefănești", citySlug: "stefanesti", type: "town" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40198", cityName: "Brașov", citySlug: "brasov", type: "county_seat_municipality" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40241", cityName: "Codlea", citySlug: "codlea", type: "municipality" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40278", cityName: "Făgăraș", citySlug: "fagaras", type: "municipality" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40214", cityName: "Ghimbav", citySlug: "ghimbav", type: "town" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40303", cityName: "Predeal", citySlug: "predeal", type: "town" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40367", cityName: "Râșnov", citySlug: "rasnov", type: "town" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40394", cityName: "Rupea", citySlug: "rupea", type: "town" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40438", cityName: "Săcele", citySlug: "sacele", type: "municipality" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40465", cityName: "Victoria", citySlug: "victoria", type: "town" },
  { countyCode: "BV", countyName: "Brașov", cityCode: "40492", cityName: "Zărnești", citySlug: "zarnesti", type: "town" },
  { countyCode: "BR", countyName: "Brăila", cityCode: "42682", cityName: "Brăila", citySlug: "braila", type: "county_seat_municipality" },
  { countyCode: "BR", countyName: "Brăila", cityCode: "42753", cityName: "Făurei", citySlug: "faurei", type: "town" },
  { countyCode: "BR", countyName: "Brăila", cityCode: "43331", cityName: "Ianca", citySlug: "ianca", type: "town" },
  { countyCode: "BR", countyName: "Brăila", cityCode: "43411", cityName: "Însurăței", citySlug: "insuratei", type: "town" },
  { countyCode: "B", countyName: "București", cityCode: "179141", cityName: "Sector 1", citySlug: "sector-1", type: "sector" },
  { countyCode: "B", countyName: "București", cityCode: "179150", cityName: "Sector 2", citySlug: "sector-2", type: "sector" },
  { countyCode: "B", countyName: "București", cityCode: "179169", cityName: "Sector 3", citySlug: "sector-3", type: "sector" },
  { countyCode: "B", countyName: "București", cityCode: "179178", cityName: "Sector 4", citySlug: "sector-4", type: "sector" },
  { countyCode: "B", countyName: "București", cityCode: "179187", cityName: "Sector 5", citySlug: "sector-5", type: "sector" },
  { countyCode: "B", countyName: "București", cityCode: "179196", cityName: "Sector 6", citySlug: "sector-6", type: "sector" },
  { countyCode: "BZ", countyName: "Buzău", cityCode: "44818", cityName: "Buzău", citySlug: "buzau", type: "county_seat_municipality" },
  { countyCode: "BZ", countyName: "Buzău", cityCode: "47916", cityName: "Nehoiu", citySlug: "nehoiu", type: "town" },
  { countyCode: "BZ", countyName: "Buzău", cityCode: "48325", cityName: "Pătârlagele", citySlug: "patarlagele", type: "town" },
  { countyCode: "BZ", countyName: "Buzău", cityCode: "48744", cityName: "Pogoanele", citySlug: "pogoanele", type: "town" },
  { countyCode: "BZ", countyName: "Buzău", cityCode: "44845", cityName: "Râmnicu Sărat", citySlug: "ramnicu-sarat", type: "municipality" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "50889", cityName: "Anina", citySlug: "anina", type: "town" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "50923", cityName: "Băile Herculane", citySlug: "baile-herculane", type: "town" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "50969", cityName: "Bocșa", citySlug: "bocsa", type: "town" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "51010", cityName: "Caransebeș", citySlug: "caransebes", type: "municipality" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "51056", cityName: "Moldova Nouă", citySlug: "moldova-noua", type: "town" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "51118", cityName: "Oravița", citySlug: "oravita", type: "town" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "51207", cityName: "Oțelu Roșu", citySlug: "otelu-rosu", type: "town" },
  { countyCode: "CS", countyName: "Caraș-Severin", cityCode: "50790", cityName: "Reșița", citySlug: "resita", type: "county_seat_municipality" },
  { countyCode: "CL", countyName: "Călărași", cityCode: "101458", cityName: "Budești", citySlug: "budesti", type: "town" },
  { countyCode: "CL", countyName: "Călărași", cityCode: "92569", cityName: "Călărași", citySlug: "calarasi", type: "county_seat_municipality" },
  { countyCode: "CL", countyName: "Călărași", cityCode: "103032", cityName: "Fundulea", citySlug: "fundulea", type: "town" },
  { countyCode: "CL", countyName: "Călărași", cityCode: "93888", cityName: "Lehliu-Gară", citySlug: "lehliu-gara", type: "town" },
  { countyCode: "CL", countyName: "Călărași", cityCode: "100610", cityName: "Oltenița", citySlug: "oltenita", type: "municipality" },
  { countyCode: "CJ", countyName: "Cluj", cityCode: "55357", cityName: "Câmpia Turzii", citySlug: "campia-turzii", type: "municipality" },
  { countyCode: "CJ", countyName: "Cluj", cityCode: "54975", cityName: "Cluj-Napoca", citySlug: "cluj-napoca", type: "county_seat_municipality" },
  { countyCode: "CJ", countyName: "Cluj", cityCode: "55008", cityName: "Dej", citySlug: "dej", type: "municipality" },
  { countyCode: "CJ", countyName: "Cluj", cityCode: "55384", cityName: "Gherla", citySlug: "gherla", type: "municipality" },
  { countyCode: "CJ", countyName: "Cluj", cityCode: "55446", cityName: "Huedin", citySlug: "huedin", type: "town" },
  { countyCode: "CJ", countyName: "Cluj", cityCode: "55259", cityName: "Turda", citySlug: "turda", type: "municipality" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60776", cityName: "Cernavodă", citySlug: "cernavoda", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60419", cityName: "Constanța", citySlug: "constanta", type: "county_seat_municipality" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60455", cityName: "Eforie", citySlug: "eforie", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60801", cityName: "Hârșova", citySlug: "harsova", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60482", cityName: "Mangalia", citySlug: "mangalia", type: "municipality" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60847", cityName: "Medgidia", citySlug: "medgidia", type: "municipality" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "62360", cityName: "Murfatlar", citySlug: "murfatlar", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60507", cityName: "Năvodari", citySlug: "navodari", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "62397", cityName: "Negru Vodă", citySlug: "negru-voda", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60687", cityName: "Ovidiu", citySlug: "ovidiu", type: "town" },
  { countyCode: "CT", countyName: "Constanța", cityCode: "60534", cityName: "Techirghiol", citySlug: "techirghiol", type: "town" },
  { countyCode: "CV", countyName: "Covasna", cityCode: "63447", cityName: "Baraolt", citySlug: "baraolt", type: "town" },
  { countyCode: "CV", countyName: "Covasna", cityCode: "63526", cityName: "Covasna", citySlug: "covasna", type: "town" },
  { countyCode: "CV", countyName: "Covasna", cityCode: "63580", cityName: "Întorsura Buzăului", citySlug: "intorsura-buzaului", type: "town" },
  { countyCode: "CV", countyName: "Covasna", cityCode: "63394", cityName: "Sfântu Gheorghe", citySlug: "sfantu-gheorghe", type: "county_seat_municipality" },
  { countyCode: "CV", countyName: "Covasna", cityCode: "63740", cityName: "Târgu Secuiesc", citySlug: "targu-secuiesc", type: "municipality" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "65609", cityName: "Fieni", citySlug: "fieni", type: "town" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "65681", cityName: "Găești", citySlug: "gaesti", type: "town" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "65841", cityName: "Moreni", citySlug: "moreni", type: "municipality" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "65921", cityName: "Pucioasa", citySlug: "pucioasa", type: "town" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "68627", cityName: "Răcari", citySlug: "racari", type: "town" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "65342", cityName: "Târgoviște", citySlug: "targoviste", type: "county_seat_municipality" },
  { countyCode: "DB", countyName: "Dâmbovița", cityCode: "66081", cityName: "Titu", citySlug: "titu", type: "town" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "70316", cityName: "Băilești", citySlug: "bailesti", type: "municipality" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "70879", cityName: "Bechet", citySlug: "bechet", type: "town" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "70352", cityName: "Calafat", citySlug: "calafat", type: "municipality" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "69900", cityName: "Craiova", citySlug: "craiova", type: "county_seat_municipality" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "72007", cityName: "Dăbuleni", citySlug: "dabuleni", type: "town" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "70414", cityName: "Filiași", citySlug: "filiasi", type: "town" },
  { countyCode: "DJ", countyName: "Dolj", cityCode: "70502", cityName: "Segarcea", citySlug: "segarcea", type: "town" },
  { countyCode: "GL", countyName: "Galați", cityCode: "75338", cityName: "Berești", citySlug: "beresti", type: "town" },
  { countyCode: "GL", countyName: "Galați", cityCode: "75098", cityName: "Galați", citySlug: "galati", type: "county_seat_municipality" },
  { countyCode: "GL", countyName: "Galați", cityCode: "75472", cityName: "Târgu Bujor", citySlug: "targu-bujor", type: "town" },
  { countyCode: "GL", countyName: "Galați", cityCode: "75203", cityName: "Tecuci", citySlug: "tecuci", type: "municipality" },
  { countyCode: "GR", countyName: "Giurgiu", cityCode: "101190", cityName: "Bolintin-Vale", citySlug: "bolintin-vale", type: "town" },
  { countyCode: "GR", countyName: "Giurgiu", cityCode: "100521", cityName: "Giurgiu", citySlug: "giurgiu", type: "county_seat_municipality" },
  { countyCode: "GR", countyName: "Giurgiu", cityCode: "104136", cityName: "Mihăilești", citySlug: "mihailesti", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "79308", cityName: "Bumbești-Jiu", citySlug: "bumbesti-jiu", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "78141", cityName: "Motru", citySlug: "motru", type: "municipality" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "78258", cityName: "Novaci", citySlug: "novaci", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "82895", cityName: "Rovinari", citySlug: "rovinari", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "78329", cityName: "Târgu Cărbunești", citySlug: "targu-carbunesti", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "77812", cityName: "Târgu Jiu", citySlug: "targu-jiu", type: "county_seat_municipality" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "82430", cityName: "Tismana", citySlug: "tismana", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "82617", cityName: "Turceni", citySlug: "turceni", type: "town" },
  { countyCode: "GJ", countyName: "Gorj", cityCode: "78454", cityName: "Țicleni", citySlug: "ticleni", type: "town" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83428", cityName: "Băile Tușnad", citySlug: "baile-tusnad", type: "town" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83464", cityName: "Bălan", citySlug: "balan", type: "town" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83491", cityName: "Borsec", citySlug: "borsec", type: "town" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83525", cityName: "Cristuru Secuiesc", citySlug: "cristuru-secuiesc", type: "town" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83561", cityName: "Gheorgheni", citySlug: "gheorgheni", type: "municipality" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83320", cityName: "Miercurea Ciuc", citySlug: "miercurea-ciuc", type: "county_seat_municipality" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83133", cityName: "Odorheiu Secuiesc", citySlug: "odorheiu-secuiesc", type: "municipality" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83632", cityName: "Toplița", citySlug: "toplita", type: "municipality" },
  { countyCode: "HR", countyName: "Harghita", cityCode: "83749", cityName: "Vlăhița", citySlug: "vlahita", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87219", cityName: "Aninoasa", citySlug: "aninoasa", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87291", cityName: "Brad", citySlug: "brad", type: "municipality" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87424", cityName: "Călan", citySlug: "calan", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "86687", cityName: "Deva", citySlug: "deva", type: "county_seat_municipality" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "89561", cityName: "Geoagiu", citySlug: "geoagiu", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87576", cityName: "Hațeg", citySlug: "hateg", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "86810", cityName: "Hunedoara", citySlug: "hunedoara", type: "municipality" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87059", cityName: "Lupeni", citySlug: "lupeni", type: "municipality" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87638", cityName: "Orăștie", citySlug: "orastie", type: "municipality" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87077", cityName: "Petrila", citySlug: "petrila", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "86990", cityName: "Petroșani", citySlug: "petrosani", type: "municipality" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87665", cityName: "Simeria", citySlug: "simeria", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87139", cityName: "Uricani", citySlug: "uricani", type: "town" },
  { countyCode: "HD", countyName: "Hunedoara", cityCode: "87175", cityName: "Vulcan", citySlug: "vulcan", type: "municipality" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "92836", cityName: "Amara", citySlug: "amara", type: "town" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "93067", cityName: "Căzănești", citySlug: "cazanesti", type: "town" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "92701", cityName: "Fetești", citySlug: "fetesti", type: "municipality" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "102749", cityName: "Fierbinți-Târg", citySlug: "fierbinti-targ", type: "town" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "92658", cityName: "Slobozia", citySlug: "slobozia", type: "county_seat_municipality" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "92765", cityName: "Țăndărei", citySlug: "tandarei", type: "town" },
  { countyCode: "IL", countyName: "Ialomița", cityCode: "100683", cityName: "Urziceni", citySlug: "urziceni", type: "municipality" },
  { countyCode: "IS", countyName: "Iași", cityCode: "95355", cityName: "Hârlău", citySlug: "harlau", type: "town" },
  { countyCode: "IS", countyName: "Iași", cityCode: "95060", cityName: "Iași", citySlug: "iasi", type: "county_seat_municipality" },
  { countyCode: "IS", countyName: "Iași", cityCode: "95391", cityName: "Pașcani", citySlug: "pascani", type: "municipality" },
  { countyCode: "IS", countyName: "Iași", cityCode: "98373", cityName: "Podu Iloaiei", citySlug: "podu-iloaiei", type: "town" },
  { countyCode: "IS", countyName: "Iași", cityCode: "95471", cityName: "Târgu Frumos", citySlug: "targu-frumos", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179221", cityName: "Bragadiru", citySlug: "bragadiru", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "100576", cityName: "Buftea", citySlug: "buftea", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179285", cityName: "Chitila", citySlug: "chitila", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179409", cityName: "Măgurele", citySlug: "magurele", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179481", cityName: "Otopeni", citySlug: "otopeni", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179515", cityName: "Pantelimon", citySlug: "pantelimon", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179533", cityName: "Popești-Leordeni", citySlug: "popesti-leordeni", type: "town" },
  { countyCode: "IF", countyName: "Ilfov", cityCode: "179551", cityName: "Voluntari", citySlug: "voluntari", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106318", cityName: "Baia Mare", citySlug: "baia-mare", type: "county_seat_municipality" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106684", cityName: "Baia Sprie", citySlug: "baia-sprie", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106746", cityName: "Borșa", citySlug: "borsa", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106782", cityName: "Cavnic", citySlug: "cavnic", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "108017", cityName: "Dragomirești", citySlug: "dragomiresti", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "108892", cityName: "Săliștea de Sus", citySlug: "salistea-de-sus", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "108963", cityName: "Seini", citySlug: "seini", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106559", cityName: "Sighetu Marmației", citySlug: "sighetu-marmatiei", type: "municipality" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "109176", cityName: "Șomcuta Mare", citySlug: "somcuta-mare", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106461", cityName: "Tăuții-Măgherăuș", citySlug: "tautii-magheraus", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106817", cityName: "Târgu Lăpuș", citySlug: "targu-lapus", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "109265", cityName: "Ulmeni", citySlug: "ulmeni", type: "town" },
  { countyCode: "MM", countyName: "Maramureș", cityCode: "106979", cityName: "Vișeu de Sus", citySlug: "viseu-de-sus", type: "town" },
  { countyCode: "MH", countyName: "Mehedinți", cityCode: "109924", cityName: "Baia de Aramă", citySlug: "baia-de-arama", type: "town" },
  { countyCode: "MH", countyName: "Mehedinți", cityCode: "109773", cityName: "Drobeta-Turnu Severin", citySlug: "drobeta-turnu-severin", type: "county_seat_municipality" },
  { countyCode: "MH", countyName: "Mehedinți", cityCode: "110063", cityName: "Orșova", citySlug: "orsova", type: "municipality" },
  { countyCode: "MH", countyName: "Mehedinți", cityCode: "110116", cityName: "Strehaia", citySlug: "strehaia", type: "town" },
  { countyCode: "MH", countyName: "Mehedinți", cityCode: "110232", cityName: "Vânju Mare", citySlug: "vanju-mare", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "117827", cityName: "Iernut", citySlug: "iernut", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "114710", cityName: "Luduș", citySlug: "ludus", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "118281", cityName: "Miercurea Nirajului", citySlug: "miercurea-nirajului", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "114809", cityName: "Reghin", citySlug: "reghin", type: "municipality" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "119242", cityName: "Sărmașu", citySlug: "sarmasu", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "119331", cityName: "Sângeorgiu de Pădure", citySlug: "sangeorgiu-de-padure", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "114514", cityName: "Sighișoara", citySlug: "sighisoara", type: "municipality" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "114854", cityName: "Sovata", citySlug: "sovata", type: "town" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "114319", cityName: "Târgu Mureș", citySlug: "targu-mures", type: "county_seat_municipality" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "114925", cityName: "Târnăveni", citySlug: "tarnaveni", type: "municipality" },
  { countyCode: "MS", countyName: "Mureș", cityCode: "119894", cityName: "Ungheni", citySlug: "ungheni", type: "town" },
  { countyCode: "NT", countyName: "Neamț", cityCode: "120968", cityName: "Bicaz", citySlug: "bicaz", type: "town" },
  { countyCode: "NT", countyName: "Neamț", cityCode: "120726", cityName: "Piatra-Neamț", citySlug: "piatra-neamt", type: "county_seat_municipality" },
  { countyCode: "NT", countyName: "Neamț", cityCode: "120860", cityName: "Roman", citySlug: "roman", type: "municipality" },
  { countyCode: "NT", countyName: "Neamț", cityCode: "124117", cityName: "Roznov", citySlug: "roznov", type: "town" },
  { countyCode: "NT", countyName: "Neamț", cityCode: "121055", cityName: "Târgu Neamț", citySlug: "targu-neamt", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "125418", cityName: "Balș", citySlug: "bals", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "125472", cityName: "Caracal", citySlug: "caracal", type: "municipality" },
  { countyCode: "OT", countyName: "Olt", cityCode: "125542", cityName: "Corabia", citySlug: "corabia", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "125622", cityName: "Drăgănești-Olt", citySlug: "draganesti-olt", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "128105", cityName: "Piatra-Olt", citySlug: "piatra-olt", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "128374", cityName: "Potcoava", citySlug: "potcoava", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "128711", cityName: "Scornicești", citySlug: "scornicesti", type: "town" },
  { countyCode: "OT", countyName: "Olt", cityCode: "125347", cityName: "Slatina", citySlug: "slatina", type: "county_seat_municipality" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "130954", cityName: "Azuga", citySlug: "azuga", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "130981", cityName: "Băicoi", citySlug: "baicoi", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131069", cityName: "Boldești-Scăeni", citySlug: "boldesti-scaeni", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131103", cityName: "Breaza", citySlug: "breaza", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131210", cityName: "Bușteni", citySlug: "busteni", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131256", cityName: "Câmpina", citySlug: "campina", type: "municipality" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131336", cityName: "Comarnic", citySlug: "comarnic", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131407", cityName: "Mizil", citySlug: "mizil", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "130534", cityName: "Ploiești", citySlug: "ploiesti", type: "county_seat_municipality" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131443", cityName: "Plopeni", citySlug: "plopeni", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131540", cityName: "Sinaia", citySlug: "sinaia", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131577", cityName: "Slănic", citySlug: "slanic", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131620", cityName: "Urlați", citySlug: "urlati", type: "town" },
  { countyCode: "PH", countyName: "Prahova", cityCode: "131817", cityName: "Vălenii de Munte", citySlug: "valenii-de-munte", type: "town" },
  { countyCode: "SM", countyName: "Satu Mare", cityCode: "136848", cityName: "Ardud", citySlug: "ardud", type: "town" },
  { countyCode: "SM", countyName: "Satu Mare", cityCode: "136526", cityName: "Carei", citySlug: "carei", type: "municipality" },
  { countyCode: "SM", countyName: "Satu Mare", cityCode: "138039", cityName: "Livada", citySlug: "livada", type: "town" },
  { countyCode: "SM", countyName: "Satu Mare", cityCode: "136599", cityName: "Negrești-Oaș", citySlug: "negresti-oas", type: "town" },
  { countyCode: "SM", countyName: "Satu Mare", cityCode: "136483", cityName: "Satu Mare", citySlug: "satu-mare", type: "county_seat_municipality" },
  { countyCode: "SM", countyName: "Satu Mare", cityCode: "136642", cityName: "Tășnad", citySlug: "tasnad", type: "town" },
  { countyCode: "SJ", countyName: "Sălaj", cityCode: "139740", cityName: "Cehu Silvaniei", citySlug: "cehu-silvaniei", type: "town" },
  { countyCode: "SJ", countyName: "Sălaj", cityCode: "139811", cityName: "Jibou", citySlug: "jibou", type: "town" },
  { countyCode: "SJ", countyName: "Sălaj", cityCode: "139884", cityName: "Șimleu Silvaniei", citySlug: "simleu-silvaniei", type: "town" },
  { countyCode: "SJ", countyName: "Sălaj", cityCode: "139704", cityName: "Zalău", citySlug: "zalau", type: "county_seat_municipality" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143682", cityName: "Agnita", citySlug: "agnita", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "144054", cityName: "Avrig", citySlug: "avrig", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143735", cityName: "Cisnădie", citySlug: "cisnadie", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143771", cityName: "Copșa Mică", citySlug: "copsa-mica", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143806", cityName: "Dumbrăveni", citySlug: "dumbraveni", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143619", cityName: "Mediaș", citySlug: "medias", type: "municipality" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "144928", cityName: "Miercurea Sibiului", citySlug: "miercurea-sibiului", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143851", cityName: "Ocna Sibiului", citySlug: "ocna-sibiului", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "145499", cityName: "Săliște", citySlug: "saliste", type: "town" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "143450", cityName: "Sibiu", citySlug: "sibiu", type: "county_seat_municipality" },
  { countyCode: "SB", countyName: "Sibiu", cityCode: "145827", cityName: "Tălmaciu", citySlug: "talmaciu", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "147358", cityName: "Broșteni", citySlug: "brosteni", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "147633", cityName: "Cajvana", citySlug: "cajvana", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146502", cityName: "Câmpulung Moldovenesc", citySlug: "campulung-moldovenesc", type: "municipality" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "148006", cityName: "Dolhasca", citySlug: "dolhasca", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146539", cityName: "Fălticeni", citySlug: "falticeni", type: "municipality" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "148612", cityName: "Frasin", citySlug: "frasin", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146584", cityName: "Gura Humorului", citySlug: "gura-humorului", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "149227", cityName: "Liteni", citySlug: "liteni", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146931", cityName: "Milișăuți", citySlug: "milisauti", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146628", cityName: "Rădăuți", citySlug: "radauti", type: "municipality" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146370", cityName: "Salcea", citySlug: "salcea", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146655", cityName: "Siret", citySlug: "siret", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146708", cityName: "Solca", citySlug: "solca", type: "town" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146263", cityName: "Suceava", citySlug: "suceava", type: "county_seat_municipality" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "146744", cityName: "Vatra Dornei", citySlug: "vatra-dornei", type: "municipality" },
  { countyCode: "SV", countyName: "Suceava", cityCode: "151095", cityName: "Vicovu de Sus", citySlug: "vicovu-de-sus", type: "town" },
  { countyCode: "TR", countyName: "Teleorman", cityCode: "151790", cityName: "Alexandria", citySlug: "alexandria", type: "county_seat_municipality" },
  { countyCode: "TR", countyName: "Teleorman", cityCode: "151870", cityName: "Roșiori de Vede", citySlug: "rosiori-de-vede", type: "municipality" },
  { countyCode: "TR", countyName: "Teleorman", cityCode: "151683", cityName: "Turnu Măgurele", citySlug: "turnu-magurele", type: "municipality" },
  { countyCode: "TR", countyName: "Teleorman", cityCode: "151905", cityName: "Videle", citySlug: "videle", type: "town" },
  { countyCode: "TR", countyName: "Teleorman", cityCode: "151978", cityName: "Zimnicea", citySlug: "zimnicea", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "155403", cityName: "Buziaș", citySlug: "buzias", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "156357", cityName: "Ciacova", citySlug: "ciacova", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "155458", cityName: "Deta", citySlug: "deta", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "156801", cityName: "Făget", citySlug: "faget", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "157086", cityName: "Gătaia", citySlug: "gataia", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "155494", cityName: "Jimbolia", citySlug: "jimbolia", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "155350", cityName: "Lugoj", citySlug: "lugoj", type: "municipality" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "158314", cityName: "Recaș", citySlug: "recas", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "155528", cityName: "Sânnicolau Mare", citySlug: "sannicolau-mare", type: "town" },
  { countyCode: "TM", countyName: "Timiș", cityCode: "155243", cityName: "Timișoara", citySlug: "timisoara", type: "county_seat_municipality" },
  { countyCode: "TL", countyName: "Tulcea", cityCode: "159650", cityName: "Babadag", citySlug: "babadag", type: "town" },
  { countyCode: "TL", countyName: "Tulcea", cityCode: "159687", cityName: "Isaccea", citySlug: "isaccea", type: "town" },
  { countyCode: "TL", countyName: "Tulcea", cityCode: "159730", cityName: "Măcin", citySlug: "macin", type: "town" },
  { countyCode: "TL", countyName: "Tulcea", cityCode: "159767", cityName: "Sulina", citySlug: "sulina", type: "town" },
  { countyCode: "TL", countyName: "Tulcea", cityCode: "159614", cityName: "Tulcea", citySlug: "tulcea", type: "county_seat_municipality" },
  { countyCode: "VS", countyName: "Vaslui", cityCode: "161794", cityName: "Bârlad", citySlug: "barlad", type: "municipality" },
  { countyCode: "VS", countyName: "Vaslui", cityCode: "161829", cityName: "Huși", citySlug: "husi", type: "municipality" },
  { countyCode: "VS", countyName: "Vaslui", cityCode: "164981", cityName: "Murgeni", citySlug: "murgeni", type: "town" },
  { countyCode: "VS", countyName: "Vaslui", cityCode: "161856", cityName: "Negrești", citySlug: "negresti", type: "town" },
  { countyCode: "VS", countyName: "Vaslui", cityCode: "161945", cityName: "Vaslui", citySlug: "vaslui", type: "county_seat_municipality" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "168372", cityName: "Băbeni", citySlug: "babeni", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "167641", cityName: "Băile Govora", citySlug: "baile-govora", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "167696", cityName: "Băile Olănești", citySlug: "baile-olanesti", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "168452", cityName: "Bălcești", citySlug: "balcesti", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "168602", cityName: "Berbești", citySlug: "berbesti", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "167794", cityName: "Brezoi", citySlug: "brezoi", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "167909", cityName: "Călimănești", citySlug: "calimanesti", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "167981", cityName: "Drăgășani", citySlug: "dragasani", type: "municipality" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "168041", cityName: "Horezu", citySlug: "horezu", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "168130", cityName: "Ocnele Mari", citySlug: "ocnele-mari", type: "town" },
  { countyCode: "VL", countyName: "Vâlcea", cityCode: "167473", cityName: "Râmnicu Vâlcea", citySlug: "ramnicu-valcea", type: "county_seat_municipality" },
  { countyCode: "VN", countyName: "Vrancea", cityCode: "174860", cityName: "Adjud", citySlug: "adjud", type: "municipality" },
  { countyCode: "VN", countyName: "Vrancea", cityCode: "174744", cityName: "Focșani", citySlug: "focsani", type: "county_seat_municipality" },
  { countyCode: "VN", countyName: "Vrancea", cityCode: "174922", cityName: "Mărășești", citySlug: "marasesti", type: "town" },
  { countyCode: "VN", countyName: "Vrancea", cityCode: "175019", cityName: "Odobești", citySlug: "odobesti", type: "town" },
  { countyCode: "VN", countyName: "Vrancea", cityCode: "175055", cityName: "Panciu", citySlug: "panciu", type: "town" },
] as const satisfies readonly RomaniaUrbanLocality[];

export function normalizeRomaniaLocationCode(value?: string | null) {
  return (value || "").trim().toUpperCase();
}

export function normalizeRomaniaLocationName(value?: string | null) {
  return (value || "")
    .trim()
    .replace(/Ş/g, "Ș")
    .replace(/ş/g, "ș")
    .replace(/Ţ/g, "Ț")
    .replace(/ţ/g, "ț")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const COUNTY_CODE_SET = new Set<string>(ROMANIA_COUNTIES.map((county) => county.code));
const LOCALITIES_BY_COUNTY = ROMANIA_URBAN_LOCALITIES.reduce(
  (acc, locality) => {
    const existing = acc.get(locality.countyCode) || [];
    existing.push(locality);
    acc.set(locality.countyCode, existing);
    return acc;
  },
  new Map<string, RomaniaUrbanLocality[]>()
);

export function isRomaniaCountyCode(value?: string | null) {
  return COUNTY_CODE_SET.has(normalizeRomaniaLocationCode(value));
}

export function findRomaniaCounty(value?: string | null) {
  const countyCode = normalizeRomaniaLocationCode(value);
  return ROMANIA_COUNTIES.find((county) => county.code === countyCode) || null;
}

export function getCitiesByCounty(countyCode?: string | null) {
  return LOCALITIES_BY_COUNTY.get(normalizeRomaniaLocationCode(countyCode)) || [];
}

export function findRomaniaCity(countyCode?: string | null, cityCode?: string | null) {
  const normalizedCityCode = normalizeRomaniaLocationCode(cityCode);
  return (
    getCitiesByCounty(countyCode).find((city) => city.cityCode === normalizedCityCode) || null
  );
}

export function findRomaniaCityByCode(cityCode?: string | null) {
  const normalizedCityCode = normalizeRomaniaLocationCode(cityCode);
  return ROMANIA_URBAN_LOCALITIES.find((city) => city.cityCode === normalizedCityCode) || null;
}

export function findRomaniaCityByName(cityName?: string | null) {
  const normalizedCityName = normalizeRomaniaLocationName(cityName);
  if (!normalizedCityName) {
    return null;
  }
  return (
    ROMANIA_URBAN_LOCALITIES.find(
      (city) => normalizeRomaniaLocationName(city.cityName) === normalizedCityName
    ) || null
  );
}

export function isRomaniaCityForCounty(
  countyCode?: string | null,
  cityCode?: string | null
) {
  return Boolean(findRomaniaCity(countyCode, cityCode));
}
