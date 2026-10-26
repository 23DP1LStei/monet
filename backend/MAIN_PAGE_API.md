# Sākumlapas API

Sākumlapas kods izmanto esošo routes → controllers → services → datubāzes
struktūru. Visi telpu lasīšanas galapunkti ir publiski; JWT nav nepieciešams.
Autentifikācijas kods un datubāzes shēma nav mainīti.

## Aktīvās telpas: GET /api/spaces

Parametri ir neobligāti:

| Parametrs | Nozīme | Noklusējums |
|---|---|---|
| `location` | Teksta meklēšana adresē, 1–255 simboli | Nav filtra |
| `period` | `hour` vai `day`; izvēlas kartītē parādāmo tarifu | `day` |
| `limit` | Telpu skaits, vesels skaitlis 1–100 | `20` |
| `offset` | Izlaižamo telpu skaits, nenegatīvs drošs vesels skaitlis | `0` |

Piemērs:

```http
GET /api/spaces?location=Riga&period=hour&limit=10&offset=0
```

```json
{
  "success": true,
  "spaces": [
    {
      "space_id": 1,
      "space_name": "Riga Workspace",
      "address": "Brīvības iela 10, Riga",
      "price_per_hour": 5.5,
      "price_per_day": 29,
      "price": 5.5,
      "price_period": "hour",
      "photo_path": "/images/first.jpg",
      "average_rating": 4.33,
      "review_count": 3
    }
  ],
  "pagination": { "limit": 10, "offset": 0, "count": 1 }
}
```

- Atgriež tikai `is_active = TRUE` telpas, sakārtotas pēc `space_id`.
- Lokācija tiek meklēta adresē; tas nav atsevišķs, precīzs pilsētas filtrs.
- `%`, `_` un `!` lokācijā tiek meklēti kā parasts teksts. SQL vērtības ir parametrizētas.
- Cenas tiek atgrieztas kā JSON skaitļi. `price` ir tarifs par izvēlēto periodu,
  nevis rezervācijas kopējās izmaksas. Nulles tarifs netiek pārrēķināts.
- `photo_path` ir esošais datubāzes ceļš foto ar mazāko `photo_id`.
  Attēlu augšupielāde un failu apkalpošana nav šī moduļa daļa; jāvienojas par publiski pieejamiem ceļiem.
- Bez attēla `photo_path` ir `null`. Bez atsauksmēm `average_rating` ir `null`,
  `review_count` ir `0`. Vidējais vērtējums ir noapaļots līdz divām zīmēm.
- Neatrastu rezultātu gadījumā: `200`, `spaces: []`.
- `pagination.count` ir šajā atbildē atgriezto telpu skaits, nevis kopējais rezultātu skaits.

## Validācija un kļūdas

Nederīgi, atkārtoti, strukturēti vai neatbalstīti parametri atgriež `400`:

```json
{
  "success": false,
  "message": "Nederīgi meklēšanas parametri.",
  "errors": [{ "field": "limit", "message": "limit jābūt veselam skaitlim no 1 līdz 100." }]
}
```

`city`, `type`, `date` un `period=month` pašlaik atgriež `400` ar paskaidrojumu,
kas jāsaskaņo. Šie parametri netiek klusi ignorēti. Arī citi nezināmi parametri tiek noraidīti.

Telpu datubāzes vaicājuma kļūda atgriež `500` un vispārīgu ziņu
`Neizdevās iegūt telpu sarakstu.`; SQL detaļas paliek servera žurnālā.

## Galapunkti, kuru loģika vēl jāsaskaņo

- `GET /api/spaces/featured`: maršruts ir izveidots, bet atgriež `501`.
  Jāizvēlas `is_featured` pazīme vai konkrēta popularitātes formula. Parastu telpu
  sarakstu pagaidām neatgriež kā izceltās telpas. Parametri tiek validēti tāpat kā sarakstam.
- `GET /api/spaces/cities`: maršruts atgriež `501`, jo nav `city` lauka.

Komandai vēl jāsaskaņo:

1. `city`, `space_type`, `price_per_month` un iespējamais `is_featured` lauks,
   esošo datu papildināšana un datubāzes migrācijas.
2. Datuma/laika meklēšana: laika zona, visa diena vai intervāls, vietu skaits,
   rezervāciju pārklāšanās un kuri statusi aizņem vietas.
3. Foto ceļu publicēšana un galvenā attēla izvēle, ja ar mazāko `photo_id` nepietiek.

Jaunas tabulas/lauki un rezervāciju izveide šajā izmaiņā netiek ieviesti.

## Datubāze un testi

Izstrādei izmanto MySQL ar esošajām `coworking_spaces`, `photos` un `reviews`
tabulām no `src/db/schema.sql`. API neveido tabulas un nemaina datus.
Esošais automātiskais SQLite rezerves režīms veido tikai `roles` un `users`;
tajā telpu API bez nepieciešamajām tabulām atgriezīs `500`.

```bash
npm test
```

Skripts palaiž esošos autentifikācijas testus un `tests/spaces.test.js`.
Telpu testi izmanto īstu Express HTTP serveri un atsevišķu SQLite atmiņas
datubāzi ar testu tabulām. Tie nemaina MySQL datubāzi vai projekta shēmu.
Pārbaudes aptver aktīvo telpu atlasi, foto un atsauksmju piesaisti, cenu periodus,
lokācijas meklēšanu, lapošanu, parametru robežas un SQL speciālos simbolus,
neatbalstītās funkcijas, datubāzes kļūdas un esošo autentifikāciju caur HTTP.
Šie testi nepārbauda MySQL savienojumu un MySQL specifiskās atšķirības;
pirms integrācijas jāpārbauda endpointi arī komandas MySQL vidē.
