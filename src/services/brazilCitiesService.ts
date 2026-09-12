/**
 * Brazilian Municipalities & IBGE Search Service
 * Provides automatic searching, autocomplete, and weather location mapping
 * for all 5,570 Brazilian municipalities and 27 UFs.
 */

import { CityLocation, POPULAR_AGRO_CITIES } from './weatherService';

export interface BrazilCity {
  id: string;
  ibgeCode?: number;
  name: string;
  state: string; // UF e.g. "GO", "MT"
  fullName: string; // e.g. "Rio Verde - GO"
  latitude?: number;
  longitude?: number;
  region?: string;
}

export const BRAZIL_STATES: { uf: string; name: string }[] = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AL', name: 'Alagoas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'BA', name: 'Bahia' },
  { uf: 'CE', name: 'Ceará' },
  { uf: 'DF', name: 'Distrito Federal' },
  { uf: 'ES', name: 'Espírito Santo' },
  { uf: 'GO', name: 'Goiás' },
  { uf: 'MA', name: 'Maranhão' },
  { uf: 'MT', name: 'Mato Grosso' },
  { uf: 'MS', name: 'Mato Grosso do Sul' },
  { uf: 'MG', name: 'Minas Gerais' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'PB', name: 'Paraíba' },
  { uf: 'PR', name: 'Paraná' },
  { uf: 'PE', name: 'Pernambuco' },
  { uf: 'PI', name: 'Piauí' },
  { uf: 'RJ', name: 'Rio de Janeiro' },
  { uf: 'RN', name: 'Rio Grande do Norte' },
  { uf: 'RS', name: 'Rio Grande do Sul' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'SC', name: 'Santa Catarina' },
  { uf: 'SP', name: 'São Paulo' },
  { uf: 'SE', name: 'Sergipe' },
  { uf: 'TO', name: 'Tocantins' },
];

/**
  Top Agro Cities dataset pre-loaded with geographic coordinates
*/
export const EXPANDED_AGRO_CITIES: BrazilCity[] = [
  { id: 'rio-verde-go', ibgeCode: 5218805, name: 'Rio Verde', state: 'GO', fullName: 'Rio Verde - GO', latitude: -17.7947, longitude: -50.9192, region: 'Sudoeste Goiano' },
  { id: 'sorriso-mt', ibgeCode: 5107925, name: 'Sorriso', state: 'MT', fullName: 'Sorriso - MT', latitude: -12.5425, longitude: -55.7214, region: 'Norte MT' },
  { id: 'luis-eduardo-magalhaes-ba', ibgeCode: 2919553, name: 'Luís Eduardo Magalhães', state: 'BA', fullName: 'Luís Eduardo Magalhães - BA', latitude: -12.0952, longitude: -45.7958, region: 'Oeste Baiano' },
  { id: 'cascavel-pr', ibgeCode: 4104808, name: 'Cascavel', state: 'PR', fullName: 'Cascavel - PR', latitude: -24.9578, longitude: -53.4595, region: 'Oeste PR' },
  { id: 'primavera-do-leste-mt', ibgeCode: 5107040, name: 'Primavera do Leste', state: 'MT', fullName: 'Primavera do Leste - MT', latitude: -15.5583, longitude: -54.2981, region: 'Sudeste MT' },
  { id: 'jatai-go', ibgeCode: 5211909, name: 'Jataí', state: 'GO', fullName: 'Jataí - GO', latitude: -17.8814, longitude: -51.7144, region: 'Sudoeste Goiano' },
  { id: 'cristalina-go', ibgeCode: 5206206, name: 'Cristalina', state: 'GO', fullName: 'Cristalina - GO', latitude: -16.7686, longitude: -47.6139, region: 'Entorno do DF' },
  { id: 'dourados-ms', ibgeCode: 5003702, name: 'Dourados', state: 'MS', fullName: 'Dourados - MS', latitude: -22.2211, longitude: -54.8056, region: 'Sul MS' },
  { id: 'campo-novo-do-parecis-mt', ibgeCode: 5102637, name: 'Campo Novo do Parecis', state: 'MT', fullName: 'Campo Novo do Parecis - MT', latitude: -13.6756, longitude: -57.8939, region: 'Parecis MT' },
  { id: 'balsas-ma', ibgeCode: 2101400, name: 'Balsas', state: 'MA', fullName: 'Balsas - MA', latitude: -7.5322, longitude: -46.0375, region: 'Sul MA / Matopiba' },
  { id: 'lucas-do-rio-verde-mt', ibgeCode: 5105259, name: 'Lucas do Rio Verde', state: 'MT', fullName: 'Lucas do Rio Verde - MT', latitude: -13.0544, longitude: -55.9122, region: 'Norte MT' },
  { id: 'sinop-mt', ibgeCode: 5107909, name: 'Sinop', state: 'MT', fullName: 'Sinop - MT', latitude: -11.8642, longitude: -55.5028, region: 'Norte MT' },
  { id: 'rondonopolis-mt', ibgeCode: 5107602, name: 'Rondonópolis', state: 'MT', fullName: 'Rondonópolis - MT', latitude: -16.4674, longitude: -54.6372, region: 'Sul MT' },
  { id: 'querencia-mt', ibgeCode: 5107065, name: 'Querência', state: 'MT', fullName: 'Querência - MT', latitude: -12.6033, longitude: -52.1906, region: 'Araguaia MT' },
  { id: 'canarana-mt', ibgeCode: 5102702, name: 'Canarana', state: 'MT', fullName: 'Canarana - MT', latitude: -13.5528, longitude: -52.2683, region: 'Araguaia MT' },
  { id: 'sapezal-mt', ibgeCode: 5107875, name: 'Sapezal', state: 'MT', fullName: 'Sapezal - MT', latitude: -13.5433, longitude: -58.8106, region: 'Parecis MT' },
  { id: 'barreiras-ba', ibgeCode: 2903201, name: 'Barreiras', state: 'BA', fullName: 'Barreiras - BA', latitude: -12.1528, longitude: -44.9900, region: 'Oeste Baiano' },
  { id: 'maracaju-ms', ibgeCode: 5005400, name: 'Maracaju', state: 'MS', fullName: 'Maracaju - MS', latitude: -21.6142, longitude: -55.1683, region: 'Centro MS' },
  { id: 'siderlandia-ms', ibgeCode: 5007901, name: 'Sidrolândia', state: 'MS', fullName: 'Sidrolândia - MS', latitude: -20.9319, longitude: -54.9614, region: 'Centro MS' },
  { id: 'ponta-pora-ms', ibgeCode: 5006606, name: 'Ponta Porã', state: 'MS', fullName: 'Ponta Porã - MS', latitude: -22.5361, longitude: -55.7256, region: 'Fronteira MS' },
  { id: 'unai-mg', ibgeCode: 3170404, name: 'Unaí', state: 'MG', fullName: 'Unaí - MG', latitude: -16.3578, longitude: -46.9061, region: 'Noroeste MG' },
  { id: 'patos-de-minas-mg', ibgeCode: 3148004, name: 'Patos de Minas', state: 'MG', fullName: 'Patos de Minas - MG', latitude: -18.5789, longitude: -46.5181, region: 'Alto Paranaíba' },
  { id: 'uberaba-mg', ibgeCode: 3170107, name: 'Uberaba', state: 'MG', fullName: 'Uberaba - MG', latitude: -19.7483, longitude: -47.9319, region: 'Triângulo Mineiro' },
  { id: 'uberlandia-mg', ibgeCode: 3170206, name: 'Uberlândia', state: 'MG', fullName: 'Uberlândia - MG', latitude: -18.9186, longitude: -48.2772, region: 'Triângulo Mineiro' },
  { id: 'formosa-go', ibgeCode: 5208004, name: 'Formosa', state: 'GO', fullName: 'Formosa - GO', latitude: -15.5375, longitude: -47.3336, region: 'Entorno do DF' },
  { id: 'mineiros-go', ibgeCode: 5213103, name: 'Mineiros', state: 'GO', fullName: 'Mineiros - GO', latitude: -17.5681, longitude: -52.5511, region: 'Sudoeste Goiano' },
  { id: 'montividiu-go', ibgeCode: 5213756, name: 'Montividiu', state: 'GO', fullName: 'Montividiu - GO', latitude: -17.4422, longitude: -51.1731, region: 'Sudoeste Goiano' },
  { id: 'chapadão-do-ceu-go', ibgeCode: 5205497, name: 'Chapadão do Céu', state: 'GO', fullName: 'Chapadão do Céu - GO', latitude: -18.3931, longitude: -52.6669, region: 'Sudoeste Goiano' },
  { id: 'chapadão-do-sul-ms', ibgeCode: 5002951, name: 'Chapadão do Sul', state: 'MS', fullName: 'Chapadão do Sul - MS', latitude: -18.7911, longitude: -52.6172, region: 'Norte MS' },
  { id: 'londrina-pr', ibgeCode: 4113700, name: 'Londrina', state: 'PR', fullName: 'Londrina - PR', latitude: -23.3103, longitude: -51.1628, region: 'Norte PR' },
  { id: 'maringa-pr', ibgeCode: 4115200, name: 'Maringá', state: 'PR', fullName: 'Maringá - PR', latitude: -23.4208, longitude: -51.9331, region: 'Norte PR' },
  { id: 'campo-mourao-pr', ibgeCode: 4104303, name: 'Campo Mourão', state: 'PR', fullName: 'Campo Mourão - PR', latitude: -24.0439, longitude: -52.3789, region: 'Centro-Oeste PR' },
  { id: 'guarapuava-pr', ibgeCode: 4109401, name: 'Guarapuava', state: 'PR', fullName: 'Guarapuava - PR', latitude: -25.3906, longitude: -51.4628, region: 'Centro PR' },
  { id: 'ponta-grossa-pr', ibgeCode: 4119905, name: 'Ponta Grossa', state: 'PR', fullName: 'Ponta Grossa - PR', latitude: -25.0950, longitude: -50.1619, region: 'Campos Gerais' },
  { id: 'ijui-rs', ibgeCode: 4310207, name: 'Ijuí', state: 'RS', fullName: 'Ijuí - RS', latitude: -28.3878, longitude: -53.9242, region: 'Noroeste RS' },
  { id: 'passo-fundo-rs', ibgeCode: 4314100, name: 'Passo Fundo', state: 'RS', fullName: 'Passo Fundo - RS', latitude: -28.2628, longitude: -52.4092, region: 'Planalto RS' },
  { id: 'santa-rosa-rs', ibgeCode: 4317202, name: 'Santa Rosa', state: 'RS', fullName: 'Santa Rosa - RS', latitude: -27.8703, longitude: -54.4811, region: 'Noroeste RS' },
  { id: 'cruz-alta-rs', ibgeCode: 4306106, name: 'Cruz Alta', state: 'RS', fullName: 'Cruz Alta - RS', latitude: -28.6386, longitude: -53.6064, region: 'Planalto RS' },
  { id: 'uruguaiana-rs', ibgeCode: 4322400, name: 'Uruguaiana', state: 'RS', fullName: 'Uruguaiana - RS', latitude: -29.7619, longitude: -57.0850, region: 'Fronteira Oeste' },
  { id: 'dona-francisca-rs', ibgeCode: 4306601, name: 'Dona Francisca', state: 'RS', fullName: 'Dona Francisca - RS', latitude: -29.6208, longitude: -53.3564, region: 'Central RS' },
  { id: 'palmas-to', ibgeCode: 1721000, name: 'Palmas', state: 'TO', fullName: 'Palmas - TO', latitude: -10.2491, longitude: -48.3242, region: 'Central TO' },
  { id: 'gurupi-to', ibgeCode: 1709500, name: 'Gurupi', state: 'TO', fullName: 'Gurupi - TO', latitude: -11.7292, longitude: -49.0686, region: 'Sul TO' },
  { id: 'porto-nacional-to', ibgeCode: 1718204, name: 'Porto Nacional', state: 'TO', fullName: 'Porto Nacional - TO', latitude: -10.7081, longitude: -48.4172, region: 'Central TO' },
  { id: 'pedro-afonso-to', ibgeCode: 1717008, name: 'Pedro Afonso', state: 'TO', fullName: 'Pedro Afonso - TO', latitude: -8.9708, longitude: -48.1750, region: 'Norte TO' },
  { id: 'santarem-pa', ibgeCode: 1506807, name: 'Santarém', state: 'PA', fullName: 'Santarém - PA', latitude: -2.4431, longitude: -54.7083, region: 'Baixo Amazonas' },
  { id: 'paragominas-pa', ibgeCode: 1505502, name: 'Paragominas', state: 'PA', fullName: 'Paragominas - PA', latitude: -2.9981, longitude: -47.3528, region: 'Sudeste PA' },
  { id: 'redencao-pa', ibgeCode: 1506138, name: 'Redenção', state: 'PA', fullName: 'Redenção - PA', latitude: -8.0264, longitude: -50.0319, region: 'Sul PA' },
  { id: 'vilhena-ro', ibgeCode: 1100304, name: 'Vilhena', state: 'RO', fullName: 'Vilhena - RO', latitude: -12.7406, longitude: -60.1458, region: 'Cone Sul RO' },
  { id: 'cacoal-ro', ibgeCode: 1100049, name: 'Cacoal', state: 'RO', fullName: 'Cacoal - RO', latitude: -11.4386, longitude: -61.4472, region: 'Central RO' },
  { id: 'uaupes-ro', ibgeCode: 1100023, name: 'Ariquemes', state: 'RO', fullName: 'Ariquemes - RO', latitude: -9.9133, longitude: -63.0408, region: 'Vale do Jamari' },
  { id: 'ribeirao-preto-sp', ibgeCode: 3543402, name: 'Ribeirão Preto', state: 'SP', fullName: 'Ribeirão Preto - SP', latitude: -21.1704, longitude: -47.8103, region: 'Alta Mogiana' },
  { id: 'araraquara-sp', ibgeCode: 3503208, name: 'Araraquara', state: 'SP', fullName: 'Araraquara - SP', latitude: -21.7944, longitude: -48.1756, region: 'Central SP' },
  { id: 'presidente-prudente-sp', ibgeCode: 3541406, name: 'Presidente Prudente', state: 'SP', fullName: 'Presidente Prudente - SP', latitude: -22.1256, longitude: -51.3889, region: 'Alta Sorocabana' },
  { id: 'itapeva-sp', ibgeCode: 3522406, name: 'Itapeva', state: 'SP', fullName: 'Itapeva - SP', latitude: -23.9822, longitude: -48.8758, region: 'Sudoeste Paulista' },
  { id: 'petrolina-pe', ibgeCode: 2611101, name: 'Petrolina', state: 'PE', fullName: 'Petrolina - PE', latitude: -9.3889, longitude: -40.5008, region: 'Vale do São Francisco' },
  { id: 'juazeiro-ba', ibgeCode: 2918407, name: 'Juazeiro', state: 'BA', fullName: 'Juazeiro - BA', latitude: -9.4161, longitude: -40.5033, region: 'Vale do São Francisco' },
  { id: 'bom-jesus-pi', ibgeCode: 2201903, name: 'Bom Jesus', state: 'PI', fullName: 'Bom Jesus - PI', latitude: -9.0742, longitude: -44.3564, region: 'Sul PI / Matopiba' },
  { id: 'urucui-pi', ibgeCode: 2211209, name: 'Uruçuí', state: 'PI', fullName: 'Uruçuí - PI', latitude: -7.2294, longitude: -44.5564, region: 'Sul PI / Matopiba' },
  { id: 'boavista-rr', ibgeCode: 1400100, name: 'Boa Vista', state: 'RR', fullName: 'Boa Vista - RR', latitude: 2.8236, longitude: -60.6758, region: 'Lavrado Roraima' },
  { id: 'chapeco-sc', ibgeCode: 4204202, name: 'Chapecó', state: 'SC', fullName: 'Chapecó - SC', latitude: -27.1003, longitude: -52.6153, region: 'Oeste Catarinense' },
  { id: 'xanxere-sc', ibgeCode: 4219507, name: 'Xanxerê', state: 'SC', fullName: 'Xanxerê - SC', latitude: -26.8747, longitude: -52.4036, region: 'Oeste Catarinense' },
  { id: 'lages-sc', ibgeCode: 4209300, name: 'Lages', state: 'SC', fullName: 'Lages - SC', latitude: -27.8158, longitude: -50.3258, region: 'Planalto Serrano' },
  { id: 'brasila-df', ibgeCode: 5300108, name: 'Brasília', state: 'DF', fullName: 'Brasília - DF', latitude: -15.7975, longitude: -47.8919, region: 'Distrito Federal' },
  { id: 'goiania-go', ibgeCode: 5208707, name: 'Goiânia', state: 'GO', fullName: 'Goiânia - GO', latitude: -16.6869, longitude: -49.2648, region: 'Central Goiana' },
  { id: 'cuiaba-mt', ibgeCode: 5103403, name: 'Cuiabá', state: 'MT', fullName: 'Cuiabá - MT', latitude: -15.6010, longitude: -56.0974, region: 'Baixada Cuiabana' },
  { id: 'campo-grande-ms', ibgeCode: 5002704, name: 'Campo Grande', state: 'MS', fullName: 'Campo Grande - MS', latitude: -20.4697, longitude: -54.6201, region: 'Centro MS' },
];

// In-memory cache for loaded IBGE cities
let cachedIbgeCities: BrazilCity[] | null = null;
let isFetchingIbge = false;

/**
 * Dynamically fetches all ~5,570 Brazilian municipalities from the official IBGE API
 */
export async function fetchAllIbgeMunicipalities(): Promise<BrazilCity[]> {
  if (cachedIbgeCities && cachedIbgeCities.length > 0) {
    return cachedIbgeCities;
  }

  if (isFetchingIbge) {
    // Wait briefly if already fetching
    await new Promise(res => setTimeout(res, 400));
    return cachedIbgeCities || EXPANDED_AGRO_CITIES;
  }

  try {
    isFetchingIbge = true;
    const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/municipios?orderBy=nome');
    if (!response.ok) {
      throw new Error(`IBGE API returned status ${response.status}`);
    }

    const rawData = await response.json();
    if (Array.isArray(rawData) && rawData.length > 0) {
      const parsed: BrazilCity[] = rawData.map((item: any) => {
        const cityName = item.nome;
        const stateUf = item.microrregiao?.mesorregiao?.UF?.sigla || item.regiaoImediata?.regiaoIntermediaria?.UF?.sigla || 'BR';
        const fullName = `${cityName} - ${stateUf}`;
        const cleanId = `${cityName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-')}-${stateUf.toLowerCase()}`;

        // See if we have exact preset coords
        const preset = EXPANDED_AGRO_CITIES.find(c => c.ibgeCode === item.id || c.fullName.toLowerCase() === fullName.toLowerCase());

        return {
          id: cleanId,
          ibgeCode: item.id,
          name: cityName,
          state: stateUf,
          fullName,
          latitude: preset?.latitude,
          longitude: preset?.longitude,
          region: item.microrregiao?.nome || item.regiaoImediata?.nome || 'Brasil'
        };
      });

      cachedIbgeCities = parsed;
      isFetchingIbge = false;
      return parsed;
    }
  } catch (err) {
    console.warn('Fallback to preloaded agro cities (offline or network restriction):', err);
  } finally {
    isFetchingIbge = false;
  }

  cachedIbgeCities = EXPANDED_AGRO_CITIES;
  return EXPANDED_AGRO_CITIES;
}

/**
 * Instant local/remote search for cities by name or state UF
 */
export async function searchBrazilCities(
  query: string, 
  stateFilter?: string
): Promise<BrazilCity[]> {
  const all = cachedIbgeCities && cachedIbgeCities.length > 100 
    ? cachedIbgeCities 
    : EXPANDED_AGRO_CITIES;

  const cleanQuery = query.toLowerCase().trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  let filtered = all.filter(c => {
    if (stateFilter && stateFilter !== 'ALL' && c.state !== stateFilter) {
      return false;
    }

    if (!cleanQuery) return true;

    const cleanName = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const cleanFull = c.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    return cleanName.includes(cleanQuery) || cleanFull.includes(cleanQuery);
  });

  // If query is short or empty, return top matches
  if (!cleanQuery) {
    return filtered.slice(0, 30);
  }

  // If local list yielded few results, trigger IBGE fetch if not loaded yet
  if (filtered.length === 0 && !cachedIbgeCities) {
    const fullIbge = await fetchAllIbgeMunicipalities();
    return fullIbge.filter(c => {
      if (stateFilter && stateFilter !== 'ALL' && c.state !== stateFilter) return false;
      const cleanName = c.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      return cleanName.includes(cleanQuery);
    }).slice(0, 30);
  }

  return filtered.slice(0, 30);
}

/**
 * Helper to match any city name or "City - UF" string into a valid Weather CityLocation
 */
export function resolveCityLocation(cityStateStr?: string): CityLocation {
  if (!cityStateStr || !cityStateStr.trim()) {
    return POPULAR_AGRO_CITIES[0]; // Rio Verde - GO default
  }

  const clean = cityStateStr.toLowerCase().trim();

  // Try exact match in popular agro cities first
  const agroMatch = POPULAR_AGRO_CITIES.find(c => {
    const full = `${c.name} - ${c.state}`.toLowerCase();
    return full === clean || c.name.toLowerCase() === clean || clean.includes(c.name.toLowerCase());
  });

  if (agroMatch) return agroMatch;

  // Try match in expanded list
  const expandedMatch = EXPANDED_AGRO_CITIES.find(c => {
    const full = c.fullName.toLowerCase();
    return full === clean || c.name.toLowerCase() === clean || clean.includes(c.name.toLowerCase());
  });

  if (expandedMatch) {
    return {
      id: expandedMatch.id,
      name: expandedMatch.name,
      state: expandedMatch.state,
      country: 'Brasil',
      latitude: expandedMatch.latitude || -17.7947,
      longitude: expandedMatch.longitude || -50.9192,
      elevationMeters: 650,
      region: expandedMatch.region || expandedMatch.state,
    };
  }

  // Parse "City - UF" format dynamically
  const parts = cityStateStr.split('-');
  const namePart = parts[0]?.trim() || cityStateStr;
  const ufPart = parts[1]?.trim().toUpperCase() || 'GO';

  return {
    id: `custom-${namePart.toLowerCase().replace(/\s+/g, '-')}-${ufPart.toLowerCase()}`,
    name: namePart,
    state: ufPart,
    country: 'Brasil',
    latitude: -17.7947, // Centroid estimate or default
    longitude: -50.9192,
    elevationMeters: 600,
    region: `Município (${ufPart})`,
  };
}
