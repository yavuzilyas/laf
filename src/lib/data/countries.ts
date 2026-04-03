// Country and City data for location selector
export interface Country {
    code: string;
    name: string;
    nameTr: string;
    cities: string[];
}

export const countries: Country[] = [
    {
        code: "TR",
        name: "Turkey",
        nameTr: "Türkiye",
        cities: [
            "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Amasya", "Ankara", "Antalya", "Artvin",
            "Aydın", "Balıkesir", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
            "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Edirne", "Elazığ", "Erzincan",
            "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Isparta",
            "Mersin", "İstanbul", "İzmir", "Kars", "Kastamonu", "Kayseri", "Kırklareli", "Kırşehir",
            "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Kahramanmaraş", "Mardin", "Muğla",
            "Muş", "Nevşehir", "Niğde", "Ordu", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop",
            "Sivas", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Şanlıurfa", "Uşak", "Van", "Yozgat",
            "Zonguldak", "Aksaray", "Bayburt", "Karaman", "Kırıkkale", "Batman", "Şırnak", "Bartın",
            "Ardahan", "Iğdır", "Yalova", "Karabük", "Kilis", "Osmaniye", "Düzce"
        ]
    },
    {
        code: "US",
        name: "United States",
        nameTr: "Amerika Birleşik Devletleri",
        cities: [
            "New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio",
            "San Diego", "Dallas", "San Jose", "Austin", "Jacksonville", "Fort Worth", "Columbus",
            "Charlotte", "San Francisco", "Indianapolis", "Seattle", "Denver", "Washington",
            "Boston", "El Paso", "Nashville", "Detroit", "Oklahoma City", "Portland", "Las Vegas",
            "Louisville", "Baltimore", "Milwaukee", "Albuquerque", "Tucson", "Fresno", "Sacramento",
            "Mesa", "Kansas City", "Atlanta", "Long Beach", "Colorado Springs", "Raleigh"
        ]
    },
    {
        code: "GB",
        name: "United Kingdom",
        nameTr: "Birleşik Krallık",
        cities: [
            "London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Sheffield", "Bradford",
            "Liverpool", "Edinburgh", "Cardiff", "Belfast", "Leicester", "Wakefield", "Coventry",
            "Nottingham", "Newcastle", "Doncaster", "Milton Keynes", "Bristol", "Rotherham"
        ]
    },
    {
        code: "DE",
        name: "Germany",
        nameTr: "Almanya",
        cities: [
            "Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf",
            "Leipzig", "Dortmund", "Essen", "Bremen", "Dresden", "Hanover", "Nuremberg",
            "Duisburg", "Bochum", "Wuppertal", "Bielefeld", "Bonn", "Münster"
        ]
    },
    {
        code: "FR",
        name: "France",
        nameTr: "Fransa",
        cities: [
            "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier",
            "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Étienne", "Toulon", "Le Havre",
            "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne"
        ]
    },
    {
        code: "NL",
        name: "Netherlands",
        nameTr: "Hollanda",
        cities: [
            "Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Eindhoven", "Tilburg", "Groningen",
            "Almere", "Breda", "Nijmegen", "Arnhem", "Haarlem", "Zaanstad", "Amersfoort",
            "Apeldoorn", "'s-Hertogenbosch", "Hoofddorp", "Maastricht", "Leiden", "Dordrecht"
        ]
    },
    {
        code: "BE",
        name: "Belgium",
        nameTr: "Belçika",
        cities: [
            "Brussels", "Antwerp", "Ghent", "Charleroi", "Liège", "Bruges", "Namur", "Leuven",
            "Mons", "Mechelen", "Aalst", "La Louvière", "Hasselt", "Sint-Niklaas", "Kortrijk",
            "Ostend", "Genk", "Roeselare", "Tournai", "Verviers"
        ]
    },
    {
        code: "AT",
        name: "Austria",
        nameTr: "Avusturya",
        cities: [
            "Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt", "Villach", "Wels",
            "St. Pölten", "Dornbirn", "Steyr", "Leonding", "Klosterneuburg", "Wolfsberg",
            "Leoben", "Krems", "Traun", "Amstetten", "Ansfelden", "Baden bei Wien"
        ]
    },
    {
        code: "CH",
        name: "Switzerland",
        nameTr: "İsviçre",
        cities: [
            "Zurich", "Geneva", "Basel", "Lausanne", "Bern", "Winterthur", "Lucerne", "St. Gallen",
            "Lugano", "Biel/Bienne", "Thun", "Bellinzona", "Köniz", "La Chaux-de-Fonds",
            "Fribourg", "Schaffhausen", "Chur", "Neuchâtel", "Uster", "Sion"
        ]
    },
    {
        code: "IT",
        name: "Italy",
        nameTr: "İtalya",
        cities: [
            "Rome", "Milan", "Naples", "Turin", "Palermo", "Genoa", "Bologna", "Florence",
            "Bari", "Catania", "Venice", "Verona", "Messina", "Padua", "Trieste", "Taranto",
            "Brescia", "Prato", "Parma", "Modena"
        ]
    },
    {
        code: "ES",
        name: "Spain",
        nameTr: "İspanya",
        cities: [
            "Madrid", "Barcelona", "Valencia", "Seville", "Zaragoza", "Málaga", "Murcia",
            "Palma", "Las Palmas", "Bilbao", "Alicante", "Cordoba", "Valladolid", "Vigo",
            "Gijón", "Hospitalet", "Vitoria-Gasteiz", "La Coruña", "Granada", "Elche"
        ]
    },
    {
        code: "PT",
        name: "Portugal",
        nameTr: "Portekiz",
        cities: [
            "Lisbon", "Porto", "Vila Nova de Gaia", "Amadora", "Braga", "Setúbal", "Coimbra",
            "Funchal", "Queluz", "Barreiro", "Aveiro", "Viseu", "Rio Tinto", "Odivelas",
            "Leiria", "Loures", "Faro", "Évora", "Portimão", "Póvoa de Varzim"
        ]
    },
    {
        code: "RU",
        name: "Russia",
        nameTr: "Rusya",
        cities: [
            "Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan", "Nizhny Novgorod",
            "Chelyabinsk", "Samara", "Omsk", "Rostov-on-Don", "Ufa", "Krasnoyarsk", "Perm",
            "Voronezh", "Volgograd", "Krasnodar", "Saratov", "Tyumen", "Tolyatti", "Izhevsk"
        ]
    },
    {
        code: "UA",
        name: "Ukraine",
        nameTr: "Ukrayna",
        cities: [
            "Kyiv", "Kharkiv", "Odessa", "Dnipro", "Donetsk", "Zaporizhzhia", "Lviv", "Kryvyi Rih",
            "Mykolaiv", "Mariupol", "Luhansk", "Vinnytsia", "Makiivka", "Sevastopol", "Simferopol",
            "Kherson", "Poltava", "Chernihiv", "Cherkasy", "Sumy"
        ]
    },
    {
        code: "PL",
        name: "Poland",
        nameTr: "Polonya",
        cities: [
            "Warsaw", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk", "Szczecin", "Bydgoszcz",
            "Lublin", "Białystok", "Katowice", "Gdynia", "Częstochowa", "Radom", "Sosnowiec",
            "Toruń", "Kielce", "Rzeszów", "Gliwice", "Zabrze"
        ]
    },
    {
        code: "CZ",
        name: "Czech Republic",
        nameTr: "Çek Cumhuriyeti",
        cities: [
            "Prague", "Brno", "Ostrava", "Plzeň", "Liberec", "Olomouc", "České Budějovice",
            "Hradec Králové", "Ústí nad Labem", "Pardubice", "Zlín", "Havířov", "Kladno",
            "Most", "Opava", "Frýdek-Místek", "Karviná", "Jihlava", "Teplice", "Děčín"
        ]
    },
    {
        code: "RO",
        name: "Romania",
        nameTr: "Romanya",
        cities: [
            "Bucharest", "Cluj-Napoca", "Timișoara", "Iași", "Constanța", "Craiova", "Brașov",
            "Galați", "Ploiești", "Oradea", "Brăila", "Arad", "Pitești", "Sibiu", "Bacău",
            "Târgu Mureș", "Baia Mare", "Buzău", "Botoșani", "Satu Mare"
        ]
    },
    {
        code: "HU",
        name: "Hungary",
        nameTr: "Macaristan",
        cities: [
            "Budapest", "Debrecen", "Szeged", "Miskolc", "Pécs", "Győr", "Nyíregyháza",
            "Kecskemét", "Székesfehérvár", "Szombathely", "Szolnok", "Tatabánya", "Kaposvár",
            "Érd", "Veszprém", "Békéscsaba", "Zalaegerszeg", "Sopron", "Eger", "Nagykanizsa"
        ]
    },
    {
        code: "SE",
        name: "Sweden",
        nameTr: "İsveç",
        cities: [
            "Stockholm", "Gothenburg", "Malmö", "Uppsala", "Västerås", "Örebro", "Linköping",
            "Helsingborg", "Jönköping", "Norrköping", "Lund", "Umeå", "Gävle", "Borås",
            "Södertälje", "Karlstad", "Växjö", "Täby", "Kristianstad", "Luleå"
        ]
    },
    {
        code: "NO",
        name: "Norway",
        nameTr: "Norveç",
        cities: [
            "Oslo", "Bergen", "Trondheim", "Stavanger", "Bærum", "Kristiansand", "Fredrikstad",
            "Tromsø", "Sandnes", "Drammen", "Asker", "Lillehammer", "Halden", "Skien",
            "Gjøvik", "Haugesund", "Tønsberg", "Sandefjord", "Bodø", "Alesund"
        ]
    },
    {
        code: "DK",
        name: "Denmark",
        nameTr: "Danimarka",
        cities: [
            "Copenhagen", "Aarhus", "Odense", "Aalborg", "Frederiksberg", "Esbjerg", "Randers",
            "Kolding", "Horsens", "Vejle", "Roskilde", "Helsingør", "Herning", "Hørsholm",
            "Silkeborg", "Næstved", "Fredericia", "Viborg", "Køge", "Holstebro"
        ]
    },
    {
        code: "FI",
        name: "Finland",
        nameTr: "Finlandiya",
        cities: [
            "Helsinki", "Espoo", "Tampere", "Vantaa", "Oulu", "Turku", "Jyväskylä", "Lahti",
            "Kuopio", "Pori", "Kouvola", "Joensuu", "Lappeenranta", "Hämeenlinna", "Vaasa",
            "Rovaniemi", "Seinäjoki", "Mikkeli", "Kotka", "Salo"
        ]
    },
    {
        code: "GR",
        name: "Greece",
        nameTr: "Yunanistan",
        cities: [
            "Athens", "Thessaloniki", "Patras", "Heraklion", "Larissa", "Volos", "Rhodes",
            "Ioannina", "Chania", "Chalcis", "Agrinio", "Katerini", "Trikala", "Serres",
            "Lamia", "Alexandroupoli", "Kozani", "Kavala", "Kalampaka", "Veria"
        ]
    },
    {
        code: "JP",
        name: "Japan",
        nameTr: "Japonya",
        cities: [
            "Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto",
            "Kawasaki", "Saitama", "Hiroshima", "Sendai", "Kitakyushu", "Chiba", "Sakai",
            "Niigata", "Hamamatsu", "Okayama", "Shizuoka", "Sagamihara"
        ]
    },
    {
        code: "CN",
        name: "China",
        nameTr: "Çin",
        cities: [
            "Shanghai", "Beijing", "Chongqing", "Tianjin", "Guangzhou", "Shenzhen", "Chengdu",
            "Nanjing", "Wuhan", "Xi'an", "Hangzhou", "Dongguan", "Foshan", "Shenyang",
            "Harbin", "Qingdao", "Dalian", "Jinan", "Zhengzhou", "Changsha"
        ]
    },
    {
        code: "IN",
        name: "India",
        nameTr: "Hindistan",
        cities: [
            "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Ahmedabad", "Chennai", "Kolkata",
            "Surat", "Pune", "Jaipur", "Lucknow", "Kanpur", "Nagpur", "Indore", "Thane",
            "Bhopal", "Visakhapatnam", "Pimpri-Chinchwad", "Patna", "Vadodara"
        ]
    },
    {
        code: "KR",
        name: "South Korea",
        nameTr: "Güney Kore",
        cities: [
            "Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Suwon", "Ulsan",
            "Changwon", "Seongnam", "Goyang", "Yongin", "Bucheon", "Ansan", "Cheongju",
            "Anyang", "Namyangju", "Jeonju", "Cheonan", "Wonju"
        ]
    },
    {
        code: "AE",
        name: "United Arab Emirates",
        nameTr: "Birleşik Arap Emirlikleri",
        cities: [
            "Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
            "Al Ain", "Dibba", "Khor Fakkan", "Kalba", "Jebel Ali", "Madinat Zayed", "Ruwais",
            "Liwa Oasis", "Dhaid", "Ghayathi", "Ar-Rams", "Hatta", "Mirfa"
        ]
    },
    {
        code: "SA",
        name: "Saudi Arabia",
        nameTr: "Suudi Arabistan",
        cities: [
            "Riyadh", "Jeddah", "Mecca", "Medina", "Dammam", "Ta'if", "Tabuk", "Buraidah",
            "Khamis Mushait", "Hail", "Abha", "Jubail", "Al-Kharj", "Qatif", "Al Hofuf",
            "Najran", "Yanbu", "Al Qunfudhah", "Al Bahah", "Sakaka"
        ]
    },
    {
        code: "IL",
        name: "Israel",
        nameTr: "İsrail",
        cities: [
            "Jerusalem", "Tel Aviv", "Haifa", "Rishon LeZion", "Petah Tikva", "Ashdod", "Netanya",
            "Bnei Brak", "Holon", "Beersheba", "Ramat Gan", "Ashkelon", "Rehovot", "Bat Yam",
            "Herzliya", "Kfar Saba", "Modi'in", "Hadera", "Nazareth", "Lod"
        ]
    },
    {
        code: "EG",
        name: "Egypt",
        nameTr: "Mısır",
        cities: [
            "Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor",
            "Mansoura", "El Mahalla", "Tanta", "Asyut", "Ismailia", "Faiyum", "Zagazig",
            "Damietta", "Aswan", "Minya", "Beni Suef", "Qena", "Sohag"
        ]
    },
    {
        code: "ZA",
        name: "South Africa",
        nameTr: "Güney Afrika",
        cities: [
            "Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "Bloemfontein",
            "Nelspruit", "Kimberley", "Polokwane", "Pietermaritzburg", "Rustenburg", "East London",
            "Vereeniging", "Soweto", "Benoni", "Tembisa", "Kempton Park", "Welkom", "Newcastle",
            "Boksburg"
        ]
    },
    {
        code: "AU",
        name: "Australia",
        nameTr: "Avustralya",
        cities: [
            "Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle",
            "Canberra", "Sunshine Coast", "Wollongong", "Hobart", "Geelong", "Townsville",
            "Cairns", "Toowoomba", "Darwin", "Ballarat", "Bendigo", "Albury", "Launceston"
        ]
    },
    {
        code: "CA",
        name: "Canada",
        nameTr: "Kanada",
        cities: [
            "Toronto", "Montreal", "Calgary", "Ottawa", "Edmonton", "Mississauga", "Winnipeg",
            "Vancouver", "Brampton", "Hamilton", "Quebec City", "Kitchener", "London", "Victoria",
            "Halifax", "Oshawa", "Windsor", "Saskatoon", "St. Catharines", "Regina"
        ]
    },
    {
        code: "BR",
        name: "Brazil",
        nameTr: "Brezilya",
        cities: [
            "São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte",
            "Manaus", "Curitiba", "Recife", "Porto Alegre", "Belém", "Goiânia", "Guarulhos",
            "Campinas", "São Luís", "São Gonçalo", "Maceió", "Duque de Caxias", "Natal", "Campo Grande"
        ]
    },
    {
        code: "AR",
        name: "Argentina",
        nameTr: "Arjantin",
        cities: [
            "Buenos Aires", "Córdoba", "Rosario", "Mendoza", "San Miguel de Tucumán", "La Plata",
            "Mar del Plata", "Salta", "Santa Fe", "San Juan", "Resistencia", "Santiago del Estero",
            "Corrientes", "Posadas", "San Salvador de Jujuy", "Bahía Blanca", "Paraná", "Neuquén",
            "Formosa", "San Luis"
        ]
    },
    {
        code: "MX",
        name: "Mexico",
        nameTr: "Meksika",
        cities: [
            "Mexico City", "Guadalajara", "Monterrey", "Puebla", "Tijuana", "León", "Juárez",
            "Zapopan", "Monterrey", "Nezahualcóyotl", "Chihuahua", "Mérida", "San Luis Potosí",
            "Aguascalientes", "Hermosillo", "Saltillo", "Mexicali", "Culiacán", "Acapulco",
            "Tlalnepantla", "Cancún"
        ]
    },
    {
        code: "IR",
        name: "Iran",
        nameTr: "İran",
        cities: [
            "Tehran", "Mashhad", "Isfahan", "Karaj", "Shiraz", "Tabriz", "Qom", "Ahvaz",
            "Kermanshah", "Urmia", "Rasht", "Zahedan", "Hamadan", "Kerman", "Yazd", "Ardabil",
            "Bandar Abbas", "Eslamshahr", "Zanjan", "Sanandaj"
        ]
    },
    {
        code: "PK",
        name: "Pakistan",
        nameTr: "Pakistan",
        cities: [
            "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala", "Multan", "Peshawar",
            "Sargodha", "Sialkot", "Bahawalpur", "Sukkur", "Nagar", "Quetta", "Islamabad",
            "Kasur", "Gojra", "Sheikhupura", "Jhang", "Sadiqabad", "Okara"
        ]
    },
    {
        code: "ID",
        name: "Indonesia",
        nameTr: "Endonezya",
        cities: [
            "Jakarta", "Surabaya", "Bandung", "Bekasi", "Medan", "Tangerang", "Depok",
            "Semarang", "Palembang", "Makassar", "South Tangerang", "Batam", "Bogor", "Pekanbaru",
            "Bandar Lampung", "Padang", "Malang", "Denpasar", "Samarinda", "Tasikmalaya"
        ]
    },
    {
        code: "MY",
        name: "Malaysia",
        nameTr: "Malezya",
        cities: [
            "Kuala Lumpur", "Seberang Perai", "George Town", "Ipoh", "Subang Jaya", "Petaling Jaya",
            "Shah Alam", "Johor Bahru", "Kota Kinabalu", "Klang", "Kuantan", "Kuala Terengganu",
            "Kota Bharu", "Miri", "Malacca City", "Alor Setar", "Muar", "Sungai Petani",
            "Kuala Langat", "Sandakan"
        ]
    },
    {
        code: "TH",
        name: "Thailand",
        nameTr: "Tayland",
        cities: [
            "Bangkok", "Nonthaburi", "Nakhon Ratchasima", "Chiang Mai", "Hat Yai", "Udon Thani",
            "Pak Kret", "Khon Kaen", "Nakhon Si Thammarat", "Ban Mang", "Ubon Ratchathani",
            "Samut Prakan", "Si Racha", "Khao Phanom", "Sakon Nakhon", "Surat Thani",
            "Nakhon Pathom", "Lampang", "Rayong", "Chon Buri"
        ]
    },
    {
        code: "VN",
        name: "Vietnam",
        nameTr: "Vietnam",
        cities: [
            "Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho", "Bien Hoa",
            "Hue", "Nha Trang", "Vinh", "Qui Nhon", "Rach Gia", "Nam Dinh", "Ha Long",
            "Thai Nguyen", "Long Xuyen", "Buon Ma Thuot", "Da Lat", "Phan Thiet", "Cam Ranh",
            "Vung Tau"
        ]
    },
    {
        code: "PH",
        name: "Philippines",
        nameTr: "Filipinler",
        cities: [
            "Quezon City", "Manila", "Caloocan", "Davao City", "Cebu City", "Zamboanga City",
            "Antipolo", "Pasig", "Taguig", "Valenzuela", "Makati", "Marikina", "Muntinlupa",
            "Las Piñas", "General Santos", "Iloilo City", "Cagayan de Oro", "Bacolod",
            "Calamba", "San Jose del Monte"
        ]
    },
    {
        code: "BD",
        name: "Bangladesh",
        nameTr: "Bangladeş",
        cities: [
            "Dhaka", "Chittagong", "Khulna", "Rajshahi", "Sylhet", "Barisal", "Rangpur",
            "Comilla", "Narayanganj", "Gazipur", "Mymensingh", "Jessore", "Nawabganj",
            "Dinajpur", "Bogra", "Tangail", "Sirajganj", "Pabna", "Jamalpur", "Naogaon"
        ]
    },
    {
        code: "SG",
        name: "Singapore",
        nameTr: "Singapur",
        cities: [
            "Singapore", "Jurong", "Tampines", "Woodlands", "Bedok", "Sengkang", "Hougang",
            "Yishun", "Ang Mo Kio", "Choa Chu Kang", "Bukit Batok", "Bukit Panjang", "Clementi",
            "Bishan", "Punggol", "Pasir Ris", "Serangoon", "Toa Payoh", "Bukit Merah",
            "Kallang"
        ]
    },
    {
        code: "NZ",
        name: "New Zealand",
        nameTr: "Yeni Zelanda",
        cities: [
            "Auckland", "Christchurch", "Wellington", "Hamilton", "Tauranga", "Napier-Hastings",
            "Dunedin", "Palmerston North", "Nelson", "Rotorua", "New Plymouth", "Whangarei",
            "Invercargill", "Kapiti", "Whanganui", "Gisborne", "Blenheim", "Pukekohe",
            "Timaru", "Taupo"
        ]
    },
    // Additional European Countries
    {
        code: "IE",
        name: "Ireland",
        nameTr: "İrlanda",
        cities: [
            "Dublin", "Cork", "Limerick", "Galway", "Waterford", "Drogheda", "Dundalk",
            "Swords", "Bray", "Navan", "Kilkenny", "Ennis", "Carlow", "Tralee",
            "Newbridge", "Naas", "Athlone", "Portlaoise", "Mullingar", "Wexford"
        ]
    },
    {
        code: "IS",
        name: "Iceland",
        nameTr: "İzlanda",
        cities: [
            "Reykjavik", "Kopavogur", "Hafnarfjordur", "Akureyri", "Gardabaer", "Mosfellsbaer",
            "Akranes", "Selfoss", "Isafjordur", "Saudarkrokur", "Egilsstadir", "Husavik",
            "Borgarnes", "Hveragerdi", "Grindavik", "Neskaupstadur", "Dalvik", "Siglufjordur"
        ]
    },
    {
        code: "SK",
        name: "Slovakia",
        nameTr: "Slovakya",
        cities: [
            "Bratislava", "Kosice", "Presov", "Zilina", "Banska Bystrica", "Nitra",
            "Trnava", "Martin", "Trencin", "Poprad", "Prievidza", "Zvolen", "Povazska Bystrica",
            "Michalovce", "Nove Zamky", "Spisska Nova Ves", "Levice", "Komarno", "Humenne", "Bardejov"
        ]
    },
    {
        code: "SI",
        name: "Slovenia",
        nameTr: "Slovenya",
        cities: [
            "Ljubljana", "Maribor", "Celje", "Kranj", "Velenje", "Koper", "Novo Mesto",
            "Ptuj", "Trbovlje", "Kamnik", "Jesenice", "Domzale", "Izola", "Murska Sobota",
            "Nova Gorica", "Krsko", "Slovenska Bistrica", "Ravne na Koroskem", "Ajdovscina", "Brežice"
        ]
    },
    {
        code: "HR",
        name: "Croatia",
        nameTr: "Hırvatistan",
        cities: [
            "Zagreb", "Split", "Rijeka", "Osijek", "Zadar", "Pula", "Slavonski Brod",
            "Karlovac", "Varazdin", "Sisak", "Dubrovnik", "Kastela", "Samobor", "Vinkovci",
            "Vukovar", "Bjelovar", "Karlovac", "Dubrovnik", "Porec", "Makarska"
        ]
    },
    {
        code: "BG",
        name: "Bulgaria",
        nameTr: "Bulgaristan",
        cities: [
            "Sofia", "Plovdiv", "Varna", "Burgas", "Ruse", "Stara Zagora", "Pleven",
            "Sliven", "Dobrich", "Shumen", "Pernik", "Haskovo", "Yambol", "Pazardzhik",
            "Blagoevgrad", "Veliko Tarnovo", "Gabrovo", "Asenovgrad", "Kyustendil", "Vidin"
        ]
    },
    {
        code: "RS",
        name: "Serbia",
        nameTr: "Sırbistan",
        cities: [
            "Belgrade", "Novi Sad", "Nis", "Krusevac", "Kragujevac", "Subotica", "Zrenjanin",
            "Pancevo", "Cacak", "Novi Pazar", "Kraljevo", "Smederevo", "Leskovac", "Uzice",
            "Vranje", "Sombor", "Valjevo", "Sabac", "Pirot", "Bor"
        ]
    },
    {
        code: "BA",
        name: "Bosnia and Herzegovina",
        nameTr: "Bosna Hersek",
        cities: [
            "Sarajevo", "Banja Luka", "Tuzla", "Zenica", "Mostar", "Bihac", "Prijedor",
            "Doboj", "Cazin", "Zavidovici", "Velika Kladusa", "Bijeljina", "Trebinje",
            "Travnik", "Visoko", "Gracanica", "Srebrenik", "Lukavac", "Kakanj", "Zivinice"
        ]
    },
    {
        code: "AL",
        name: "Albania",
        nameTr: "Arnavutluk",
        cities: [
            "Tirana", "Durres", "Vlore", "Elbasan", "Shkoder", "Fier", "Korce", "Berat",
            "Lushnje", "Pogradec", "Kavaje", "Gjirokaster", "Lezhe", "Kukes", "Patos",
            "Librazhd", "Kruje", "Tepelene", "Peshkopi", "Gramsh"
        ]
    },
    {
        code: "EE",
        name: "Estonia",
        nameTr: "Estonya",
        cities: [
            "Tallinn", "Tartu", "Narva", "Parnu", "Kohtla-Jarve", "Viljandi", "Rakvere",
            "Maardu", "Sillamae", "Kuressaare", "Voru", "Valga", "Haapsalu", "Johvi",
            "Keila", "Paide", "Elva", "Saue", "Polva", "Tapa"
        ]
    },
    {
        code: "LV",
        name: "Latvia",
        nameTr: "Letonya",
        cities: [
            "Riga", "Daugavpils", "Liepaja", "Jelgava", "Jurmala", "Ventspils", "Rezekne",
            "Valmiera", "Jekabpils", "Ogre", "Tukums", "Salaspils", "Cesis", "Saldus",
            "Kuldiga", "Olaine", "Bauska", "Limbazi", "Livani", "Talsi"
        ]
    },
    {
        code: "LT",
        name: "Lithuania",
        nameTr: "Litvanya",
        cities: [
            "Vilnius", "Kaunas", "Klaipeda", "Siauliai", "Panevezys", "Alytus", "Marijampole",
            "Mazeikiai", "Jonava", "Utena", "Kedainiai", "Taurage", "Telsiai", "Ukmerge",
            "Visaginas", "Plunge", "Kretinga", "Silute", "Radviliskis", "Palanga"
        ]
    },
    {
        code: "BY",
        name: "Belarus",
        nameTr: "Belarus",
        cities: [
            "Minsk", "Gomel", "Mogilev", "Vitebsk", "Grodno", "Brest", "Bobruisk",
            "Baranovichi", "Borisov", "Pinsk", "Orsha", "Mozyr", "Soligorsk", "Novopolotsk",
            "Lida", "Molodechno", "Polotsk", "Zhlobin", "Svetlogorsk", "Rechitsa"
        ]
    },
    {
        code: "MD",
        name: "Moldova",
        nameTr: "Moldova",
        cities: [
            "Chisinau", "Tiraspol", "Balti", "Bender", "Ribnita", "Cahul", "Ungheni",
            "Soroca", "Orhei", "Dubasari", "Comrat", "Edinet", "Causeni", "Straseni",
            "Hincesti", "Floresti", "Leova", "Calarasi", "Rezina", "Telenesti"
        ]
    },
    {
        code: "LU",
        name: "Luxembourg",
        nameTr: "Lüksemburg",
        cities: [
            "Luxembourg City", "Esch-sur-Alzette", "Differdange", "Dudelange", "Ettelbruck",
            "Diekirch", "Wiltz", "Echternach", "Rumelange", "Grevenmacher", "Diekirch",
            "Mersch", "Redange", "Vianden", "Clervaux", "Capellen", "Schifflange", "Kayl"
        ]
    },
    // Middle East & North Africa
    {
        code: "MA",
        name: "Morocco",
        nameTr: "Fas",
        cities: [
            "Casablanca", "Rabat", "Fez", "Marrakesh", "Tangier", "Agadir", "Meknes",
            "Oujda", "Kenitra", "Tetouan", "Safi", "Mohammedia", "El Jadida", "Nador",
            "Khouribga", "Beni Mellal", "Settat", "Taza", "Khemisset", "Larache"
        ]
    },
    {
        code: "DZ",
        name: "Algeria",
        nameTr: "Cezayir",
        cities: [
            "Algiers", "Oran", "Constantine", "Annaba", "Blida", "Batna", "Setif",
            "Tlemcen", "Sidi Bel Abbes", "Biskra", "Bejaia", "Tebessa", "Tiaret", "Bechar",
            "Ech Cheliff", "Mostaganem", "Ouargla", "Tamanrasset", "Medea", "Ouargla"
        ]
    },
    {
        code: "TN",
        name: "Tunisia",
        nameTr: "Tunus",
        cities: [
            "Tunis", "Sfax", "Sousse", "Kairouan", "Bizerte", "Gabes", "Ariana",
            "Gafsa", "Kasserine", "Monastir", "Ben Arous", "La Marsa", "Nabeul", "Hammamet",
            "Tataouine", "Beja", "Medenine", "Jendouba", "Tozeur", "Siliana"
        ]
    },
    {
        code: "LY",
        name: "Libya",
        nameTr: "Libya",
        cities: [
            "Tripoli", "Benghazi", "Misrata", "Zliten", "Bayda", "Ajdabiya", "Sebha",
            "Sirte", "Tobruk", "Sabha", "Derna", "Al Khums", "Zawiya", "Ghat",
            "Brak", "Nalut", "Gharyan", "Marj", "Ubari", "Jufra"
        ]
    },
    {
        code: "IQ",
        name: "Iraq",
        nameTr: "Irak",
        cities: [
            "Baghdad", "Basra", "Mosul", "Erbil", "Sulaymaniyah", "Najaf", "Karbala",
            "Kirkuk", "Nasiriyah", "Amarah", "Diwaniyah", "Kut", "Duhok", "Ramadi",
            "Fallujah", "Samawah", "Hillah", "Baqubah", "Tikrit", "Zakho"
        ]
    },
    {
        code: "JO",
        name: "Jordan",
        nameTr: "Ürdün",
        cities: [
            "Amman", "Zarqa", "Irbid", "Russeifa", "Aqaba", "Madaba", "Al Salt",
            "Jerash", "Mafraq", "Ajloun", "Ma'an", "Karak", "Tafilah", "Ajloun",
            "Wadi Musa", "Sahab", "Al Jubayhah", "Qurayyat", "Al Husn", "Ayn al Basha"
        ]
    },
    {
        code: "LB",
        name: "Lebanon",
        nameTr: "Lübnan",
        cities: [
            "Beirut", "Tripoli", "Sidon", "Tyre", "Nabatieh", "Zahle", "Aley",
            "Jounieh", "Baabda", "Chouf", "Bint Jbeil", "Zgharta", "Jbeil", "Batroun",
            "Jezzine", "Hermel", "Halba", "Marjayoun", "Rashaya", "Beit ed-Dine"
        ]
    },
    {
        code: "OM",
        name: "Oman",
        nameTr: "Umman",
        cities: [
            "Muscat", "Seeb", "Salalah", "Bawshar", "Sohar", "Ibri", "Saham",
            "Barka", "Rustaq", "Buraimi", "Nizwa", "Sur", "Bahla", "Khasab",
            "Shinas", "Adam", "Izki", "Ibra", "Al-Mudhaibi", "Yanqul"
        ]
    },
    {
        code: "QA",
        name: "Qatar",
        nameTr: "Katar",
        cities: [
            "Doha", "Al Rayyan", "Umm Salal", "Al Wakra", "Al Khor", "Al Shamal",
            "Al Daayen", "Lusail", "Education City", "The Pearl", "West Bay", "Madinat Khalifa",
            "Al Sadd", "Bin Mahmoud", "Najma", "Fereej Bin Mahmoud", "Al Thumama", "Ain Khaled"
        ]
    },
    {
        code: "KW",
        name: "Kuwait",
        nameTr: "Kuveyt",
        cities: [
            "Kuwait City", "Hawalli", "Salmiya", "Jahra", "Farwaniya", "Ahmadi", "Mubarak Al-Kabeer",
            "Sabah Al-Salem", "Al Fintas", "Abu Halifa", "Mahboula", "Mangaf", "Fahaheel",
            "Jabriya", "Kaifan", "Adailiya", "Qurtuba", "Surra", "Yarmouk", "Shuwaikh"
        ]
    },
    {
        code: "BH",
        name: "Bahrain",
        nameTr: "Bahreyn",
        cities: [
            "Manama", "Riffa", "Muharraq", "Hamad Town", "A'ali", "Isa Town", "Sitra",
            "Jidd Hafs", "Al Hidd", "Madinat Hamad", "Madinat Isa", "Jurdab", "Sanabis",
            "Tubli", "Budaiya", "Dar Kulaib", "Durrat Al Bahrain", "Amwaj Islands"
        ]
    },
    // Sub-Saharan Africa
    {
        code: "NG",
        name: "Nigeria",
        nameTr: "Nijerya",
        cities: [
            "Lagos", "Kano", "Ibadan", "Abuja", "Port Harcourt", "Benin City", "Kaduna",
            "Maiduguri", "Zaria", "Aba", "Jos", "Ilorin", "Enugu", "Warri",
            "Oyo", "Sokoto", "Calabar", "Onitsha", "Ikorodu", "Uyo"
        ]
    },
    {
        code: "GH",
        name: "Ghana",
        nameTr: "Gana",
        cities: [
            "Accra", "Kumasi", "Tamale", "Sekondi-Takoradi", "Ashiaman", "Sunyani", "Cape Coast",
            "Obuasi", "Teshie", "Tema", "Madina", "Koforidua", "Wa", "Techiman",
            "Ho", "Bolgatanga", "Bawku", "Aflao", "Suhum", "Nungua"
        ]
    },
    {
        code: "KE",
        name: "Kenya",
        nameTr: "Kenya",
        cities: [
            "Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Malindi",
            "Kitale", "Garissa", "Kakamega", "Bungoma", "Nyeri", "Machakos", "Meru",
            "Kericho", "Embu", "Nanyuki", "Naivasha", "Kilifi", "Wajir"
        ]
    },
    {
        code: "ET",
        name: "Ethiopia",
        nameTr: "Etiyopya",
        cities: [
            "Addis Ababa", "Dire Dawa", "Mekelle", "Nazret", "Bahir Dar", "Gondar", "Dessie",
            "Jimma", "Jijiga", "Shashamane", "Bishoftu", "Sodo", "Arba Minch", "Hawassa",
            "Harar", "Debre Markos", "Axum", "Lalibela", "Goba", "Asosa"
        ]
    },
    {
        code: "TZ",
        name: "Tanzania",
        nameTr: "Tanzanya",
        cities: [
            "Dar es Salaam", "Mwanza", "Arusha", "Dodoma", "Zanzibar City", "Mbeya", "Morogoro",
            "Tanga", "Tabora", "Kigoma", "Moshi", "Iringa", "Lindi", "Songea",
            "Musoma", "Bukoba", "Shinyanga", "Katumba", "Sumbawanga", "Mtwara"
        ]
    },
    {
        code: "UG",
        name: "Uganda",
        nameTr: "Uganda",
        cities: [
            "Kampala", "Entebbe", "Gulu", "Lira", "Mbarara", "Jinja", "Bwizibwera",
            "Mbale", "Mukono", "Kasese", "Fort Portal", "Arua", "Masaka", "Soroti",
            "Hoima", "Kabale", "Tororo", "Wakiso", "Iganga", "Masindi"
        ]
    },
    {
        code: "CM",
        name: "Cameroon",
        nameTr: "Kamerun",
        cities: [
            "Douala", "Yaounde", "Bamenda", "Garoua", "Maroua", "Bafoussam", "Ngaoundere",
            "Kumba", "Limbe", "Edéa", "Kousseri", "Bertoua", "Loum", "Nkongsamba",
            "Buea", "Foumban", "Dschang", "Bafia", "Ebolowa", "Mbalmayo"
        ]
    },
    {
        code: "CI",
        name: "Ivory Coast",
        nameTr: "Fildişi Sahili",
        cities: [
            "Abidjan", "Yamoussoukro", "Bouake", "San-Pedro", "Daloa", "Korhogo", "Man",
            "Divo", "Anyama", "Abengourou", "Gagnoa", "Issia", "Agboville", "Grand-Bassam",
            "Duekoue", "Bondoukou", "Sakassou", "Abobo", "Marcory", "Treichville"
        ]
    },
    // Asia & Oceania
    {
        code: "KZ",
        name: "Kazakhstan",
        nameTr: "Kazakistan",
        cities: [
            "Almaty", "Astana", "Shymkent", "Karaganda", "Aktobe", "Taraz", "Pavlodar",
            "Ust-Kamenogorsk", "Semey", "Atyrau", "Kostanay", "Kyzylorda", "Petropavl",
            "Oral", "Aktau", "Temirtau", "Turkestan", "Kokshetau", "Taldykorgan", "Ekibastuz"
        ]
    },
    {
        code: "AZ",
        name: "Azerbaijan",
        nameTr: "Azerbaycan",
        cities: [
            "Baku", "Ganja", "Sumqayit", "Mingachevir", "Lankaran", "Shirvan", "Shaki",
            "Nakhchivan", "Yevlakh", "Khankendi", "Shamakhi", "Quba", "Agdash", "Salyan",
            "Zaqatala", "Qusar", "Agcabadi", "Balakan", "Ismayilli", "Tovuz"
        ]
    },
    {
        code: "GE",
        name: "Georgia",
        nameTr: "Gürcistan",
        cities: [
            "Tbilisi", "Kutaisi", "Batumi", "Rustavi", "Zugdidi", "Gori", "Poti",
            "Samtredia", "Khashuri", "Senaki", "Zestafoni", "Marneuli", "Telavi", "Kobuleti",
            "Akhaltsikhe", "Ozurgeti", "Tsqaltubo", "Sagarejo", "Gardabani", "Kaspi"
        ]
    },
    {
        code: "AM",
        name: "Armenia",
        nameTr: "Ermenistan",
        cities: [
            "Yerevan", "Gyumri", "Vanadzor", "Vagharshapat", "Hrazdan", "Abovyan", "Armavir",
            "Kapan", "Charentsavan", "Sevan", "Gavar", "Artashat", "Goris", "Masis",
            "Ashtarak", "Stepanavan", "Ijevan", "Dilijan", "Tashir", "Berd"
        ]
    },
    {
        code: "TW",
        name: "Taiwan",
        nameTr: "Tayvan",
        cities: [
            "Taipei", "Kaohsiung", "Taichung", "Tainan", "Banqiao", "Hsinchu", "Taoyuan",
            "Keelung", "Zhongli", "Chiayi", "Hualien", "Taitung", "Nantou", "Yilan",
            "Douliu", "Puli", "Miaoli", "Magong", "Lukang", "Hengchun"
        ]
    },
    {
        code: "LK",
        name: "Sri Lanka",
        nameTr: "Sri Lanka",
        cities: [
            "Colombo", "Dehiwala-Mount Lavinia", "Moratuwa", "Sri Jayawardenepura Kotte", "Negombo", "Kandy",
            "Kalmunai", "Vavuniya", "Galle", "Trincomalee", "Batticaloa", "Jaffna", "Katunayake",
            "Dambulla", "Kolonnawa", "Anuradhapura", "Ratnapura", "Matara", "Badulla", "Kurunegala"
        ]
    },
    {
        code: "NP",
        name: "Nepal",
        nameTr: "Nepal",
        cities: [
            "Kathmandu", "Pokhara", "Lalitpur", "Bharatpur", "Birgunj", "Biratnagar", "Janakpur",
            "Hetauda", "Dharan", "Tulsipur", "Itahari", "Butwal", "Dhangadhi", "Bhaktapur",
            "Nepalgunj", "Birendranagar", "Bhadrapur", "Mechinagar", "Madhyapur Thimi", "Ghorahi"
        ]
    },
    {
        code: "MM",
        name: "Myanmar",
        nameTr: "Myanmar",
        cities: [
            "Yangon", "Mandalay", "Naypyidaw", "Mawlamyine", "Kyaukse", "Meiktila", "Pathein",
            "Sittwe", "Monywa", "Taunggyi", "Myitkyina", "Bago", "Pyay", "Pakokku",
            "Hpa-An", "Lashio", "Dawei", "Shwebo", "Magway", "Myeik"
        ]
    },
    {
        code: "KH",
        name: "Cambodia",
        nameTr: "Kamboçya",
        cities: [
            "Phnom Penh", "Siem Reap", "Battambang", "Sihanoukville", "Kampong Cham", "Kampong Speu",
            "Prey Veng", "Kampong Chhnang", "Kampot", "Kandal", "Svay Rieng", "Takeo",
            "Pursat", "Kratie", "Koh Kong", "Stung Treng", "Mondulkiri", "Ratanakiri", "Kep", "Pailin"
        ]
    },
    {
        code: "MN",
        name: "Mongolia",
        nameTr: "Moğolistan",
        cities: [
            "Ulaanbaatar", "Erdenet", "Darkhan", "Choibalsan", "Mandal", "Moron", "Nalaikh",
            "Khovd", "Ölgii", "Bayankhongor", "Öndörkhaan", "Arvaikheer", "Dalanzadgad",
            "Tsetserleg", "Baruun-Urt", "Uliastai", "Sainshand", "Altai", "Zuunmod", "Bulgan"
        ]
    },
    {
        code: "UZ",
        name: "Uzbekistan",
        nameTr: "Özbekistan",
        cities: [
            "Tashkent", "Samarkand", "Namangan", "Andijan", "Bukhara", "Nukus", "Fergana",
            "Qarshi", "Kokand", "Margilan", "Termez", "Jizzakh", "Navoi", "Angren",
            "Urganch", "Gulistan", "Chirchiq", "Yangiyer", "Bekabad", "Khiva"
        ]
    },
    {
        code: "AF",
        name: "Afghanistan",
        nameTr: "Afganistan",
        cities: [
            "Kabul", "Kandahar", "Herat", "Mazar-i-Sharif", "Jalalabad", "Kunduz", "Ghazni",
            "Charikar", "Puli Khumri", "Sheberghan", "Sar-e Pol", "Khost", "Taloqan",
            "Lashkar Gah", "Puli Alam", "Gardez", "Zaranj", "Farah", "Maimana", "Qalat"
        ]
    },
    // Americas
    {
        code: "CO",
        name: "Colombia",
        nameTr: "Kolombiya",
        cities: [
            "Bogota", "Medellin", "Cali", "Barranquilla", "Cartagena", "Cucuta", "Pereira",
            "Bucaramanga", "Manizales", "Ibague", "Santa Marta", "Pasto", "Armenia", "Villavicencio",
            "Neiva", "Soacha", "Soledad", "Monteria", "Valledupar", "Popayan"
        ]
    },
    {
        code: "CL",
        name: "Chile",
        nameTr: "Şili",
        cities: [
            "Santiago", "Valparaiso", "Concepcion", "La Serena", "Antofagasta", "Iquique", "Temuco",
            "Rancagua", "Talca", "Arica", "Punta Arenas", "Puerto Montt", "Chillan", "Calama",
            "Coquimbo", "Osorno", "Valdivia", "Quilpue", "Copiapo", "Los Angeles"
        ]
    },
    {
        code: "PE",
        name: "Peru",
        nameTr: "Peru",
        cities: [
            "Lima", "Arequipa", "Trujillo", "Chiclayo", "Piura", "Iquitos", "Cusco",
            "Chimbote", "Huancayo", "Tacna", "Ica", "Juliaca", "Callao", "Pucallpa",
            "Sullana", "Ayacucho", "Cajamarca", "Huacho", "Puno", "Huanuco"
        ]
    },
    {
        code: "VE",
        name: "Venezuela",
        nameTr: "Venezuela",
        cities: [
            "Caracas", "Maracaibo", "Valencia", "Barquisimeto", "Maracay", "Ciudad Guayana", "Petare",
            "San Cristobal", "Maturin", "Barcelona", "Puerto La Cruz", "Ciudad Bolivar", "Merida",
            "Cabimas", "Punto Fijo", "Turmero", "Barinas", "Los Teques", "Cumana", "Guarenas"
        ]
    },
    {
        code: "UY",
        name: "Uruguay",
        nameTr: "Uruguay",
        cities: [
            "Montevideo", "Salto", "Ciudad de la Costa", "Paysandu", "Las Piedras", "Rivera",
            "Maldonado", "Tacuarembo", "Melo", "Mercedes", "Artigas", "Minas", "San Jose de Mayo",
            "Durazno", "Florida", "Barros Blancos", "Ciudad del Plata", "San Carlos", "Pando", "Fray Bentos"
        ]
    },
    {
        code: "CU",
        name: "Cuba",
        nameTr: "Küba",
        cities: [
            "Havana", "Santiago de Cuba", "Camaguey", "Holguin", "Santa Clara", "Guantanamo", "Pinar del Rio",
            "Las Tunas", "Bayamo", "Cienfuegos", "Victoria de las Tunas", "Matanzas", "Manzanillo",
            "Ciego de Avila", "Sancti Spiritus", "Palma Soriano", "Alamar", "Guanabacoa", "Diez de Octubre", "Arroyo Naranjo"
        ]
    },
    {
        code: "GT",
        name: "Guatemala",
        nameTr: "Guatemala",
        cities: [
            "Guatemala City", "Mixco", "Villa Nueva", "Quetzaltenango", "San Miguel Petapa", "Escuintla",
            "San Juan Sacatepequez", "Villa Canales", "Chinautla", "Chimaltenango", "Amatitlan", "Huehuetenango",
            "Puerto Barrios", "Totonicapan", "Coban", "Mazatenango", "Chiquimula", "Retalhuleu", "San Francisco El Alto", "Antigua"
        ]
    },
    {
        code: "PA",
        name: "Panama",
        nameTr: "Panama",
        cities: [
            "Panama City", "San Miguelito", "Colón", "David", "La Chorrera", "Santiago", "Chilibre",
            "Penonome", "Chitre", "Bocas del Toro", "Puerto Armuelles", "La Concepcion", "Aguadulce",
            "Anton", "Las Tablas", "Chepo", "El Porvenir", "Arraijan", "Vista Alegre", "Cativa"
        ]
    },
    {
        code: "DO",
        name: "Dominican Republic",
        nameTr: "Dominik Cumhuriyeti",
        cities: [
            "Santo Domingo", "Santiago de los Caballeros", "Santo Domingo Este", "Santo Domingo Norte", "San Pedro de Macoris",
            "La Romana", "Boca Chica", "San Cristobal", "Puerto Plata", "San Francisco de Macoris",
            "Higüey", "Concepcion de La Vega", "Santa Cruz de Barahona", "Moca", "Cotui", "Bonao", "Azua"
        ]
    },
    {
        code: "CR",
        name: "Costa Rica",
        nameTr: "Kosta Rika",
        cities: [
            "San Jose", "Cartago", "Limon", "Alajuela", "Heredia", "Liberia", "Puntarenas",
            "San Vicente", "San Josecito", "Turrialba", "Paraiso", "Pavas", "Siquirres", "Nicoya",
            "Desamparados", "Curridabat", "Escazu", "Grecia", "Zarcero", "Canas"
        ]
    },
    {
        code: "JM",
        name: "Jamaica",
        nameTr: "Jamaika",
        cities: [
            "Kingston", "New Kingston", "Spanish Town", "Portmore", "Montego Bay", "Mandeville", "May Pen",
            "Half Way Tree", "Savanna-la-Mar", "Ocho Rios", "Negril", "Port Antonio", "St. Ann's Bay",
            "Morant Bay", "Linstead", "Old Harbour", "Santa Cruz", "Falmouth", "Ewarton", "Constant Spring"
        ]
    }
];

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
    return countries.find(c => c.code === code);
}

export function getCitiesByCountryCode(code: string): string[] {
    const country = getCountryByCode(code);
    return country ? country.cities : [];
}

export function formatLocation(countryCode: string, city: string, locale: 'tr' | 'en' = 'tr'): string {
    const country = getCountryByCode(countryCode);
    if (!country) return city;
    const countryName = locale === 'tr' ? country.nameTr : country.name;
    return `${city}, ${countryName}`;
}

// Parse location string to country and city
export function parseLocation(location: string): { countryCode?: string; city?: string } {
    if (!location) return {};
    const parts = location.split(',').map(p => p.trim());
    if (parts.length >= 2) {
        const city = parts[0];
        const countryName = parts[1];
        const country = countries.find(c => 
            c.name === countryName || c.nameTr === countryName
        );
        if (country) {
            return { countryCode: country.code, city };
        }
    }
    return { city: location };
}
