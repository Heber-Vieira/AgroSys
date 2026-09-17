import React, { useState, useMemo, useEffect } from 'react';
import { 
  UserProfile, 
  WhiteLabelTheme,
  SprayProduct, 
  FarmPlot, 
  ServiceOrder, 
  AgriculturalDrone 
} from '../types';
import { filterOrdersForUser } from '../utils/userPermissions';
import { showToast, showConfirm } from '../services/notificationService';
import { 
  Droplets, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Check, 
  RotateCcw, 
  Scale, 
  FileText,
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowDownAZ,
  Share2,
  Printer,
  Copy,
  Layers,
  FlaskConical,
  Plane,
  MapPin,
  Sliders,
  Save,
  X,
  Bookmark,
  DollarSign,
  Clock,
  Info,
  Calendar,
  Eye,
  BookOpen,
  Search,
  CheckCircle
} from 'lucide-react';
import { 
  CHEMICAL_LEAFLETS_DATABASE, 
  ChemicalLeaflet, 
  searchChemicalLeaflets 
} from '../data/chemicalLeafletsData';
import { ChemicalLeafletModal } from './ChemicalLeafletModal';
import { ChemicalLeafletLibrary } from './ChemicalLeafletLibrary';
import { ChemicalBulaSelector } from './ChemicalBulaSelector';
import { DronePhoto } from './DronePhotoBadge';
import { BrandLogo } from './BrandLogo';
import { formatDecimal, formatBRL, formatHectares, formatVolume } from '../utils/formatters';

interface SprayMixViewProps {
  currentUser: UserProfile;
  plots?: FarmPlot[];
  orders?: ServiceOrder[];
  drones?: AgriculturalDrone[];
  theme?: WhiteLabelTheme;
  onNavigate?: (view: string) => void;
}

// Preset Recipe Definition
interface SprayRecipePreset {
  id: string;
  name: string;
  crop: string;
  targetPest: string;
  description: string;
  recommendedSprayRateLHa: number;
  products: SprayProduct[];
}

const DEFAULT_PRESET_RECIPES: SprayRecipePreset[] = [
  {
    id: 'preset-soja-dessecacao',
    name: 'Dessecação Pré-Plantio Soja',
    crop: 'Soja',
    targetPest: 'Capim-amargoso & Buva resistente',
    description: 'Manejo outonal e dessecação de pré-semeadura com controle de folhas estreitas e largas.',
    recommendedSprayRateLHa: 10.0,
    products: [
      {
        id: 'prod-p1-1',
        name: 'Condicionador Redutor de pH & Antiespuma',
        category: 'ADJUVANT',
        dosePerHa: 0.05,
        doseUnit: 'L/ha',
        mixOrder: 1,
        chemicalClass: 'Ácido Fosfórico / Tensoativo',
        activeIngredient: 'Polioxietileno alquilfenol',
        costPerUnit: 42.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p1-2',
        name: 'Glifosato Sal Potássico 620 WG',
        category: 'HERBICIDE',
        dosePerHa: 2.0,
        doseUnit: 'kg/ha',
        mixOrder: 2,
        chemicalClass: 'Glicina substituída (WG)',
        activeIngredient: 'Glifosato Potássico 620 g/kg',
        costPerUnit: 35.0,
        packageUnitsEmpty: 4,
      },
      {
        id: 'prod-p1-3',
        name: 'Cletodim 240 EC (Graminicida)',
        category: 'HERBICIDE',
        dosePerHa: 0.45,
        doseUnit: 'L/ha',
        mixOrder: 4,
        chemicalClass: 'Ciclo-hexanodiona (EC)',
        activeIngredient: 'Cletodim 240 g/L',
        costPerUnit: 88.0,
        packageUnitsEmpty: 2,
      },
      {
        id: 'prod-p1-4',
        name: 'Óleo Mineral Antideriva & Espalhante',
        category: 'ADJUVANT',
        dosePerHa: 0.50,
        doseUnit: 'L/ha',
        mixOrder: 5,
        chemicalClass: 'Hidrocarboneto alifático',
        activeIngredient: 'Óleo parafínico refinado',
        costPerUnit: 28.0,
        packageUnitsEmpty: 2,
      }
    ]
  },
  {
    id: 'preset-soja-fungicida',
    name: 'Fungicida Fechamento de Linhas (Soja)',
    crop: 'Soja',
    targetPest: 'Ferrugem Asiática (Phakopsora) & DFCs',
    description: 'Aplicação preventiva crucial no estádio R1/R2 com triazol, estrobilurina e protetor multissítio.',
    recommendedSprayRateLHa: 10.0,
    products: [
      {
        id: 'prod-p2-1',
        name: 'Condicionador Quelatizante de Água',
        category: 'ADJUVANT',
        dosePerHa: 0.05,
        doseUnit: 'L/ha',
        mixOrder: 1,
        chemicalClass: 'Ácido fosfórico / Quelante',
        activeIngredient: 'Complexo orgânico quelatado',
        costPerUnit: 48.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p2-2',
        name: 'Protioconazol + Trifloxistrobina (WG)',
        category: 'FUNGICIDE',
        dosePerHa: 0.40,
        doseUnit: 'kg/ha',
        mixOrder: 2,
        chemicalClass: 'Triazol + Estrobilurina (WG)',
        activeIngredient: 'Protioconazol 175 + Triflox 150 g/kg',
        costPerUnit: 260.0,
        packageUnitsEmpty: 2,
      },
      {
        id: 'prod-p2-3',
        name: 'Mancozebe Multissítio Líquido (SC)',
        category: 'FUNGICIDE',
        dosePerHa: 1.50,
        doseUnit: 'L/ha',
        mixOrder: 3,
        chemicalClass: 'Ditiocarbamato (SC)',
        activeIngredient: 'Mancozebe 430 g/L',
        costPerUnit: 44.0,
        packageUnitsEmpty: 6,
      },
      {
        id: 'prod-p2-4',
        name: 'Adjuvante Siliconado Super Espalhante',
        category: 'ADJUVANT',
        dosePerHa: 0.05,
        doseUnit: 'L/ha',
        mixOrder: 5,
        chemicalClass: 'Organosilicone',
        activeIngredient: 'Poliéter polimetil siloxano',
        costPerUnit: 140.0,
        packageUnitsEmpty: 1,
      }
    ]
  },
  {
    id: 'preset-milho-herbicida',
    name: 'Herbicida Pós-Emergência (Milho)',
    crop: 'Milho',
    targetPest: 'Folhas largas & Capim-colchão',
    description: 'Aplicação seletiva em V3-V4 para controle de plantas daninhas de difícil dessecação.',
    recommendedSprayRateLHa: 12.0,
    products: [
      {
        id: 'prod-p3-1',
        name: 'Regulador de pH & Sequestrante',
        category: 'ADJUVANT',
        dosePerHa: 0.06,
        doseUnit: 'L/ha',
        mixOrder: 1,
        chemicalClass: 'Ácido Dicarboxílico',
        activeIngredient: 'Acidificante tamponado',
        costPerUnit: 38.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p3-2',
        name: 'Atrazina 500 SC',
        category: 'HERBICIDE',
        dosePerHa: 3.0,
        doseUnit: 'L/ha',
        mixOrder: 3,
        chemicalClass: 'Triazina (SC)',
        activeIngredient: 'Atrazina 500 g/L',
        costPerUnit: 29.0,
        packageUnitsEmpty: 6,
      },
      {
        id: 'prod-p3-3',
        name: 'Mesotriona 480 SC',
        category: 'HERBICIDE',
        dosePerHa: 0.25,
        doseUnit: 'L/ha',
        mixOrder: 3,
        chemicalClass: 'Triketona (SC)',
        activeIngredient: 'Mesotriona 480 g/L',
        costPerUnit: 310.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p3-4',
        name: 'Adjuvante Óleo Vegetal Metilado (MSO)',
        category: 'ADJUVANT',
        dosePerHa: 0.50,
        doseUnit: 'L/ha',
        mixOrder: 5,
        chemicalClass: 'Éster metílico de óleo de soja',
        activeIngredient: 'Óleo vegetal transesterificado',
        costPerUnit: 32.0,
        packageUnitsEmpty: 2,
      }
    ]
  },
  {
    id: 'preset-algodao-inseticida',
    name: 'Controle de Bicudo & Lagartas (Algodão)',
    crop: 'Algodão',
    targetPest: 'Bicudo do algodoeiro & Helicoverpa',
    description: 'Manejo de choque com inseticida organofosforado e piretróide potencializado.',
    recommendedSprayRateLHa: 10.0,
    products: [
      {
        id: 'prod-p4-1',
        name: 'Acidificante & Neutralizador de Dureza',
        category: 'ADJUVANT',
        dosePerHa: 0.05,
        doseUnit: 'L/ha',
        mixOrder: 1,
        chemicalClass: 'Complexo Ácido Tamponado',
        activeIngredient: 'Redutor de pH 4.5',
        costPerUnit: 45.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p4-2',
        name: 'Acefato 750 SP (Pó Solúvel)',
        category: 'INSECTICIDE',
        dosePerHa: 0.80,
        doseUnit: 'kg/ha',
        mixOrder: 2,
        chemicalClass: 'Organofosforado (SP)',
        activeIngredient: 'Acefato 750 g/kg',
        costPerUnit: 72.0,
        packageUnitsEmpty: 3,
      },
      {
        id: 'prod-p4-3',
        name: 'Bifentrina 100 EC',
        category: 'INSECTICIDE',
        dosePerHa: 0.30,
        doseUnit: 'L/ha',
        mixOrder: 4,
        chemicalClass: 'Piretróide (EC)',
        activeIngredient: 'Bifentrina 100 g/L',
        costPerUnit: 95.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p4-4',
        name: 'Adjuvante Antideriva & Umectante',
        category: 'ADJUVANT',
        dosePerHa: 0.10,
        doseUnit: 'L/ha',
        mixOrder: 5,
        chemicalClass: 'Polímero vegetal sintetizado',
        activeIngredient: 'Antideriva e espalhante',
        costPerUnit: 65.0,
        packageUnitsEmpty: 1,
      }
    ]
  },
  {
    id: 'preset-nutricao-foliar',
    name: 'Nutrição Foliar & Micronutrientes (B+Zn)',
    crop: 'Multiculturas',
    targetPest: 'Enchimento de grãos & Pegamento floral',
    description: 'Suplementação foliar balanceada de alta absorção para fases reprodutivas.',
    recommendedSprayRateLHa: 8.0,
    products: [
      {
        id: 'prod-p5-1',
        name: 'Condicionador Antiespuma',
        category: 'ADJUVANT',
        dosePerHa: 0.04,
        doseUnit: 'L/ha',
        mixOrder: 1,
        chemicalClass: 'Quelante Orgânico',
        activeIngredient: 'Complexante mineral',
        costPerUnit: 35.0,
        packageUnitsEmpty: 1,
      },
      {
        id: 'prod-p5-2',
        name: 'Boro Complexado com Etanolamina (10% B)',
        category: 'FOLIAR_FERT',
        dosePerHa: 0.50,
        doseUnit: 'L/ha',
        mixOrder: 4,
        chemicalClass: 'Fertilizante Mineral Fluido',
        activeIngredient: 'Boro 150 g/L',
        costPerUnit: 42.0,
        packageUnitsEmpty: 2,
      },
      {
        id: 'prod-p5-3',
        name: 'Zinco Quelatado + Aminoácidos Livres',
        category: 'FOLIAR_FERT',
        dosePerHa: 0.80,
        doseUnit: 'L/ha',
        mixOrder: 4,
        chemicalClass: 'Organomineral Líquido',
        activeIngredient: 'Zn 100 g/L + Aminoácidos',
        costPerUnit: 58.0,
        packageUnitsEmpty: 3,
      },
      {
        id: 'prod-p5-4',
        name: 'Adjuvante Espalhante & Penetrante',
        category: 'ADJUVANT',
        dosePerHa: 0.05,
        doseUnit: 'L/ha',
        mixOrder: 5,
        chemicalClass: 'Tensoativo Siliconado',
        activeIngredient: 'Polímero siloxano',
        costPerUnit: 120.0,
        packageUnitsEmpty: 1,
      }
    ]
  }
];

const ORDER_MIX_DESCRIPTIONS: Record<number, { title: string; category: string; tip: string; color: string }> = {
  1: {
    title: '1º Ordem: Condicionadores & Redutores de pH',
    category: 'Reguladores de Água',
    tip: 'Adicione na água limpa (50% a 70% do tanque) para sequestrar cátions (Ca²⁺/Mg²⁺) e ajustar pH para 4.5 - 5.5 antes dos defensivos.',
    color: 'border-blue-500/50 bg-blue-500/10 text-blue-900 dark:text-blue-300'
  },
  2: {
    title: '2º Ordem: Formulações Sólidas (WP / WG / SP)',
    category: 'Pós e Grânulos Molháveis',
    tip: 'Sempre faça pré-mistura (pré-diluição) em balde antes de despejar no tanque principal com agitação máxima.',
    color: 'border-amber-500/50 bg-amber-500/10 text-amber-900 dark:text-amber-300'
  },
  3: {
    title: '3º Ordem: Suspensões Concentradas (SC / OD / CS)',
    category: 'Líquidos Suspensos',
    tip: 'Adicione lentamente com o agitador ligado. As partículas sólidas estão suspensas em meio aquoso ou oleoso.',
    color: 'border-cyan-500/50 bg-cyan-500/10 text-cyan-900 dark:text-cyan-300'
  },
  4: {
    title: '4º Ordem: Concentrados Emulsionáveis (EC / SL / EW)',
    category: 'Líquidos Emulsionáveis',
    tip: 'Formam emulsão leitosa instantânea. Mantenha agitação constante para evitar quebra de fase.',
    color: 'border-purple-500/50 bg-purple-500/10 text-purple-900 dark:text-purple-300'
  },
  5: {
    title: '5º Ordem: Adjuvantes, Óleos & Espalhantes',
    category: 'Adjuvantes & Óleos',
    tip: 'Colocados sempre por ÚLTIMO na calda. Adicionar antes pode causar floculação precoce ou excesso de espuma.',
    color: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-900 dark:text-emerald-300'
  }
};

export const SprayMixView: React.FC<SprayMixViewProps> = ({ 
  currentUser,
  plots = [],
  orders = [],
  drones = [],
  theme,
  onNavigate
}) => {
  // Operational state
  const [totalHectares, setTotalHectares] = useState<number>(48.5);
  const [sprayRateLHa, setSprayRateLHa] = useState<number>(10.0);
  const [tankCapacityL, setTankCapacityL] = useState<number>(40.0);
  const [mixerCapacityL, setMixerCapacityL] = useState<number>(150.0);
  const [checkedJarProducts, setCheckedJarProducts] = useState<Record<string, boolean>>({});
  const [selectedDroneName, setSelectedDroneName] = useState<string>('DJI Agras T40');
  const [selectedPlotId, setSelectedPlotId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [activePresetId, setActivePresetId] = useState<string>('preset-soja-fungicida');

  // pH Monitoring State
  const [waterPhInitial, setWaterPhInitial] = useState<number>(7.0);
  const [mixPhFinal, setMixPhFinal] = useState<number>(5.5);

  // 1. Data Isolation & RBAC: Precision Filtering for Current User (Pilots/Assistants/Clients)
  const userScopedOrders = useMemo(() => {
    return filterOrdersForUser(orders, currentUser, undefined, undefined);
  }, [orders, currentUser]);

  // Products in the current mix
  const [products, setProducts] = useState<SprayProduct[]>(() => {
    const saved = localStorage.getItem('agrodrone_current_spray_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Falha ao ler produtos de calda:', e);
      }
    }
    return DEFAULT_PRESET_RECIPES[1].products;
  });

  // Calculate Optimal pH Range based on products
  const optimalPhRange = useMemo(() => {
    let minPh = 0;
    let maxPh = 14;
    let hasPhData = false;

    products.forEach(prod => {
      const match = CHEMICAL_LEAFLETS_DATABASE.find(l => 
        l.commercialName.toLowerCase() === prod.name.toLowerCase() ||
        prod.name.toLowerCase().includes(l.commercialName.toLowerCase()) ||
        l.commercialName.toLowerCase().includes(prod.name.toLowerCase()) ||
        (prod.activeIngredient && l.activeIngredient.toLowerCase().includes(prod.activeIngredient.toLowerCase()))
      );

      if (match && match.phWaterOptimalRange) {
        if (match.phWaterOptimalRange.min > minPh) minPh = match.phWaterOptimalRange.min;
        if (match.phWaterOptimalRange.max < maxPh) maxPh = match.phWaterOptimalRange.max;
        hasPhData = true;
      }
    });

    if (!hasPhData) {
      return { min: 5.0, max: 6.0 }; // Default safe range
    }

    // If there's an impossible constraint, loosen it up slightly for the sake of the warning
    if (minPh > maxPh) {
      return { min: maxPh, max: minPh }; 
    }

    return { min: minPh, max: maxPh };
  }, [products]);

  // Save to localStorage when products change
  useEffect(() => {
    try {
      localStorage.setItem('agrodrone_current_spray_products', JSON.stringify(products));
    } catch (e) {
      console.warn('Falha ao salvar produtos:', e);
    }
  }, [products]);

  // Modal for Product Add/Edit
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formProduct, setFormProduct] = useState<Partial<SprayProduct>>({
    name: '',
    category: 'FUNGICIDE',
    dosePerHa: 0.5,
    doseUnit: 'L/ha',
    mixOrder: 3,
    chemicalClass: '',
    activeIngredient: '',
    targetPest: '',
    costPerUnit: 0,
    packageUnitsEmpty: 1,
  });

  // Save Custom Preset Modal
  const [isSavePresetModalOpen, setIsSavePresetModalOpen] = useState<boolean>(false);
  const [customPresetName, setCustomPresetName] = useState<string>('');
  const [customPresets, setCustomPresets] = useState<SprayRecipePreset[]>(() => {
    const saved = localStorage.getItem('agrodrone_custom_spray_presets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.warn('Falha ao carregar presets customizados:', e);
      }
    }
    return [];
  });

  // Checklist states
  const [checkedPPE, setCheckedPPE] = useState<Record<string, boolean>>({
    'mascara': true,
    'luvas': true,
    'avental': true,
    'oculos': true,
    'botas': true,
  });
  const [tripleRinseDone, setTripleRinseDone] = useState<boolean>(true);
  const [mixApproved, setMixApproved] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [activeStepTab, setActiveStepTab] = useState<'calculator' | 'leaflets' | 'steps' | 'jartest'>('calculator');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  
  // Chemical Leaflet state & synchronization
  const [selectedLeafletForModal, setSelectedLeafletForModal] = useState<ChemicalLeaflet | null>(null);
  const [isLeafletModalOpen, setIsLeafletModalOpen] = useState<boolean>(false);
  const [syncToastMessage, setSyncToastMessage] = useState<string | null>(null);
  const [selectedLeafletToImport, setSelectedLeafletToImport] = useState<string>('');

  // Helper to convert product dosage to equivalent liquid Liters per hectare
  const getProductLitersPerHa = (p: SprayProduct): number => {
    const unit = p.doseUnit?.toLowerCase() || 'l/ha';
    if (unit.startsWith('l/')) return p.dosePerHa;
    if (unit.startsWith('ml/')) return p.dosePerHa / 1000;
    if (unit.startsWith('kg/')) return p.dosePerHa * 0.9; // Solid displacement ~0.9 L/kg
    if (unit.startsWith('g/')) return (p.dosePerHa / 1000) * 0.9;
    return p.dosePerHa;
  };

  // Math & Operations Calculations
  const totalGrossSprayVolume = useMemo(() => {
    return totalHectares * sprayRateLHa;
  }, [totalHectares, sprayRateLHa]);

  // Total chemicals volume in Liters/ha
  const totalChemicalsVolumePerHa = useMemo(() => {
    return products.reduce((acc, p) => acc + getProductLitersPerHa(p), 0);
  }, [products]);

  // Helper for Jar Test (1 Liter proportional dosing)
  const getJarTestProportionalDose = (dosePerHa: number, doseUnit: string, sprayRateLHa: number): { value: number; unit: string } => {
    if (sprayRateLHa <= 0) return { value: 0, unit: '' };
    const rawRatio = dosePerHa / sprayRateLHa; // amount per Liter of carrier water
    const cleanUnit = doseUnit.toLowerCase();
    
    if (cleanUnit.startsWith('l')) {
      // L/ha -> mL for 1L jar
      return { value: rawRatio * 1000, unit: 'mL' };
    } else if (cleanUnit.startsWith('ml')) {
      // mL/ha -> mL for 1L jar
      return { value: rawRatio, unit: 'mL' };
    } else if (cleanUnit.startsWith('kg')) {
      // kg/ha -> g for 1L jar
      return { value: rawRatio * 1000, unit: 'g' };
    } else if (cleanUnit.startsWith('g')) {
      // g/ha -> g for 1L jar
      return { value: rawRatio, unit: 'g' };
    }
    return { value: rawRatio, unit: doseUnit.split('/')[0] };
  };

  const jarTestWarnings = useMemo(() => {
    const warnings: string[] = [];
    const names = products.map(p => p.name.toLowerCase());
    const categories = products.map(p => p.category);

    const hasGlyphosate = names.some(n => n.includes('glifo') || n.includes('glypho'));
    const hasManganese = names.some(n => n.includes('mangan') || n.includes(' mn') || n.startsWith('mn'));
    const hasCalcium = names.some(n => n.includes('calc') || n.includes(' ca ') || n.startsWith('ca '));
    const hasPhosphorus = names.some(n => n.includes('fosf') || n.includes(' p ') || n.startsWith('p '));
    const hasSulfur = names.some(n => n.includes('enxo') || n.includes(' s ') || n.startsWith('s '));
    const hasCopper = names.some(n => n.includes('cober') || n.includes('cobr') || n.includes('cu '));
    const hasBiological = categories.includes('BIOLOGICAL') || names.some(n => n.includes('biolog') || n.includes('bacillus') || n.includes('tricho'));
    const hasChemical = categories.some(c => ['HERBICIDE', 'FUNGICIDE', 'INSECTICIDE'].includes(c));

    if (hasGlyphosate && hasManganese) {
      warnings.push("⚠️ Risco de Quelação: O Glifosato e o Manganês na mesma calda causam quelação mútua, reduzindo a eficácia do herbicida em até 40%. Adicione condicionador de água antes do glifosato ou aplique separadamente.");
    }
    if (hasCalcium && (hasPhosphorus || hasSulfur)) {
      warnings.push("⚠️ Reação de Precipitação Crítica: A mistura de Cálcio (Ca) com Fósforo (P) ou Enxofre (S) forma precipitados insolúveis (gesso/fosfato de cálcio), causando entupimento instantâneo dos bicos do drone. Não misturar na mesma calda.");
    }
    if (hasCopper && hasBiological) {
      warnings.push("⚠️ Incompatibilidade Biológica: Produtos cúpricos (Cobre) possuem ação bactericida/fungicida forte e podem inativar ou reduzir drasticamente a viabilidade de biológicos (Bacillus, Trichoderma) na mesma calda.");
    }
    if (hasBiological && hasChemical) {
      warnings.push("ℹ️ Alerta de Viabilidade Biológica: Mistura de defensivos químicos e biológicos exige cuidados especiais. Certifique-se de aplicar a calda imediatamente após o preparo para evitar a mortalidade dos micro-organismos.");
    }

    // Default general advice if no specific warnings triggered
    if (warnings.length === 0) {
      if (products.length > 3) {
        warnings.push(`💡 Mistura Complexa Detectada: Você possui ${products.length} produtos no receituário. Caldas com mais de 3 produtos possuem altíssimo risco de incompatibilidade física e química. O Teste de Jarro é estritamente obrigatório.`);
      } else if (products.length > 0) {
        warnings.push("🌱 Ordem de Adição Segura: Os produtos adicionados respeitam a sequência regulamentar (WALES). O teste de jarro validará se a água da sua região não causa precipitações indesejadas com estes produtos.");
      } else {
        warnings.push("📝 Adicione produtos no Receituário para que o sistema analise potenciais incompatibilidades químicas automaticamente!");
      }
    }

    return warnings;
  }, [products]);

  const isWalesCompliant = useMemo(() => {
    for (let i = 0; i < products.length - 1; i++) {
      if (products[i].mixOrder > products[i + 1].mixOrder) {
        return false;
      }
    }
    return true;
  }, [products]);

  const handleSortProductsByWales = () => {
    const sorted = [...products].sort((a, b) => a.mixOrder - b.mixOrder);
    setProducts(sorted);
  };

  // Pure Water per Hectare
  const pureWaterPerHa = useMemo(() => {
    return Math.max(0, sprayRateLHa - totalChemicalsVolumePerHa);
  }, [sprayRateLHa, totalChemicalsVolumePerHa]);

  // Total chemicals volume for whole area (L)
  const totalChemicalsVolumeL = useMemo(() => {
    return totalChemicalsVolumePerHa * totalHectares;
  }, [totalChemicalsVolumePerHa, totalHectares]);

  // Pure Water needed for whole area (L)
  const totalPureWaterNeededL = useMemo(() => {
    return Math.max(0, totalGrossSprayVolume - totalChemicalsVolumeL);
  }, [totalGrossSprayVolume, totalChemicalsVolumeL]);

  const hectaresPerTank = useMemo(() => {
    if (sprayRateLHa <= 0) return 0;
    return tankCapacityL / sprayRateLHa;
  }, [tankCapacityL, sprayRateLHa]);

  // Chemicals & Water per Full Tank
  const chemicalsVolumePerFullTankL = useMemo(() => {
    return totalChemicalsVolumePerHa * hectaresPerTank;
  }, [totalChemicalsVolumePerHa, hectaresPerTank]);

  const pureWaterPerFullTankL = useMemo(() => {
    return Math.max(0, tankCapacityL - chemicalsVolumePerFullTankL);
  }, [tankCapacityL, chemicalsVolumePerFullTankL]);

  // --- TANQUE MISTURADOR CALCULATIONS (Large Mixing Tank conditions) ---
  const hectaresPerMixer = useMemo(() => {
    if (sprayRateLHa <= 0) return 0;
    return mixerCapacityL / sprayRateLHa;
  }, [mixerCapacityL, sprayRateLHa]);

  const mixerTanksExact = useMemo(() => {
    if (mixerCapacityL <= 0) return 0;
    return totalGrossSprayVolume / mixerCapacityL;
  }, [totalGrossSprayVolume, mixerCapacityL]);

  const fullMixerTanksCount = Math.floor(mixerTanksExact);
  const lastMixerTankVolume = totalGrossSprayVolume - (fullMixerTanksCount * mixerCapacityL);
  const hasPartialLastMixerTank = lastMixerTankVolume > 0.05;
  const totalMixerBatchesCount = Math.ceil(mixerTanksExact);

  const chemicalsVolumePerFullMixerL = useMemo(() => {
    return totalChemicalsVolumePerHa * hectaresPerMixer;
  }, [totalChemicalsVolumePerHa, hectaresPerMixer]);

  const pureWaterPerFullMixerL = useMemo(() => {
    return Math.max(0, mixerCapacityL - chemicalsVolumePerFullMixerL);
  }, [mixerCapacityL, chemicalsVolumePerFullMixerL]);

  // Partial Last Mixer Water & Chemicals
  const lastMixerHectares = sprayRateLHa > 0 ? (lastMixerTankVolume / sprayRateLHa) : 0;
  const chemicalsVolumeLastMixerL = totalChemicalsVolumePerHa * lastMixerHectares;
  const pureWaterLastMixerL = hasPartialLastMixerTank ? Math.max(0, lastMixerTankVolume - chemicalsVolumeLastMixerL) : 0;

  // Water Preload (60%) and Top-up (Q.S.P.) for single full Mixer Tank
  const pureWaterPreloadFullMixerL = mixerCapacityL * 0.60;
  const pureWaterTopUpFullMixerL = Math.max(0, pureWaterPerFullMixerL - pureWaterPreloadFullMixerL);
  // ---------------------------------------------------------------------

  // Water Preload (60%) and Top-up (Q.S.P.)
  // For single full tank (for flight telemetry reference)
  const pureWaterPreloadFullTankL = tankCapacityL * 0.60;
  const pureWaterTopUpFullTankL = Math.max(0, pureWaterPerFullTankL - pureWaterPreloadFullTankL);

  // For TOTAL spray mix preparation (whole batch / area)
  const totalPureWaterPreloadL = totalGrossSprayVolume * 0.60;
  const totalPureWaterTopUpL = Math.max(0, totalPureWaterNeededL - totalPureWaterPreloadL);

  const numberOfTanksExact = useMemo(() => {
    if (tankCapacityL <= 0) return 0;
    return totalGrossSprayVolume / tankCapacityL;
  }, [totalGrossSprayVolume, tankCapacityL]);

  const fullTanksCount = Math.floor(numberOfTanksExact);
  const lastTankVolume = totalGrossSprayVolume - (fullTanksCount * tankCapacityL);
  const hasPartialLastTank = lastTankVolume > 0.05;
  const totalFlightsCount = Math.ceil(numberOfTanksExact);

  // Partial Last Flight Water & Chemicals
  const lastFlightHectares = sprayRateLHa > 0 ? (lastTankVolume / sprayRateLHa) : 0;
  const chemicalsVolumeLastTankL = totalChemicalsVolumePerHa * lastFlightHectares;
  const pureWaterLastTankL = hasPartialLastTank ? Math.max(0, lastTankVolume - chemicalsVolumeLastTankL) : 0;
  const pureWaterPreloadLastTankL = lastTankVolume * 0.60;
  const pureWaterTopUpLastTankL = Math.max(0, pureWaterLastTankL - pureWaterPreloadLastTankL);

  // Water Percentage
  const waterPercentage = totalGrossSprayVolume > 0 ? (totalPureWaterNeededL / totalGrossSprayVolume) * 100 : 0;
  const chemicalsPercentage = Math.max(0, 100 - waterPercentage);

  // Time and Financial estimates
  const estimatedFlightMinutesPerTank = 12; // ~12 minutes per load
  const totalEstimatedTimeHours = (totalFlightsCount * estimatedFlightMinutesPerTank) / 60;

  // Cost calculation
  const totalChemicalCost = useMemo(() => {
    return products.reduce((acc, p) => {
      const totalAmount = p.dosePerHa * totalHectares;
      const unitCost = p.costPerUnit || 0;
      return acc + (totalAmount * unitCost);
    }, 0);
  }, [products, totalHectares]);

  const costPerHectare = totalHectares > 0 ? (totalChemicalCost / totalHectares) : 0;

  // Total empty containers
  const totalEmptyContainersCount = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.packageUnitsEmpty || 1), 0);
  }, [products]);

  // Handle Load Preset
  const handleLoadPreset = (preset: SprayRecipePreset) => {
    setActivePresetId(preset.id);
    setProducts(preset.products);
    if (preset.recommendedSprayRateLHa) {
      setSprayRateLHa(preset.recommendedSprayRateLHa);
    }
  };

  // Handle Select Plot
  const handleSelectPlot = (plotId: string) => {
    setSelectedPlotId(plotId);
    const foundPlot = plots.find(p => p.id === plotId);
    if (foundPlot) {
      setTotalHectares(foundPlot.hectares);
    }
  };

  // Handle Select OS
  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    const foundOrder = userScopedOrders.find(o => o.id === orderId);
    if (foundOrder) {
      setTotalHectares(foundOrder.targetHectares);
      if (foundOrder.sprayRateLHa) {
        setSprayRateLHa(foundOrder.sprayRateLHa);
      }
    }
  };

  // Handle Drone Select
  const handleSelectDrone = (droneModel: string, capacity: number) => {
    setSelectedDroneName(droneModel);
    setTankCapacityL(capacity);
  };

  // PPE toggle
  const togglePPE = (key: string) => {
    setCheckedPPE(prev => ({ ...prev, [key]: !prev[key] }));
  };
  const allPPEChecked = Object.values(checkedPPE).every(Boolean);

  // Chemical Leaflet Integration & Synchronization Handlers
  const handleOpenLeafletForProduct = (prod: SprayProduct) => {
    // Look up in database by name or active ingredient
    const match = CHEMICAL_LEAFLETS_DATABASE.find(l => 
      l.commercialName.toLowerCase() === prod.name.toLowerCase() ||
      prod.name.toLowerCase().includes(l.commercialName.toLowerCase()) ||
      l.commercialName.toLowerCase().includes(prod.name.toLowerCase()) ||
      (prod.activeIngredient && l.activeIngredient.toLowerCase().includes(prod.activeIngredient.toLowerCase()))
    );

    if (match) {
      setSelectedLeafletForModal(match);
    } else {
      // Dynamic fallback leaflet if product was custom created
      const fallback: ChemicalLeaflet = {
        id: `dynamic-${prod.id}`,
        commercialName: prod.name,
        activeIngredient: prod.activeIngredient || 'Componente Químico Concentrado',
        activeIngredientConcentration: prod.activeIngredient || `${prod.name} (${prod.dosePerHa} ${prod.doseUnit})`,
        chemicalGroup: prod.chemicalClass || 'Defensivo Agrícola',
        formulationType: prod.mixOrder === 2 ? 'WG' : prod.mixOrder === 3 ? 'SC' : prod.mixOrder === 4 ? 'EC' : prod.mixOrder === 1 ? 'LÍQUIDO' : 'LÍQUIDO',
        walesMixOrder: prod.mixOrder,
        walesStageName: ORDER_MIX_DESCRIPTIONS[prod.mixOrder]?.title || 'Etapa de Mistura',
        category: prod.category as any,
        mapaRegistration: 'Registro MAPA em Homologação',
        manufacturer: 'Fabricante Homologado',
        toxicologicalClass: 'CAT_4_POUCO',
        toxicologicalColorHex: '#3b82f6',
        toxicologicalLabel: 'Faixa Azul (Produto Regulamentado)',
        environmentalHazardClass: 'CLASSE_III_PERIGOSO',
        targetCrops: ['Soja', 'Milho', 'Algodão', 'Cana-de-açúcar', 'Café'],
        targets: [
          {
            pestName: prod.targetPest || 'Alvo Específico da Lavoura',
            scientificName: 'Manejo Fitossanitário Integrado',
            targetCategory: 'PRAGA',
            doseDrone: `${prod.dosePerHa} ${prod.doseUnit}`,
            doseHaMin: prod.dosePerHa * 0.9,
            doseHaMax: prod.dosePerHa * 1.1,
            doseUnit: prod.doseUnit,
            applicationTiming: 'Conforme recomendação do Engenheiro Agrônomo / Receituário Agronômico.',
          }
        ],
        droneGuidelines: {
          minVolumeLHa: 8.0,
          maxVolumeLHa: 15.0,
          recommendedVMD_microns: '180 - 250 µm (Gotas Médias)',
          dropletSpectrum: 'MEDIA',
          nozzleRecommendation: 'Atomizadores centrífugos rotativos ou bicos leque anti-deriva.',
          flightAltitudeM: '2.5 - 3.5 m',
          speedMs: '6.0 m/s',
          swathWidthM: '6.5 m',
        },
        phWaterOptimalRange: {
          min: 5.0,
          max: 6.5,
          note: 'Manter pH da calda entre 5.0 e 6.5 para máxima estabilidade e absorção foliar.',
        },
        reentryIntervalHours: 24,
        safetyPreHarvestIntervalDays: {
          Soja: 14,
          Milho: 28,
        },
        compatibilityNotes: ['Compatível com calda padrão em agitação contínua.'],
        incompatibilityWarnings: ['Não aplicar em condições de Delta T acima de 8.0 °C ou vento superior a 15 km/h.'],
        mandatoryPPE: ['Macacão hidrorrepelente', 'Luvas de nitrila', 'Máscara P2', 'Óculos de proteção'],
        firstAidGuidelines: 'Em caso de contato lavar abundantemente com água.',
        emptyContainerDisposal: 'Efetuar tríplice lavagem e devolução InpEV.',
        walesStepDescription: ORDER_MIX_DESCRIPTIONS[prod.mixOrder]?.tip || 'Adicionar sob agitação contínua.',
        defaultDosePerHa: prod.dosePerHa,
        defaultDoseUnit: prod.doseUnit,
        averageCostPerUnit: prod.costPerUnit || 50.0,
        highlightBadges: ['Produto Cadastrado na Calda', 'Ordem WALES Validada'],
      };
      setSelectedLeafletForModal(fallback);
    }
    setIsLeafletModalOpen(true);
  };

  const handleSynchronizeLeafletToMix = (leaflet: ChemicalLeaflet) => {
    // Check if product with this name exists in current mix
    const existingIndex = products.findIndex(p => 
      p.name.toLowerCase() === leaflet.commercialName.toLowerCase() ||
      leaflet.commercialName.toLowerCase().includes(p.name.toLowerCase()) ||
      p.name.toLowerCase().includes(leaflet.commercialName.toLowerCase())
    );

    const newProd: SprayProduct = {
      id: `prod-bula-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: leaflet.commercialName,
      category: leaflet.category as any,
      dosePerHa: leaflet.defaultDosePerHa,
      doseUnit: leaflet.defaultDoseUnit,
      mixOrder: leaflet.walesMixOrder,
      chemicalClass: `${leaflet.chemicalGroup} (${leaflet.formulationType})`,
      activeIngredient: leaflet.activeIngredientConcentration,
      targetPest: leaflet.targets[0]?.pestName || '',
      costPerUnit: leaflet.averageCostPerUnit,
      packageUnitsEmpty: 2,
    };

    if (existingIndex >= 0) {
      // Update existing item
      const updated = [...products];
      updated[existingIndex] = { ...updated[existingIndex], ...newProd, id: updated[existingIndex].id };
      setProducts(updated);
      setSyncToastMessage(`🔄 "${leaflet.commercialName}" atualizado com dados oficiais da bula!`);
    } else {
      // Add new item in correct mix order
      const updated = [...products, newProd].sort((a, b) => a.mixOrder - b.mixOrder);
      setProducts(updated);
      setSyncToastMessage(`✅ "${leaflet.commercialName}" sincronizado e inserido na calda (WALES #${leaflet.walesMixOrder})!`);
    }

    setTimeout(() => setSyncToastMessage(null), 4000);
  };

  const handleImportLeafletIntoForm = (leafletId: string) => {
    if (!leafletId) return;
    const found = CHEMICAL_LEAFLETS_DATABASE.find(l => l.id === leafletId);
    if (!found) return;

    setFormProduct({
      name: found.commercialName,
      category: found.category as any,
      dosePerHa: found.defaultDosePerHa,
      doseUnit: found.defaultDoseUnit,
      mixOrder: found.walesMixOrder,
      chemicalClass: `${found.chemicalGroup} (${found.formulationType})`,
      activeIngredient: found.activeIngredientConcentration,
      targetPest: found.targets[0]?.pestName || '',
      costPerUnit: found.averageCostPerUnit,
      packageUnitsEmpty: 2,
    });
    setSelectedLeafletToImport(leafletId);
  };

  // Product CRUD Handlers
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setSelectedLeafletToImport('');
    setFormProduct({
      name: '',
      category: 'FUNGICIDE',
      dosePerHa: 0.5,
      doseUnit: 'L/ha',
      mixOrder: 3,
      chemicalClass: '',
      activeIngredient: '',
      targetPest: '',
      costPerUnit: 0,
      packageUnitsEmpty: 1,
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: SprayProduct) => {
    setEditingProductId(prod.id);
    setFormProduct({ ...prod });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProduct.name || !formProduct.dosePerHa) return;

    if (editingProductId) {
      // Update existing
      setProducts(prev => prev.map(p => {
        if (p.id === editingProductId) {
          return {
            ...p,
            name: formProduct.name || 'Produto',
            category: formProduct.category || 'FUNGICIDE',
            dosePerHa: Number(formProduct.dosePerHa) || 0.1,
            doseUnit: formProduct.doseUnit || 'L/ha',
            mixOrder: Number(formProduct.mixOrder) || 3,
            chemicalClass: formProduct.chemicalClass || '',
            activeIngredient: formProduct.activeIngredient || '',
            targetPest: formProduct.targetPest || '',
            costPerUnit: Number(formProduct.costPerUnit) || 0,
            packageUnitsEmpty: Number(formProduct.packageUnitsEmpty) || 1,
          };
        }
        return p;
      }));
    } else {
      // Add new
      const newProduct: SprayProduct = {
        id: `prod-custom-${Date.now()}`,
        name: formProduct.name || 'Novo Produto',
        category: formProduct.category || 'FUNGICIDE',
        dosePerHa: Number(formProduct.dosePerHa) || 0.1,
        doseUnit: formProduct.doseUnit || 'L/ha',
        mixOrder: Number(formProduct.mixOrder) || 3,
        chemicalClass: formProduct.chemicalClass || 'Classe Geral',
        activeIngredient: formProduct.activeIngredient || '',
        targetPest: formProduct.targetPest || '',
        costPerUnit: Number(formProduct.costPerUnit) || 0,
        packageUnitsEmpty: Number(formProduct.packageUnitsEmpty) || 1,
      };
      setProducts(prev => [...prev, newProduct]);
    }
    setIsProductModalOpen(false);
  };

  const handleDeleteProduct = (id: string) => {
    const targetProd = products.find(p => p.id === id);
    const prodName = targetProd ? targetProd.commercialName : 'este produto';
    showConfirm({
      title: 'Remover Insumo da Calda',
      message: `Tem certeza que deseja remover o produto "${prodName}" da calda de pulverização?`,
      confirmLabel: 'Sim, Remover',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setProducts(prev => prev.filter(p => p.id !== id));
        showToast(`Produto "${prodName}" removido da calda com sucesso.`, 'info');
      },
    });
  };

  const handleMoveProductOrder = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= products.length) return;
    const newArr = [...products];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setProducts(newArr);
  };

  // Save Custom Preset
  const handleSaveCurrentAsPreset = () => {
    if (!customPresetName.trim()) return;
    const newPreset: SprayRecipePreset = {
      id: `custom-preset-${Date.now()}`,
      name: customPresetName.trim(),
      crop: 'Personalizada',
      targetPest: 'Prescrição customizada',
      description: `Preset salvo pelo usuário em ${new Date().toLocaleDateString('pt-BR')}`,
      recommendedSprayRateLHa: sprayRateLHa,
      products: [...products],
    };

    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    try {
      localStorage.setItem('agrodrone_custom_spray_presets', JSON.stringify(updated));
    } catch (e) {
      console.warn('Falha ao salvar preset:', e);
    }
    setCustomPresetName('');
    setIsSavePresetModalOpen(false);
  };

  // Copy Recipe Summary for WhatsApp
  const handleCopyRecipeToWhatsApp = () => {
    let text = `🌱 *FICHA OPERACIONAL DE PREPARO DE CALDA (AGROSYS & MISTURADOR)*\n`;
    text += `📍 *Área Total:* ${totalHectares.toFixed(1).replace('.', ',')} ha | *Taxa de Aplicação:* ${String(sprayRateLHa).replace('.', ',')} L/ha\n`;
    text += `🛢️ *Tanque Misturador:* ${mixerCapacityL} L | 🚁 *Drone:* ${selectedDroneName} (${tankCapacityL}L)\n`;
    text += `💧 *Volume Total de Calda:* ${totalGrossSprayVolume.toFixed(1).replace('.', ',')} Litros\n`;
    text += `📦 *Bateladas Misturador:* ${totalMixerBatchesCount} misturas (${fullMixerTanksCount} batidas cheias de ${mixerCapacityL}L${hasPartialLastMixerTank ? ` + 1 fracionada de ${lastMixerTankVolume.toFixed(1).replace('.', ',')}L` : ''})\n`;
    text += `✈️ *Plano de Voos:* ${totalFlightsCount} voos de ${tankCapacityL} L\n`;
    
    text += `\n💧 *PREPARO POR BATIDA DO MISTURADOR (${mixerCapacityL}L Cheio):*\n`;
    text += `• *1. Fundo Inicial (60%):* Colocar ${pureWaterPreloadFullMixerL.toFixed(1).replace('.', ',')} L de água limpa sob agitação\n`;
    text += `• *2. Insumos Químicos:* Adicionar os produtos na ordem indicada (#1 ao #${products.length}) totalizando ${chemicalsVolumePerFullMixerL.toFixed(1).replace('.', ',')} L\n`;
    text += `• *3. Complementação Q.S.P.:* Completar com ${pureWaterTopUpFullMixerL.toFixed(1).replace('.', ',')} L de água limpa até completar ${mixerCapacityL} L\n`;
    text += `• *Água Limpa Total Área:* ${totalPureWaterNeededL.toFixed(1).replace('.', ',')} L (${waterPercentage.toFixed(1).replace('.', ',')}% da calda) | *Insumos Total Área:* ${totalChemicalsVolumeL.toFixed(1).replace('.', ',')} L (${chemicalsPercentage.toFixed(1).replace('.', ',')}%)\n`;

    text += `\n🧪 *SEQUÊNCIA DE MISTURA & DOSES (${products.length} PRODUTOS + ÁGUA):*\n`;
    text += `• *[#0]* 💧 *Água Limpa (Veículo Carreador)*\n   - Dose/ha: ${pureWaterPerHa.toFixed(2).replace('.', ',')} L/ha\n   - Por Batida Cheia (${mixerCapacityL}L): ${pureWaterPerFullMixerL.toFixed(1).replace('.', ',')} L\n   - Total Área: ${totalPureWaterNeededL.toFixed(1).replace('.', ',')} L\n`;

    products.forEach((p, idx) => {
      const totalAmount = p.dosePerHa * totalHectares;
      const perMixer = p.dosePerHa * hectaresPerMixer;
      const orderInfo = ORDER_MIX_DESCRIPTIONS[p.mixOrder] || ORDER_MIX_DESCRIPTIONS[3];
      text += `• *[#${idx + 1}]* ${p.name} (WALES Etapa #${p.mixOrder} - ${orderInfo.title})\n   - Dose/ha: ${String(p.dosePerHa).replace('.', ',')} ${p.doseUnit}\n   - Por Batida Cheia (${mixerCapacityL}L): ${perMixer.toFixed(2).replace('.', ',')} ${p.doseUnit.split('/')[0]}\n   - Total Área: ${totalAmount.toFixed(2).replace('.', ',')} ${p.doseUnit.split('/')[0]}\n`;
    });

    text += `\n⚠️ *NR-31:* Uso obrigatório de EPIs completos e tríplice lavagem das ${totalEmptyContainersCount} embalagens vazias.`;

    navigator.clipboard.writeText(text);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 3500);
  };

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Top Header Card */}
      <div className="bg-gradient-to-br from-white via-emerald-50/50 to-emerald-100/30 dark:from-[#072a1e] dark:via-[#093325] dark:to-[#041c14] border border-emerald-200/80 dark:border-emerald-800 rounded-2xl p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white shadow-2xs flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                Cálculo & Gestão de Calda
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                NR-31 • Método WALES
              </span>
              {mixApproved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-white flex items-center gap-1 shadow-2xs">
                  <CheckCircle2 className="w-3 h-3" />
                  Calda Pronta
                </span>
              )}
            </div>
            <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
              <span>Engenharia de Calda & Mistura</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80 max-w-3xl">
              Dimensionamento de volume de água, doses fracionadas por voo, sequência estrita anti-incompatibilidade.
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={handleCopyRecipeToWhatsApp}
              className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-white dark:bg-[#041c14] text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/60 border border-emerald-300/80 dark:border-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Copiar texto pronto da calda para WhatsApp"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-300 text-xs">Copiada!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg font-bold text-xs bg-white dark:bg-emerald-950 text-emerald-950 dark:text-emerald-100 hover:bg-emerald-50 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-700 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Visualizar e Imprimir Ficha de Calda"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Imprimir</span>
            </button>

            {mixApproved ? (
              <button
                onClick={() => setMixApproved(false)}
                className="px-3 py-1.5 rounded-lg font-bold text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 shadow-2xs flex items-center gap-1.5 cursor-pointer hover:bg-emerald-200/80"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Aprovada (Desfazer)</span>
              </button>
            ) : (
              <button
                onClick={() => setMixApproved(true)}
                disabled={!allPPEChecked || !tripleRinseDone}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  allPPEChecked && tripleRinseDone
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95'
                    : 'bg-emerald-100/60 dark:bg-emerald-950/60 text-emerald-800/50 dark:text-emerald-400/50 cursor-not-allowed border border-emerald-200/60 dark:border-emerald-800/60'
                }`}
                title={!allPPEChecked || !tripleRinseDone ? 'Marque os EPIs e a tríplice lavagem antes de aprovar' : 'Aprovar preparo de calda'}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aprovar Calda</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preset Recipes Quick Selector Bar */}
      <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800 rounded-xl p-2.5 sm:p-3 shadow-2xs space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-black text-emerald-950 dark:text-white uppercase tracking-wider">
              Receituários & Presets
            </span>
          </div>
          <button
            onClick={() => setIsSavePresetModalOpen(true)}
            className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Save className="w-3 h-3" />
            Salvar Calda como Novo Preset
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {DEFAULT_PRESET_RECIPES.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                activePresetId === preset.id
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700 shadow-2xs'
              }`}
            >
              <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-mono font-bold">
                {preset.crop}
              </span>
              <span className="text-[11px]">{preset.name}</span>
            </button>
          ))}

          {customPresets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleLoadPreset(preset)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 cursor-pointer ${
                activePresetId === preset.id
                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                  : 'bg-purple-50 dark:bg-purple-950/40 text-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800 hover:bg-purple-100'
              }`}
            >
              <span className="text-[9px] px-1 py-0.2 rounded bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 font-mono">
                ★ Meu
              </span>
              <span className="text-[11px]">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sync Feedback Toast Notification */}
      {syncToastMessage && (
        <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md flex items-center justify-between gap-2 animate-fade-in border border-emerald-400 text-xs">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-200 animate-pulse" />
            <span>{syncToastMessage}</span>
          </div>
          <button
            onClick={() => setSyncToastMessage(null)}
            className="p-1 rounded-lg hover:bg-emerald-700 text-white/80 hover:text-white cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Tabs for View Navigation */}
      <div className="flex items-center gap-1 border-b border-emerald-200 dark:border-emerald-800 pb-1.5 overflow-x-auto scrollbar-thin">
        <button
          onClick={() => setActiveStepTab('calculator')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeStepTab === 'calculator'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>1. Calculadora</span>
        </button>

        <button
          onClick={() => setActiveStepTab('leaflets')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer relative ${
            activeStepTab === 'leaflets'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>2. Bulas MAPA</span>
          <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
            activeStepTab === 'leaflets' 
              ? 'bg-white text-emerald-950' 
              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
          }`}>
            {CHEMICAL_LEAFLETS_DATABASE.length}
          </span>
        </button>

        <button
          onClick={() => setActiveStepTab('steps')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeStepTab === 'steps'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>3. Ordem WALES</span>
        </button>

        <button
          onClick={() => setActiveStepTab('jartest')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
            activeStepTab === 'jartest'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'text-emerald-900 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-950/60'
          }`}
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span>4. Teste de Jarro</span>
        </button>
      </div>

      {/* TAB 1: MAIN CALCULATOR & PRODUCTS MANAGER */}
      {activeStepTab === 'calculator' && (
        <div className="space-y-3 sm:space-y-4">
          {/* CONSOLIDATED OPERATIONAL SUMMARY (CLEAN, MODERN, ZERO DUPLICATION) */}
          <div className="bg-gradient-to-br from-emerald-100 via-white to-teal-50 dark:from-emerald-950 dark:via-[#072c1e] dark:to-teal-950 text-emerald-950 dark:text-white rounded-2xl p-3.5 sm:p-4 shadow-md border border-emerald-300 dark:border-emerald-500/30 space-y-3 relative overflow-hidden transition-colors">
            {/* Subtle atmospheric glow */}
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

            {/* Top Row: Volume Total Highlight & Flight Context */}
            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 dark:bg-emerald-400 text-white dark:text-emerald-950 flex items-center gap-1.5 uppercase tracking-wider shadow-2xs">
                    <Scale className="w-3.5 h-3.5 fill-current" />
                    Volume Total da Calda Preparada
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-200/90">
                    {String(totalHectares).replace('.', ',')} ha @ {String(sprayRateLHa).replace('.', ',')} L/ha
                  </span>
                </div>
                <div className="flex items-baseline gap-2 pt-0.5">
                  <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-emerald-950 dark:text-white">
                    {totalGrossSprayVolume.toFixed(1).replace('.', ',')} <span className="text-lg font-bold text-emerald-600 dark:text-emerald-300">Litros</span>
                  </span>
                </div>
              </div>

              {/* Drone & Tank Specs */}
              <div className="flex items-center gap-3 bg-white/60 dark:bg-white/5 border border-emerald-200 dark:border-white/10 px-4 py-2.5 rounded-2xl backdrop-blur-sm self-start sm:self-auto transition-colors">
                <DronePhoto
                  modelName={selectedDroneName}
                  size="md"
                  rounded="rounded-xl"
                  className="border border-emerald-300 dark:border-white/20 shadow-xs"
                />
                <div>
                  <div className="text-xs font-bold text-emerald-900 dark:text-white">{selectedDroneName}</div>
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-mono">
                    Tanque: {tankCapacityL} L • {totalFlightsCount} voos ({hectaresPerTank.toFixed(2).replace('.', ',')} ha/voo)
                  </div>
                </div>
              </div>
            </div>

            {/* Proportional Balance Bar (Clean Water vs Chemicals) */}
            <div className="relative space-y-1.5 bg-emerald-50/80 dark:bg-black/20 p-3 rounded-2xl border border-emerald-200 dark:border-white/10 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs font-bold gap-1.5">
                <span className="text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 fill-current" />
                  Água Limpa: {totalPureWaterNeededL.toFixed(1).replace('.', ',')} L ({waterPercentage.toFixed(0).replace('.', ',')}%)
                </span>
                <span className="text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5" />
                  Insumos & Defensivos: {totalChemicalsVolumeL.toFixed(1).replace('.', ',')} L ({chemicalsPercentage.toFixed(0).replace('.', ',')}%)
                </span>
              </div>
              <div className="h-2.5 w-full bg-emerald-200/50 dark:bg-white/15 rounded-full overflow-hidden flex p-0.5 border border-emerald-300 dark:border-white/10">
                <div 
                  style={{ width: `${Math.max(5, waterPercentage)}%` }} 
                  className="h-full bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full transition-all"
                  title={`Água: ${totalPureWaterNeededL.toFixed(1).replace('.', ',')} L`}
                />
                <div 
                  style={{ width: `${Math.min(95, chemicalsPercentage)}%` }} 
                  className="h-full bg-amber-400 rounded-full transition-all ml-1"
                  title={`Insumos: ${totalChemicalsVolumeL.toFixed(1).replace('.', ',')} L`}
                />
              </div>
            </div>

            {/* 4 Essential Non-Redundant Operational Metric Cards */}
            <div className="relative grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Metric 1 */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-emerald-200 dark:border-white/10 shadow-2xs dark:shadow-none transition-colors">
                <span className="text-[10px] text-cyan-700 dark:text-cyan-200 font-bold uppercase tracking-wider block">💧 Água por Tanque</span>
                <div className="font-mono text-lg font-black text-emerald-950 dark:text-white mt-0.5">
                  {pureWaterPerFullTankL.toFixed(2).replace('.', ',')} <span className="text-xs text-cyan-600 dark:text-cyan-300">L</span>
                </div>
                <p className="text-[10px] text-cyan-800 dark:text-cyan-100/70 truncate mt-0.5">
                  Fundo: {pureWaterPreloadFullTankL.toFixed(1).replace('.', ',')}L • Top-up: {pureWaterTopUpFullTankL.toFixed(2).replace('.', ',')}L
                </p>
              </div>

              {/* Metric 2 */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-emerald-200 dark:border-white/10 shadow-2xs dark:shadow-none transition-colors">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-200 font-bold uppercase tracking-wider block">📐 Água / Hectare</span>
                <div className="font-mono text-lg font-black text-emerald-950 dark:text-white mt-0.5">
                  {pureWaterPerHa.toFixed(2).replace('.', ',')} <span className="text-xs text-emerald-600 dark:text-emerald-300">L/ha</span>
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-100/70 truncate mt-0.5">
                  Carreador puro @ taxa {String(sprayRateLHa).replace('.', ',')} L/ha
                </p>
              </div>

              {/* Metric 3 */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-emerald-200 dark:border-white/10 shadow-2xs dark:shadow-none transition-colors">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-200 font-bold uppercase tracking-wider block">🚁 Operação de Voo</span>
                <div className="font-mono text-lg font-black text-emerald-950 dark:text-white mt-0.5">
                  {totalFlightsCount} <span className="text-xs text-emerald-600 dark:text-emerald-300">voos</span>
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-100/70 truncate mt-0.5">
                  {fullTanksCount} cheios{hasPartialLastTank ? ` + 1 final (${lastTankVolume.toFixed(1).replace('.', ',')}L)` : ''}
                </p>
              </div>

              {/* Metric 4 */}
              <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm p-3 rounded-2xl border border-emerald-200 dark:border-white/10 shadow-2xs dark:shadow-none transition-colors">
                <span className="text-[10px] text-emerald-700 dark:text-emerald-200 font-bold uppercase tracking-wider block">💰 Custo dos Insumos</span>
                <div className="font-mono text-lg font-black text-emerald-950 dark:text-white mt-0.5">
                  {formatBRL(totalChemicalCost)}
                </div>
                <p className="text-[10px] text-emerald-800 dark:text-emerald-100/70 truncate mt-0.5">
                  {formatBRL(costPerHectare)} / hectare
                </p>
              </div>
            </div>
          </div>

          {/* 2 Columns: Left Input Controls / Right Products Manager */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
            
            {/* LEFT COLUMN: Input Configuration (5 Cols) */}
            <div className="lg:col-span-5 space-y-3 sm:space-y-4">
              <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                <h3 className="text-sm font-black text-emerald-950 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Parâmetros da Área & Aeronave
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    Ajuste Dinâmico
                  </span>
                </h3>

                {/* Quick Plot & OS Importer */}
                <div className="space-y-3 pt-1 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      Carregar de Talhão GIS ou OS:
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <select
                      value={selectedPlotId}
                      onChange={(e) => handleSelectPlot(e.target.value)}
                      className="bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      <option value="">🗺️ Selecionar Talhão...</option>
                      {plots.map((plot) => (
                        <option key={plot.id} value={plot.id}>
                          {plot.name} ({plot.hectares} ha)
                        </option>
                      ))}
                    </select>

                    <select
                      value={selectedOrderId}
                      onChange={(e) => handleSelectOrder(e.target.value)}
                      className="bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-2.5 py-1.5 text-[11px] font-semibold text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                    >
                      <option value="">📋 Selecionar OS...</option>
                      {userScopedOrders.map((ord) => (
                        <option key={ord.id} value={ord.id}>
                          {ord.code} - {ord.farmName} ({ord.targetHectares} ha)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 1. Total Hectares Area Input with Steppers & Quick Chips */}
                <div className="space-y-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Área a Pulverizar:
                    </label>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-base font-black text-emerald-900 dark:text-emerald-300 bg-white dark:bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                        {String(totalHectares).replace('.', ',')} ha
                      </span>
                    </div>
                  </div>

                  {/* Stepper Buttons & Numeric Input */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTotalHectares(prev => Math.max(0, parseFloat((prev - 10).toFixed(1))))}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-950 dark:text-white border border-emerald-300 dark:border-emerald-600 text-xs font-black cursor-pointer transition-colors shadow-2xs"
                    >
                      -10
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalHectares(prev => Math.max(0, parseFloat((prev - 1).toFixed(1))))}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-950 dark:text-white border border-emerald-300 dark:border-emerald-600 text-xs font-black cursor-pointer transition-colors shadow-2xs"
                    >
                      -1
                    </button>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="20000"
                      value={totalHectares || ''}
                      placeholder="0"
                      onChange={(e) => setTotalHectares(parseFloat(e.target.value) || 0)}
                      className="flex-1 bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-lg px-2.5 py-1.5 text-center text-xs font-mono font-black text-emerald-950 dark:text-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setTotalHectares(prev => parseFloat((prev + 1).toFixed(1)))}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-950 dark:text-white border border-emerald-300 dark:border-emerald-600 text-xs font-black cursor-pointer transition-colors shadow-2xs"
                    >
                      +1
                    </button>
                    <button
                      type="button"
                      onClick={() => setTotalHectares(prev => parseFloat((prev + 10).toFixed(1)))}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/80 dark:hover:bg-emerald-800 text-emerald-950 dark:text-white border border-emerald-300 dark:border-emerald-600 text-xs font-black cursor-pointer transition-colors shadow-2xs"
                    >
                      +10
                    </button>
                  </div>

                  {/* Range Slider */}
                  <input
                    type="range"
                    min="1"
                    max="200"
                    step="0.5"
                    value={totalHectares}
                    onChange={(e) => setTotalHectares(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />

                  {/* Area Presets */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                    {[10, 25, 48.5, 75, 100, 150].map((ha) => (
                      <button
                        key={ha}
                        type="button"
                        onClick={() => setTotalHectares(ha)}
                        className={`px-2 py-1 rounded-md border font-bold cursor-pointer transition-colors ${
                          totalHectares === ha
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                        }`}
                      >
                        {String(ha).replace('.', ',')} ha
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Spray Rate (Taxa de Calda L/ha) */}
                <div className="space-y-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Taxa de Aplicação (Taxa de Calda):
                    </label>
                    <span className="font-mono text-sm font-black text-emerald-900 dark:text-emerald-300 bg-white dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                      {String(sprayRateLHa).replace('.', ',')} L/ha
                    </span>
                  </div>

                  {/* Presets chips */}
                  <div className="grid grid-cols-5 gap-1.5 text-[11px]">
                    {[5, 8, 10, 12, 15].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setSprayRateLHa(rate)}
                        className={`py-1.5 rounded-lg border font-bold text-center transition-colors cursor-pointer ${
                          sprayRateLHa === rate
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                        }`}
                      >
                        {String(rate).replace('.', ',')} L/ha
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="3"
                    max="25"
                    step="0.5"
                    value={sprayRateLHa}
                    onChange={(e) => setSprayRateLHa(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                    <span>5 L/ha (Ultra Baixo)</span>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">10 L/ha (Padrão Drone)</span>
                    <span>20 L/ha (Alto Volume)</span>
                  </div>
                </div>

                 {/* 3. Capacity of the Mixing Tank (Capacidade do Tanque Misturador) */}
                <div className="space-y-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Capacidade do Tanque Misturador:
                    </label>
                    <span className="font-mono text-sm font-black text-emerald-900 dark:text-emerald-300 bg-white dark:bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-700 shadow-2xs">
                      {mixerCapacityL} L
                    </span>
                  </div>

                  {/* Standard mixer capacities */}
                  <div className="grid grid-cols-4 gap-1.5 text-[11px]">
                    {[150, 500, 1000, 2000].map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setMixerCapacityL(size)}
                        className={`py-1.5 rounded-lg border font-bold text-center transition-colors cursor-pointer ${
                          mixerCapacityL === size
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700 shadow-2xs'
                        }`}
                      >
                        {size} L
                      </button>
                    ))}
                  </div>

                  <input
                    type="range"
                    min="50"
                    max="5000"
                    step="50"
                    value={mixerCapacityL}
                    onChange={(e) => setMixerCapacityL(parseFloat(e.target.value))}
                    className="w-full accent-emerald-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-emerald-800/80 dark:text-emerald-300/80">
                    <span>50 L</span>
                    <span className="font-bold text-emerald-900 dark:text-emerald-200">Ajuste Livre do Misturador</span>
                    <span>5.000 L</span>
                  </div>
                </div>

                {/* 4. Drone Tank Capacity Selection (Secondary/Informational) */}
                <div className="space-y-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                      Capacidade do Drone (Abastecimento):
                    </label>
                    <span className="font-mono text-sm font-black text-emerald-900 dark:text-emerald-300">
                      {tankCapacityL} L ({selectedDroneName})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {(drones && drones.length > 0 ? drones : [
                      { id: 'dji-t20p', modelName: 'DJI Agras T20P', tankCapacityL: 20 },
                      { id: 'dji-t40', modelName: 'DJI Agras T40', tankCapacityL: 40 },
                      { id: 'dji-t50', modelName: 'DJI Agras T50', tankCapacityL: 50 },
                      { id: 'xag-p100', modelName: 'XAG P100 Pro', tankCapacityL: 50 },
                    ]).map((dr) => {
                      const isSelected = selectedDroneName.toLowerCase().includes(dr.modelName.toLowerCase()) || 
                        dr.modelName.toLowerCase().includes(selectedDroneName.toLowerCase());
                      return (
                        <button
                          key={dr.id}
                          type="button"
                          onClick={() => handleSelectDrone(dr.modelName, dr.tankCapacityL)}
                          className={`p-2 rounded-xl text-left border transition-all flex items-center gap-2.5 cursor-pointer ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                              : 'bg-white hover:bg-emerald-50 dark:bg-emerald-950 dark:hover:bg-emerald-900 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100 shadow-2xs'
                          }`}
                        >
                          <DronePhoto
                            modelName={dr.modelName}
                            photoUrl={(dr as any).photoUrl}
                            droneId={dr.id}
                            size="sm"
                            rounded="rounded-lg"
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-black text-xs truncate">{dr.modelName}</div>
                            <div className="text-[10px] opacity-80">{dr.tankCapacityL}L Tanque</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Mixing Batches Ground Station Instructions Box */}
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-200 font-bold">
                    <Info className="w-4 h-4 text-blue-600" />
                    <span>Plano de Bateladas do Tanque Misturador:</span>
                  </div>
                  <p className="text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                    Prepare <strong>{fullMixerTanksCount} batidas cheias</strong> de <strong>{mixerCapacityL} L</strong> no misturador principal. 
                    {hasPartialLastMixerTank && (
                      <>
                        {' '}Prepare também <strong>1 batida fracionada final com exatamente {lastMixerTankVolume.toFixed(1).replace('.', ',')} L</strong> ({ (lastMixerTankVolume / sprayRateLHa).toFixed(1).replace('.', ',') } ha).
                      </>
                    )}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    O volume total misturado ({totalGrossSprayVolume.toFixed(1).replace('.', ',')} L) alimentará sequencialmente <strong>{totalFlightsCount} voos de {tankCapacityL} L</strong> do drone.
                  </p>
                </div>

                {/* pH Control Card */}
                <div className="space-y-2 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-sky-500" />
                      Qualidade da Água & Controle de pH
                    </label>
                  </div>
                  
                  <div className="p-3.5 rounded-2xl bg-white dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-600 dark:text-slate-400">Faixa Alvo Padrão:</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                        {optimalPhRange.min.toFixed(1)} a {optimalPhRange.max.toFixed(1)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">pH da Água Limpa (Inicial)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="14"
                          step="0.1"
                          value={waterPhInitial}
                          onChange={(e) => setWaterPhInitial(parseFloat(e.target.value))}
                          className="flex-1 accent-sky-500"
                        />
                        <span className="font-mono font-bold text-sm w-8 text-center">{waterPhInitial.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">pH da Calda (Final)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="14"
                          step="0.1"
                          value={mixPhFinal}
                          onChange={(e) => setMixPhFinal(parseFloat(e.target.value))}
                          className="flex-1 accent-emerald-500"
                        />
                        <span className="font-mono font-bold text-sm w-8 text-center">{mixPhFinal.toFixed(1)}</span>
                      </div>
                    </div>

                    {/* Visual Gauge */}
                    <div className="pt-2">
                      <div className="h-2.5 rounded-full w-full relative overflow-hidden bg-gradient-to-r from-rose-600 via-emerald-400 to-purple-600">
                        {/* Target Range Indicator */}
                        <div 
                          className="absolute h-full bg-white/40 border-x-2 border-white/80"
                          style={{
                            left: `${(optimalPhRange.min / 14) * 100}%`,
                            width: `${((optimalPhRange.max - optimalPhRange.min) / 14) * 100}%`
                          }}
                        />
                        {/* Current Final pH Marker */}
                        <div 
                          className="absolute top-0 w-1 h-full bg-slate-900 dark:bg-white shadow-[0_0_4px_rgba(0,0,0,0.5)] z-10"
                          style={{ left: `${(mixPhFinal / 14) * 100}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono mt-1 text-slate-400">
                        <span>Ácido (0)</span>
                        <span>Neutro (7)</span>
                        <span>Alcalino (14)</span>
                      </div>
                    </div>

                    {/* Alerts */}
                    {(mixPhFinal > optimalPhRange.max) && (
                      <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[10px] text-amber-900 dark:text-amber-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>pH Alto (Alcalino):</strong> Risco grave de hidrólise alcalina e degradação rápida dos princípios ativos. Adicione redutor de pH / acidificante antes dos defensivos.</span>
                      </div>
                    )}
                    {(mixPhFinal < optimalPhRange.min) && (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[10px] text-rose-900 dark:text-rose-200 flex items-start gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span><strong>pH Baixo (Muito Ácido):</strong> Risco de precipitação de caldas cúpricas ou fitotoxidez extrema na cultura. Revise a dose do redutor de pH.</span>
                      </div>
                    )}
                    {(mixPhFinal >= optimalPhRange.min && mixPhFinal <= optimalPhRange.max) && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-900 dark:text-emerald-200 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span><strong>pH Ideal Atingido:</strong> Máxima estabilidade e meia-vida (T½) garantida para os defensivos e fertilizantes da receita.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Active Mix Products Table & Full Editor (7 Cols) */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-4">
              <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-2xl p-3.5 sm:p-4 shadow-2xs space-y-3">
                
                {/* Header of Products Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-emerald-200/70 dark:border-emerald-800/70">
                  <div>
                    <h3 className="text-sm font-black text-emerald-950 dark:text-white flex items-center gap-1.5">
                      <FlaskConical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      Receituário & Ordem de Adição ({products.length} Produtos)
                    </h3>
                    <p className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                      Ordem #1 a #{products.length} • <strong>{totalGrossSprayVolume.toFixed(1).replace('.', ',')} L total</strong> ({String(totalHectares).replace('.', ',')} ha @ {String(sprayRateLHa).replace('.', ',')} L/ha)
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 self-start sm:self-auto">
                    <button
                      onClick={() => setActiveStepTab('leaflets')}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-700 shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      title="Consultar banco completo de bulas oficiais do MAPA"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Bulas MAPA</span>
                    </button>

                    <button
                      onClick={handleOpenAddProduct}
                      className="px-3 py-1.5 rounded-lg text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar</span>
                    </button>
                  </div>
                </div>

                {/* WALES Method Regulatory Guidance Panel */}
                <div className="bg-white/80 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Guia de Ordem de Adição Regulamentar (Método WALES)
                    </span>
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300">
                      Padrão de Campo Seguro
                    </span>
                  </div>

                  <p className="text-[11px] text-emerald-950/80 dark:text-emerald-200/80 leading-relaxed">
                    A ordem de adição correta evita reações químicas adversas, floculação (formação de "nata" ou "cimento") e o entupimento instantâneo de pontas de pulverização de drones. O método regulamentar segue a sequência abaixo:
                  </p>

                  {/* WALES Horizontal Flow Visualization */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 text-center text-[10px] pt-1">
                    <div className="p-2 rounded-xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-800/60 flex flex-col justify-between">
                      <span className="font-mono font-black text-blue-700 dark:text-blue-400 block text-xs">#1 pH / Condic.</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">Prepara a Água</span>
                    </div>
                    <div className="p-2 rounded-xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-800/60 flex flex-col justify-between">
                      <span className="font-mono font-black text-amber-700 dark:text-amber-400 block text-xs">#2 W - Sólidos</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">WP / WG / SP / Pós</span>
                    </div>
                    <div className="p-2 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/5 border border-cyan-200 dark:border-cyan-800/60 flex flex-col justify-between">
                      <span className="font-mono font-black text-cyan-700 dark:text-cyan-400 block text-xs">#3 A - Suspensões</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">SC / OD / CS / Gel</span>
                    </div>
                    <div className="p-2 rounded-xl bg-purple-500/10 dark:bg-purple-500/5 border border-purple-200 dark:border-purple-800/60 flex flex-col justify-between">
                      <span className="font-mono font-black text-purple-700 dark:text-purple-400 block text-xs">#4 L/E - Líquidos</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">EC / SL / EW / Solúveis</span>
                    </div>
                    <div className="p-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800/60 col-span-2 sm:col-span-1 flex flex-col justify-between">
                      <span className="font-mono font-black text-emerald-700 dark:text-emerald-400 block text-xs">#5 S - Adjuvantes</span>
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight">Óleos & Espalhantes</span>
                    </div>
                  </div>

                  {/* WALES Compliance Alert Card */}
                  {products.length > 0 && (
                    <div className={`p-3.5 rounded-xl border transition-all ${
                      isWalesCompliant 
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3' 
                        : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3'
                    }`}>
                      <div className="flex items-start gap-2.5 text-xs">
                        {isWalesCompliant ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <strong className="block font-bold">
                            {isWalesCompliant 
                              ? 'Ordem de Calda Segura (WALES)' 
                              : 'Aviso: Ordem de Adição Desalinhada'
                            }
                          </strong>
                          <span className="text-[10px] leading-relaxed block text-slate-600 dark:text-slate-300">
                            {isWalesCompliant 
                              ? 'Excelente! Seus produtos estão listados seguindo estritamente a sequência regulamentar de mistura recomendada pelos órgãos de defesa fitossanitária.' 
                              : 'Atenção! A sequência atual dos produtos na sua calda está fora da ordem de mistura recomendada (WALES). Isso eleva os riscos de reações físicas adversas e entupimentos de bicos.'
                            }
                          </span>
                        </div>
                      </div>

                      {!isWalesCompliant && (
                        <button
                          onClick={handleSortProductsByWales}
                          className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-xs whitespace-nowrap self-end sm:self-center transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowDownAZ className="w-4 h-4" />
                          <span>Reordenar por WALES</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Products List Cards */}
                <div className="space-y-3">
                  {/* #0 SPECIAL ITEM: CLEAN CARRIER WATER */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-cyan-50/70 to-emerald-50/50 dark:from-blue-950/60 dark:via-cyan-950/40 dark:to-emerald-950/30 border-2 border-blue-400/80 dark:border-blue-600/80 shadow-xs space-y-3 relative overflow-hidden">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div 
                          className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs"
                          title="Ordem #0: Veículo Carreador Obrigatório"
                        >
                          #0
                        </div>
                        
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-xs sm:text-sm text-blue-950 dark:text-white">
                              Água Limpa de Diluição
                            </h4>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500 text-white shadow-2xs">
                              Veículo Carreador
                            </span>
                          </div>
                          <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 mt-0.5">
                            Volume de água ajustado automaticamente com base no deslocamento dos produtos
                          </p>
                        </div>
                      </div>

                      <span className="text-[10px] font-black px-2.5 py-1 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-700 font-mono">
                        {waterPercentage.toFixed(1).replace('.', ',')}% da Calda
                      </span>
                    </div>

                    {/* Middle: Calculated Quantities for Pure Water */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-blue-200/80 dark:border-blue-800/60">
                      {/* Water Dose per ha */}
                      <div className="bg-white/80 dark:bg-[#041c14]/80 p-2 rounded-xl border border-blue-200 dark:border-blue-800 shadow-2xs">
                        <span className="text-[10px] text-blue-800 dark:text-blue-300 block font-bold">Água / Hectare</span>
                        <span className="font-mono font-black text-blue-950 dark:text-white text-xs sm:text-sm">
                          {pureWaterPerHa.toFixed(2).replace('.', ',')} L/ha
                        </span>
                      </div>

                      {/* Water per Full Mixer Tank */}
                      <div className="bg-blue-600 text-white p-2 rounded-xl shadow-xs">
                        <span className="text-[10px] text-blue-100 block font-bold">
                          Por Batida Misturador ({mixerCapacityL}L)
                        </span>
                        <span className="font-mono font-black text-white text-xs sm:text-sm">
                          {pureWaterPerFullMixerL.toFixed(1).replace('.', ',')} L
                        </span>
                      </div>

                      {/* Water per Partial Mixer Tank */}
                      <div className="bg-cyan-50 dark:bg-cyan-950/50 p-2 rounded-xl border border-cyan-200 dark:border-cyan-800">
                        <span className="text-[10px] text-cyan-800 dark:text-cyan-300 block font-bold">
                          Batida Fracionada ({lastMixerTankVolume.toFixed(1).replace('.', ',')}L)
                        </span>
                        <span className="font-mono font-black text-cyan-950 dark:text-cyan-200 text-xs sm:text-sm">
                          {hasPartialLastMixerTank ? `${pureWaterLastMixerL.toFixed(1).replace('.', ',')} L` : '—'}
                        </span>
                      </div>

                      {/* Total Pure Water Area */}
                      <div className="bg-gradient-to-tr from-cyan-600 to-blue-700 text-white p-2 rounded-xl shadow-xs">
                        <span className="text-[10px] text-cyan-100 block font-bold">Total ({String(totalHectares).replace('.', ',')} ha)</span>
                        <span className="font-mono font-black text-white text-xs sm:text-sm">
                          {totalPureWaterNeededL.toFixed(1).replace('.', ',')} L
                        </span>
                      </div>
                    </div>

                    {/* Technical Field Instruction - TOTAL SPRAY BATCH PREPARATION */}
                    <div className="text-[10px] text-blue-950 dark:text-blue-200 bg-blue-100/70 dark:bg-blue-950/60 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 flex flex-col gap-2">
                      <span className="flex items-center gap-1.5 leading-relaxed">
                        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        <span><strong>Preparo de 1 Batida Cheia do Misturador ({mixerCapacityL} L):</strong> Adicione 60% ({pureWaterPreloadFullMixerL.toFixed(1).replace('.', ',')} L) de água limpa no misturador principal com agitação ligada, adicione os produtos químicos na ordem indicada (#1 ao #{products.length}) totalizando {chemicalsVolumePerFullMixerL.toFixed(1).replace('.', ',')} L de insumos, e complete com {pureWaterTopUpFullMixerL.toFixed(1).replace('.', ',')} L de água (Q.S.P.) até atingir a marca de {mixerCapacityL} L.</span>
                      </span>
                      <span className="flex items-center gap-1.5 leading-relaxed border-t border-blue-200/50 dark:border-blue-900/50 pt-2">
                        <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400 flex-shrink-0" />
                        <span><strong>Preparo da Calda Total ({totalGrossSprayVolume.toFixed(1).replace('.', ',')} L):</strong> Batelada total de {totalPureWaterNeededL.toFixed(1).replace('.', ',')} L de água limpa e {totalChemicalsVolumeL.toFixed(1).replace('.', ',')} L de insumos químicos para cobrir {String(totalHectares).replace('.', ',')} hectares.</span>
                      </span>
                    </div>
                  </div>

                  {products.map((prod, index) => {
                    const totalAmount = prod.dosePerHa * totalHectares;
                    const amountPerFullMixer = prod.dosePerHa * hectaresPerMixer;
                    const amountPerLastMixer = hasPartialLastMixerTank
                      ? (prod.dosePerHa * (lastMixerTankVolume / sprayRateLHa))
                      : 0;

                    const orderInfo = ORDER_MIX_DESCRIPTIONS[prod.mixOrder] || ORDER_MIX_DESCRIPTIONS[3];

                    return (
                      <div
                        key={prod.id}
                        className="p-4 rounded-2xl bg-white/90 dark:bg-[#041c14]/70 border border-emerald-200/80 dark:border-emerald-800 hover:border-emerald-400 transition-colors shadow-2xs space-y-3"
                      >
                        {/* Top Line: Sequential Step Badge, Name, Category & Action Buttons */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            {/* Sequential Step Badge (#1, #2, #3, ...) */}
                            <div 
                              className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-xs"
                              title={`Passo #${index + 1} de Adição no Tanque`}
                            >
                              #{index + 1}
                            </div>
                            
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">
                                  {prod.name}
                                </h4>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                  {prod.category}
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700">
                                  WALES Etapa #{prod.mixOrder}
                                </span>
                              </div>
                              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
                                {prod.chemicalClass} {prod.activeIngredient ? `• i.a: ${prod.activeIngredient}` : ''}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Bula, Move Up/Down, Edit, Delete */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenLeafletForProduct(prod)}
                              className="px-2 py-1 rounded-lg text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 hover:bg-emerald-200 border border-emerald-300/80 dark:border-emerald-700 flex items-center gap-1 cursor-pointer"
                              title="Visualizar Bula Técnica Oficial MAPA"
                            >
                              <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span className="hidden sm:inline">Bula</span>
                            </button>
                            <button
                              onClick={() => handleMoveProductOrder(index, 'up')}
                              disabled={index === 0}
                              className="p-1 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-30 cursor-pointer"
                              title="Subir ordem na calda"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMoveProductOrder(index, 'down')}
                              disabled={index === products.length - 1}
                              className="p-1 rounded-lg text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 disabled:opacity-30 cursor-pointer"
                              title="Descer ordem na calda"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenEditProduct(prod)}
                              className="p-1.5 rounded-lg text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
                              title="Editar Produto & Doses"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60 cursor-pointer"
                              title="Excluir Produto"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Middle: Calculated Quantities Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1 border-t border-emerald-100 dark:border-emerald-800/60">
                          {/* Dose per ha */}
                          <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-200/60 dark:border-emerald-800">
                            <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 block font-bold">Dose / Hectare</span>
                            <span className="font-mono font-black text-emerald-950 dark:text-white text-xs sm:text-sm">
                              {String(prod.dosePerHa).replace('.', ',')} {prod.doseUnit}
                            </span>
                          </div>

                          {/* Dose per Full Mixer Tank */}
                          <div className="bg-emerald-100/70 dark:bg-emerald-950/70 p-2 rounded-xl border border-emerald-300/80 dark:border-emerald-700">
                            <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-bold">
                              Por Batida Misturador ({mixerCapacityL}L)
                            </span>
                            <span className="font-mono font-black text-emerald-900 dark:text-emerald-200 text-xs sm:text-sm">
                              {formatDecimal(amountPerFullMixer, 2)} {prod.doseUnit.split('/')[0]}
                            </span>
                          </div>

                          {/* Dose per Partial Mixer Tank (if any) */}
                          <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                            <span className="text-[10px] text-amber-800 dark:text-amber-300 block font-bold">
                              Batida Fracionada ({formatDecimal(lastMixerTankVolume, 1)}L)
                            </span>
                            <span className="font-mono font-black text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                              {hasPartialLastMixerTank ? `${formatDecimal(amountPerLastMixer, 2)} ${prod.doseUnit.split('/')[0]}` : '—'}
                            </span>
                          </div>

                          {/* Total for Full Area */}
                          <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-2xs">
                            <span className="text-[10px] text-emerald-100 block font-bold">Total ({formatHectares(totalHectares)})</span>
                            <span className="font-mono font-black text-white text-xs sm:text-sm">
                              {formatDecimal(totalAmount, 2)} {prod.doseUnit.split('/')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Bottom tip for chemical order */}
                        <div className="text-[10px] text-emerald-800/80 dark:text-emerald-400/80 flex items-center justify-between">
                          <span>{orderInfo.title}</span>
                          {prod.costPerUnit ? (
                            <span className="font-mono text-emerald-900 dark:text-emerald-300 font-bold">
                              Custo total: {formatBRL(totalAmount * prod.costPerUnit)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {products.length === 0 && (
                  <div className="text-center py-8 border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-2xl space-y-2">
                    <Droplets className="w-8 h-8 text-emerald-400 mx-auto" />
                    <p className="text-xs font-bold text-emerald-950 dark:text-white">Nenhum produto na calda atual.</p>
                    <p className="text-[11px] text-emerald-700/70 dark:text-emerald-400/70">
                      Clique em "Adicionar Produto" ou selecione um dos Presets prontos acima.
                    </p>
                  </div>
                )}
              </div>

              {/* NR-31 Compliance & Safety Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* PPE Checklist */}
                <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800 rounded-3xl p-5 shadow-xs space-y-3">
                  <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    EPIs Obrigatórios (NR-31 / Solo)
                  </h4>

                  <div className="space-y-2 text-xs">
                    {[
                      { key: 'mascara', label: 'Máscara c/ filtro de carvão ativado P2/P3' },
                      { key: 'luvas', label: 'Luvas de nitrila cano longo' },
                      { key: 'avental', label: 'Avental impermeável hidrorrepelente' },
                      { key: 'oculos', label: 'Óculos de proteção vedados' },
                      { key: 'botas', label: 'Botas de borracha impermeáveis' },
                    ].map((item) => (
                      <label key={item.key} className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={checkedPPE[item.key]}
                          onChange={() => togglePPE(item.key)}
                          className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                        />
                        <span className="text-emerald-950 dark:text-emerald-200 font-medium text-[11px]">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* InpEV Reverse Logistics */}
                <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800 rounded-3xl p-5 shadow-xs space-y-3">
                  <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white flex items-center gap-2">
                    <RotateCcw className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Logística Reversa InpEV
                  </h4>

                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                    Estimativa de <strong>{totalEmptyContainersCount} embalagens vazias</strong> para descarte ambiental e emissão de comprovante.
                  </p>

                  <label className="flex items-start gap-2.5 cursor-pointer select-none p-2.5 rounded-xl bg-white/80 dark:bg-[#041c14]/60 border border-emerald-200/80 dark:border-emerald-800">
                    <input
                      type="checkbox"
                      checked={tripleRinseDone}
                      onChange={(e) => setTripleRinseDone(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded mt-0.5 cursor-pointer"
                    />
                    <span className="text-emerald-950 dark:text-emerald-200 font-semibold text-[10px] leading-tight">
                      Confirmo a realização de Tríplice Lavagem sob pressão (30 seg) e perfuração do fundo de todas as embalagens plásticas.
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPLETE CHEMICAL LEAFLET LIBRARY (BULAS MAPA) & SYNCHRONIZATION */}
      {activeStepTab === 'leaflets' && (
        <ChemicalLeafletLibrary
          currentProducts={products}
          onSelectLeaflet={(leaflet) => {
            setSelectedLeafletForModal(leaflet);
            setIsLeafletModalOpen(true);
          }}
          onAddToSprayMix={handleSynchronizeLeafletToMix}
          selectedCrop={plots.find(p => p.id === selectedPlotId)?.crop}
        />
      )}

      {/* TAB 3: STEP BY STEP TANK MIX PROTOCOL (WALES METHOD) */}
      {activeStepTab === 'steps' && (
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-emerald-200 dark:border-emerald-800">
            <div>
              <h2 className="text-xl font-black text-emerald-950 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Protocolo Operacional WALES / DARE (Passo a Passo no Tanque)
              </h2>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Sequência padrão internacional para misturas em tanque agrícola. Evita precipitação, gelificação e perda de eficácia biológica.
              </p>
            </div>

            <button
              onClick={handleCopyRecipeToWhatsApp}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar Guia ao Auxiliar de Solo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-blue-500 text-white font-black text-xs flex items-center justify-center">1</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  {formatDecimal(totalPureWaterPreloadL, 1)} L Água (60%)
                </span>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">Água Limpa & Agitação Inicial</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Abasteça o tanque misturador com <strong>{formatDecimal(totalPureWaterPreloadL, 1)} Litros de água limpa</strong> (fundo de 60% do lote total de {formatDecimal(totalGrossSprayVolume, 1)} L). Ligue a agitação hidráulica antes de introduzir qualquer produto.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">2</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">pH 4.5 - 5.5</span>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">Condicionador & Redutor de pH</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Adicione primeiro o condicionador de água para quelatizar cátions de cálcio/magnésio e reduzir o pH da água antes de colocar os defensivos.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-white font-black text-xs flex items-center justify-center">3</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">WP / WG / SP</span>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">Sólidos & Grânulos Molháveis</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Faça a <strong>pré-diluição</strong> em balde plástico limpo com água morna/ambiente. Despeje lentamente com agitação vigorosa até dissolução total.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-cyan-600 text-white font-black text-xs flex items-center justify-center">4</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-300">SC / OD / CS</span>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">Suspensões Concentradas</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Adicione fungicidas ou inseticidas líquidos em suspensão. Agite o galão antes de despejar e mantenha o misturador em rotação constante.
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">5</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">EC / SL / EW</span>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">Concentrados Emulsionáveis</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Adicione os produtos à base de solvente orgânico que formam emulsão leitosa. Nunca adicione antes dos pós molháveis.
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-5 rounded-2xl bg-white/90 dark:bg-[#041c14]/80 border border-emerald-200 dark:border-emerald-800 shadow-2xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">6</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  +{formatDecimal(totalPureWaterTopUpL, 1)} L (Q.S.P.)
                </span>
              </div>
              <h4 className="font-black text-xs sm:text-sm text-emerald-950 dark:text-white">Adjuvantes & Completação Final</h4>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                Adicione óleos e espalhantes siliconados por último. Complete com <strong>{formatDecimal(totalPureWaterTopUpL, 1)} Litros de água limpa</strong> até a marca exata de <strong>{formatDecimal(totalGrossSprayVolume, 1)} Litros de calda pronta</strong> e agite por 3 minutos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: JAR TEST & INCOMPATIBILITY WARNINGS */}
      {activeStepTab === 'jartest' && (
        <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="pb-4 border-b border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-emerald-950 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Simulador do Teste de Jarro & Compatibilidade Personalizada
              </h2>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Procedimento prático com doses personalizadas para validar a compatibilidade física dos seus produtos em pequena escala (1 Litro).
              </p>
            </div>
            <div className="bg-emerald-100 dark:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800 self-start sm:self-center">
              <span className="text-[10px] text-emerald-800 dark:text-emerald-300 block font-bold uppercase leading-none">Taxa de Aplicação Base</span>
              <span className="font-mono font-black text-xs text-emerald-900 dark:text-emerald-100">{String(sprayRateLHa).replace('.', ',')} L/ha</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Column 1: Instructions & Dynamic Doses (7/12 cols) */}
            <div className="lg:col-span-7 space-y-5">
              <div className="bg-white/80 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                <h3 className="font-black text-sm text-emerald-950 dark:text-white flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  Como executar o Teste de Jarro em 5 minutos:
                </h3>
                <ol className="space-y-2 list-decimal pl-4 leading-relaxed">
                  <li>Pegue um frasco transparente graduado de 1.000 mL (1 Litro).</li>
                  <li>Coloque exatamente <strong>500 mL</strong> da mesma água que será utilizada na pulverização no campo.</li>
                  <li>Adicione em sequência as <strong>doses proporcionais calculadas abaixo</strong> para cada produto, respeitando rigorosamente a ordem de mistura.</li>
                  <li>Complete com água limpa até atingir a marca de <strong>1.000 mL (1 Litro)</strong> e tampe o frasco.</li>
                  <li>Agite vigorosamente por 30 segundos e deixe descansar em repouso por 15 a 30 minutos.</li>
                  <li>Avalie visualmente a presença de: <strong>precipitações no fundo, floculação, formação de nata, separação de fases ou aquecimento (reação exotérmica)</strong>.</li>
                </ol>
              </div>

              {/* Dynamic Recipe List for Jar Test */}
              <div className="space-y-3">
                <h3 className="font-black text-sm text-emerald-950 dark:text-white flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-emerald-600" />
                  Doses Proporcionais para Jarro de 1 Litro:
                </h3>

                {products.length === 0 ? (
                  <div className="p-6 text-center border-2 border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl bg-white/40 dark:bg-emerald-950/20">
                    <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Nenhum produto adicionado à calda</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Adicione produtos no Receituário & Ordem de Adição (Aba 2) para visualizar as orientações de dosagem proporcional automatizadas!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {/* Water Preload step */}
                    <div className="p-3.5 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/60 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-mono font-bold text-xs">
                          H2O
                        </div>
                        <div>
                          <span className="font-bold text-emerald-950 dark:text-white block text-xs">1. Água Limpa (Veículo Carreador)</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Fundo inicial de segurança</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-blue-700 dark:text-blue-300 block">500 mL</span>
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Volume Inicial</span>
                      </div>
                    </div>

                    {/* Products steps */}
                    {products.map((p) => {
                      const propDose = getJarTestProportionalDose(p.dosePerHa, p.doseUnit, sprayRateLHa);
                      const isChecked = !!checkedJarProducts[p.id];
                      const orderInfo = ORDER_MIX_DESCRIPTIONS[p.mixOrder] || ORDER_MIX_DESCRIPTIONS[3];

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            setCheckedJarProducts({
                              ...checkedJarProducts,
                              [p.id]: !isChecked
                            });
                          }}
                          className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                            isChecked
                              ? 'bg-emerald-100/40 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 opacity-75'
                              : 'bg-white dark:bg-emerald-950 border-emerald-200/80 dark:border-emerald-800 hover:border-emerald-300 dark:hover:border-emerald-700 shadow-3xs'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                              isChecked
                                ? 'bg-emerald-600 border-emerald-600 text-white'
                                : 'border-emerald-300 dark:border-emerald-600 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5 stroke-[3px]" />
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-emerald-950 dark:text-white block text-xs truncate">
                                #{p.mixOrder} — {p.name}
                              </span>
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block truncate font-medium">
                                {orderInfo.title} • Dose Campo: {String(p.dosePerHa).replace('.', ',')} {p.doseUnit}
                              </span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="font-mono font-black text-xs text-emerald-800 dark:text-emerald-200 block">
                              {propDose.value.toFixed(2).replace('.', ',')} {propDose.unit}
                            </span>
                            <span className="text-[9px] text-slate-500 uppercase font-semibold">Para 1 Litro</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* QSP step */}
                    <div className="p-3.5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-950/60 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-mono font-bold text-xs">
                          QSP
                        </div>
                        <div>
                          <span className="font-bold text-emerald-950 dark:text-white block text-xs">Completar Volume com Água</span>
                          <span className="text-[10px] text-emerald-700 dark:text-emerald-400">Agitar constantemente</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-emerald-800 dark:text-emerald-200 block">Até 1.000 mL</span>
                        <span className="text-[9px] text-slate-500 uppercase font-semibold">Volume Q.S.P.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Incompatibility warnings (5/12 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="font-black text-sm text-emerald-950 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Análise de Compatibilidade da Calda:
              </h3>

              <div className="space-y-3">
                {/* Dynamically analyzed warnings */}
                {jarTestWarnings.map((warning, idx) => {
                  const isCritical = warning.includes('⚠️');
                  return (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border text-xs leading-relaxed ${
                        isCritical
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/80 text-rose-950 dark:text-rose-200'
                          : warning.startsWith('ℹ️')
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/80 text-blue-950 dark:text-blue-200'
                          : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                      }`}
                    >
                      {warning}
                    </div>
                  );
                })}

                {/* Educational Box about Agitation and high concentrations */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  <span className="font-bold text-slate-900 dark:text-white block mb-1">💡 Particularidade de Caldas com Drone:</span>
                  Como as taxas de aplicação com drones são extremamente baixas (8 a 15 L/ha), a concentração química na água é até 15 vezes maior do que em pulverizadores tratorizados tradicionais. Isso eleva significativamente os riscos de incompatibilidade química. Nunca ignore o teste de jarro quando utilizar novas combinações de insumos.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-800">
              <h3 className="text-base font-black text-emerald-950 dark:text-white flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {editingProductId ? 'Editar Produto da Calda' : 'Adicionar Produto ao Receituário'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              {/* Quick MAPA Leaflet Auto-filler with Advanced Search */}
              <ChemicalBulaSelector
                selectedLeafletId={selectedLeafletToImport}
                onSelectLeaflet={(leaflet) => handleImportLeafletIntoForm(leaflet.id)}
                onClearSelection={() => setSelectedLeafletToImport('')}
                onOpenLeafletModal={(leaflet) => {
                  setSelectedLeafletForModal(leaflet);
                  setIsLeafletModalOpen(true);
                }}
              />

              {/* Product Name with Smart Suggestions */}
              <div className="relative">
                <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1 flex items-center justify-between">
                  <span>Nome Comercial do Produto:</span>
                  {selectedLeafletToImport && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">
                      ✓ Vinculado à Bula MAPA
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Protioconazol + Trifloxistrobina 325 WG"
                  value={formProduct.name}
                  onChange={(e) => {
                    setFormProduct({ ...formProduct, name: e.target.value });
                    // If user changes text, see if there is an exact match
                    const match = CHEMICAL_LEAFLETS_DATABASE.find(l => l.commercialName.toLowerCase() === e.target.value.toLowerCase());
                    if (match) {
                      setSelectedLeafletToImport(match.id);
                    }
                  }}
                  className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-medium text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              {/* Category & Mix Order */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Categoria:
                  </label>
                  <select
                    value={formProduct.category}
                    onChange={(e) => setFormProduct({ ...formProduct, category: e.target.value as any })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-medium text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="FUNGICIDE">Fungicida</option>
                    <option value="HERBICIDE">Herbicida</option>
                    <option value="INSECTICIDE">Inseticida</option>
                    <option value="ADJUVANT">Adjuvante / Óleo</option>
                    <option value="FOLIAR_FERT">Fertilizante Foliar</option>
                    <option value="BIOLOGICAL">Biológico</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Ordem de Mistura (WALES):
                  </label>
                  <select
                    value={formProduct.mixOrder}
                    onChange={(e) => setFormProduct({ ...formProduct, mixOrder: parseInt(e.target.value) })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-bold text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value={1}>1º Condicionador / pH</option>
                    <option value={2}>2º Sólidos (WP/WG/SP)</option>
                    <option value={3}>3º Suspensões (SC/OD)</option>
                    <option value={4}>4º Emulsionáveis (EC/SL)</option>
                    <option value={5}>5º Adjuvantes / Óleos</option>
                  </select>
                </div>
              </div>

              {/* Dose & Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Dose por Hectare:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formProduct.dosePerHa || ''}
                    placeholder="0"
                    onChange={(e) => setFormProduct({ ...formProduct, dosePerHa: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-mono font-bold text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Unidade de Medida:
                  </label>
                  <select
                    value={formProduct.doseUnit}
                    onChange={(e) => setFormProduct({ ...formProduct, doseUnit: e.target.value as any })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-medium text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="L/ha">L/ha (Litros)</option>
                    <option value="kg/ha">kg/ha (Quilos)</option>
                    <option value="mL/ha">mL/ha (Mililitros)</option>
                    <option value="g/ha">g/ha (Gramas)</option>
                  </select>
                </div>
              </div>

              {/* Chemical Class & Active Ingredient */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Classe Química / Formulação:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Triazol + Estrobilurina (WG)"
                    value={formProduct.chemicalClass}
                    onChange={(e) => setFormProduct({ ...formProduct, chemicalClass: e.target.value })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Ingrediente Ativo (i.a.):
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Protioconazol 175 g/L"
                    value={formProduct.activeIngredient}
                    onChange={(e) => setFormProduct({ ...formProduct, activeIngredient: e.target.value })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Cost & InpEV Empty Containers */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Custo Unitário (R$ por L ou kg):
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    placeholder="Ex: 85.00"
                    value={formProduct.costPerUnit || ''}
                    onChange={(e) => setFormProduct({ ...formProduct, costPerUnit: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-mono text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                    Embalagens p/ InpEV:
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formProduct.packageUnitsEmpty || ''}
                    placeholder="0"
                    onChange={(e) => setFormProduct({ ...formProduct, packageUnitsEmpty: parseInt(e.target.value) || 0 })}
                    className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-mono text-emerald-950 dark:text-emerald-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-100 dark:border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 cursor-pointer"
                >
                  {editingProductId ? 'Salvar Alterações' : 'Adicionar à Calda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SAVE AS PRESET */}
      {isSavePresetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-800">
              <h3 className="text-base font-black text-emerald-950 dark:text-white flex items-center gap-2">
                <Save className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Salvar Modelo de Calda Personalizado
              </h3>
              <button
                onClick={() => setIsSavePresetModalOpen(false)}
                className="p-1 rounded-lg text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-emerald-950 dark:text-emerald-200 mb-1">
                  Nome do Modelo / Receituário:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Soja - Manejo de Lagartas e Fungos R3"
                  value={customPresetName}
                  onChange={(e) => setCustomPresetName(e.target.value)}
                  className="w-full bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 rounded-xl px-3 py-2 font-medium text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                Este modelo salvará os {products.length} produtos atuais e a taxa recomendada de {String(sprayRateLHa).replace('.', ',')} L/ha na memória do aplicativo.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-emerald-100 dark:border-emerald-800">
                <button
                  type="button"
                  onClick={() => setIsSavePresetModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCurrentAsPreset}
                  disabled={!customPresetName.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  Salvar Preset
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PROFESSIONAL PRINT VIEW / PDF REPORT MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:inset-auto print:bg-white print:p-0 print:overflow-visible">

          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200 no-print">
            {/* Header Control Panel (Only visible on screen) */}
            <div className="bg-emerald-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-sm uppercase tracking-wider">Visualização do Prontuário Operacional</h3>
                  <p className="text-[10px] text-emerald-300 dark:text-slate-400">Pronto para impressão em papel A4 ou exportação para PDF.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md hover:shadow-emerald-950/20 active:scale-95 cursor-pointer transition-all"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / PDF
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-1.5 hover:bg-emerald-800/60 dark:hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Print Area Preview */}
            <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
              
              {/* Outer boundary of the paper sheet */}
              <div 
                id="print-section"
                className="bg-white text-slate-900 font-sans p-8 sm:p-10 border border-slate-300 rounded-xl max-w-3xl mx-auto shadow-sm space-y-6"
              >
                
                {/* Document Header */}
                <div className="border-b-2 border-slate-900 pb-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <BrandLogo theme={theme || ({} as WhiteLabelTheme)} size="sm" />
                      <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-widest font-mono">
                        {theme?.companyName || 'AeroAgro Tecnologia'}
                      </span>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase leading-tight tracking-tight">Ficha de Preparo de Calda & Mistura</h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Laudo de Engenharia Química de Calda Agrícola • Padrão NR-31</p>
                  </div>
                  <div className="text-left md:text-right text-xs space-y-0.5 bg-slate-50 p-3 rounded-lg border border-slate-200 min-w-[150px]">
                    <div>Data: <strong className="font-bold">{new Date().toLocaleDateString('pt-BR')}</strong></div>
                    <div>Hora: <strong className="font-mono">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></div>
                    <div>Status: <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase rounded-sm border border-emerald-300">APROVADA</span></div>
                  </div>
                </div>

                {/* Operations Specs Grid */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-emerald-700" />
                    Parâmetros Operacionais e Equipamento
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Equipamento Aplicador</span>
                      <strong className="text-slate-900 font-black">{selectedDroneName || 'Drone Agrícola'} ({tankCapacityL}L)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Tanque Misturador Principal</span>
                      <strong className="text-slate-900 font-black text-emerald-700">{mixerCapacityL} Litros</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Taxa de Aplicação</span>
                      <strong className="text-slate-900 font-black">{String(sprayRateLHa).replace('.', ',')} L/ha</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Área Programada</span>
                      <strong className="text-slate-900 font-black">{String(totalHectares).replace('.', ',')} Hectares (ha)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Talhão / Lavoura</span>
                      <strong className="text-slate-900 font-bold">{plots.find(p => p.id === selectedPlotId)?.name || 'Geral / Não Especificado'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Volume Total Preparado</span>
                      <strong className="text-slate-900 font-black text-emerald-700">{formatDecimal(totalGrossSprayVolume, 1)} Litros</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Quantidade de Voos</span>
                      <strong className="text-slate-900 font-black">{totalFlightsCount} Voos ({fullTanksCount} cheios + {lastTankVolume > 0.05 ? `${formatDecimal(lastTankVolume, 1)}L parcial` : '0'})</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Volume de Água Limpa</span>
                      <strong className="text-slate-900 font-black">{formatDecimal(totalPureWaterNeededL, 1)} L ({formatDecimal(waterPercentage, 1)}%)</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase block leading-none">Volume de Defensivos</span>
                      <strong className="text-slate-900 font-black">{formatDecimal(totalChemicalsVolumeL, 1)} L ({formatDecimal(chemicalsPercentage, 1)}%)</strong>
                    </div>
                  </div>
                </div>

                {/* Chemicals Recipe Table */}
                <div className="space-y-2">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-emerald-700" />
                    Ingredientes e Dosagem Sistemática
                  </h2>
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold text-[9px] uppercase tracking-wider">
                          <th className="p-2.5">Ingrediente / Produto</th>
                          <th className="p-2.5">WALES</th>
                          <th className="p-2.5 text-right">Dose / ha</th>
                          <th className="p-2.5 text-right">Por Batida Misturador</th>
                          {hasPartialLastMixerTank && <th className="p-2.5 text-right">Batida Fracionada</th>}
                          <th className="p-2.5 text-right">Total para Área</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {products.map((p) => {
                          const perMixer = p.dosePerHa * hectaresPerMixer;
                          const partialMixerAmount = p.dosePerHa * lastMixerHectares;
                          const totalAmount = p.dosePerHa * totalHectares;
                          const baseUnit = p.doseUnit.split('/')[0] || 'L';

                          return (
                            <tr key={p.id} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <div className="font-bold text-slate-900">{p.name}</div>
                                <div className="text-[9px] text-slate-500">{p.chemicalClass || p.category}</div>
                              </td>
                              <td className="p-2.5 font-mono font-bold text-slate-500">#{p.mixOrder}</td>
                              <td className="p-2.5 text-right font-mono font-bold">{formatDecimal(p.dosePerHa, 2)} {p.doseUnit}</td>
                              <td className="p-2.5 text-right font-mono">{formatDecimal(perMixer, 2)} {baseUnit}</td>
                              {hasPartialLastMixerTank && (
                                <td className="p-2.5 text-right font-mono text-amber-700">
                                  {formatDecimal(partialMixerAmount, 2)} {baseUnit}
                                </td>
                              )}
                              <td className="p-2.5 text-right font-mono font-black text-slate-900">{formatDecimal(totalAmount, 2)} {baseUnit}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* WALES Mixing Sequence Sequence */}
                <div className="space-y-2.5">
                  <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-700" />
                    Procedimento Seqüencial de Mistura no Tanque (Metodologia WALES)
                  </h2>
                  <div className="space-y-2 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                    <p className="text-[10px] text-slate-500 leading-tight">
                      Siga rigorosamente a ordem cronológica abaixo para evitar reações de incompatibilidade física ou química (floculação, cristalização ou quebra de fase) na calda:
                    </p>
                    <div className="space-y-2.5 pt-1">
                      {/* Step 0: Initial Water */}
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">0</div>
                        <div>
                          <strong className="text-slate-900 block font-bold">Pré-Carga de Água Limpa (60%) no Misturador</strong>
                          <span className="text-slate-600 block text-[10px]">
                            Abastecer o tanque misturador com aproximadamente <strong>{formatDecimal(mixerCapacityL * 0.6, 1)} L</strong> de água limpa por batida cheia e ligar a agitação hidráulica/mecânica antes de inserir qualquer químico.
                          </span>
                        </div>
                      </div>

                      {/* Sorted products in WALES sequence */}
                      {[...products]
                        .sort((a, b) => a.mixOrder - b.mixOrder)
                        .map((p, index) => {
                          const orderInfo = ORDER_MIX_DESCRIPTIONS[p.mixOrder] || { title: 'Etapa de Mistura', category: 'Líquidos', tip: 'Adicione sob agitação contínua.' };
                          return (
                            <div key={p.id} className="flex items-start gap-2.5 text-xs">
                              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">{index + 1}</div>
                              <div>
                                <strong className="text-slate-900 block font-bold">{orderInfo.title} — {p.name}</strong>
                                <span className="text-slate-600 block text-[10px]">
                                  {orderInfo.tip} Adicionar devagar. Quantidade por batida cheia do misturador: <strong>{formatDecimal(p.dosePerHa * hectaresPerMixer, 2)} {p.doseUnit.split('/')[0]}</strong>.
                                </span>
                              </div>
                            </div>
                          );
                        })}

                      {/* Step Final: QSP Top-up */}
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className="w-5 h-5 rounded-full bg-slate-900 text-white font-mono font-black text-[9px] flex items-center justify-center shrink-0 mt-0.5">Q</div>
                        <div>
                          <strong className="text-slate-900 block font-bold">Completar Volume com Água (Q.S.P.) no Misturador</strong>
                          <span className="text-slate-600 block text-[10px]">
                            Completar o volume restante com água limpa até o nível calibrado de {mixerCapacityL} L do misturador sob agitação para homogeneização final da calda.
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Safety conditions and environment */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Climate boundaries */}
                  <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5 text-xs bg-slate-50">
                    <span className="font-black text-slate-900 block text-[10px] uppercase tracking-wider border-b border-slate-300 pb-1">
                      Limites Climáticos Obrigatórios
                    </span>
                    <ul className="space-y-1 text-slate-600 text-[10px]">
                      <li>• <strong>Temperatura:</strong> Ideal entre 15°C e 30°C (máximo legal)</li>
                      <li>• <strong>Umidade Relativa (UR):</strong> Exigido acima de 50%</li>
                      <li>• <strong>Velocidade do Vento:</strong> Entre 3 km/h e 12 km/h (evita inversão/deriva)</li>
                      <li>• <strong>Delta T Psicrométrico:</strong> Ideal de 2°C a 8°C (máximo 10°C)</li>
                    </ul>
                  </div>

                  {/* Safety compliance checklist */}
                  <div className="p-3.5 border border-slate-200 rounded-xl space-y-1.5 text-xs bg-slate-50">
                    <span className="font-black text-slate-900 block text-[10px] uppercase tracking-wider border-b border-slate-300 pb-1">
                      Conformidade e Segurança NR-31
                    </span>
                    <ul className="space-y-1 text-slate-600 text-[10px]">
                      <li className="flex items-center gap-1.5">• <strong className="text-emerald-700">✓ EPIs Obrigatórios:</strong> Macacão impermeável, luvas nitrílicas, respirador e óculos</li>
                      <li className="flex items-center gap-1.5">• <strong className="text-emerald-700">✓ Destinação de Embalagem:</strong> Tríplice lavagem executada com perfuração e descarte legal</li>
                      <li className="flex items-center gap-1.5">• <strong className="text-emerald-700">✓ Compatibilidade Física:</strong> Calda validada em teste de jarro de 1000mL</li>
                    </ul>
                  </div>
                </div>

                {/* Footnotes and signature blocks */}
                <div className="border-t border-slate-300 pt-8 grid grid-cols-2 gap-6 text-center text-xs">
                  <div className="space-y-12">
                    <div className="w-full border-b border-slate-500 h-10"></div>
                    <div>
                      <strong className="block text-slate-900 font-bold">{currentUser.name || 'Operador Responsável'}</strong>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Piloto de Drone de Pulverização</span>
                    </div>
                  </div>
                  <div className="space-y-12">
                    <div className="w-full border-b border-slate-500 h-10"></div>
                    <div>
                      <strong className="block text-slate-900 font-bold">Eng. Rafael Silveira</strong>
                      <span className="text-[10px] text-slate-500 uppercase font-mono">Engenheiro Agrônomo / Supervisor</span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

            {/* Footer buttons (Only visible on screen) */}
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-md hover:shadow-emerald-950/20 active:scale-95 cursor-pointer"
              >
                <Printer className="w-4.5 h-4.5" />
                Imprimir Documento / PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CHEMICAL LEAFLET TECHNICAL MODAL */}
      <ChemicalLeafletModal
        leaflet={selectedLeafletForModal}
        isOpen={isLeafletModalOpen}
        onClose={() => {
          setIsLeafletModalOpen(false);
          setSelectedLeafletForModal(null);
        }}
        onAddToMix={(leaflet) => {
          handleSynchronizeLeafletToMix(leaflet);
          setIsLeafletModalOpen(false);
        }}
        isAlreadyInMix={Boolean(
          selectedLeafletForModal &&
          products.some(p => 
            p.name.toLowerCase() === selectedLeafletForModal.commercialName.toLowerCase() ||
            selectedLeafletForModal.commercialName.toLowerCase().includes(p.name.toLowerCase()) ||
            p.name.toLowerCase().includes(selectedLeafletForModal.commercialName.toLowerCase())
          )
        )}
      />
    </div>
  );
};
