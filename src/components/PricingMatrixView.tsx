import React, { useState } from 'react';
import { UserProfile, PricingMatrixRule, TerrainType, PricingModel } from '../types';
import { INITIAL_PRICING_RULES } from '../data/mockAppState';
import { showToast, showConfirm } from '../services/notificationService';
import { 
  DollarSign, 
  Layers, 
  Calculator, 
  CheckCircle2, 
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Copy,
  RotateCcw,
  ShieldCheck,
  Search,
  Filter,
  X,
  Check,
  AlertTriangle,
  Lock,
  Percent,
  Sprout,
  Mountain,
  Sliders,
  ArrowRight,
  Minus,
  Zap
} from 'lucide-react';
import { formatBRL } from '../utils/formatters';

interface PricingMatrixViewProps {
  currentUser: UserProfile;
  pricingRules: PricingMatrixRule[];
  setPricingRules: React.Dispatch<React.SetStateAction<PricingMatrixRule[]>>;
}

const TERRAIN_LABELS: Record<TerrainType, { label: string; factor: string }> = {
  FLAT_GRAINS: { label: 'Plano / Planalto', factor: '1,00x' },
  STEEP_SLOPE: { label: 'Encosta Severa / Declive', factor: '1,25x' },
  PASTURE: { label: 'Pastagem com Obstáculos', factor: '1,15x' },
  ORCHARD_FRUIT: { label: 'Pomar / Fruticultura', factor: '1,20x' },
  WETLAND: { label: 'Várzea / Terreno Úmido', factor: '1,10x' },
};

const PRICING_MODEL_LABELS: Record<PricingModel, string> = {
  PER_HECTARE: 'Por Hectare (R$/ha)',
  PER_FLIGHT_HOUR: 'Por Hora de Voo (R$/h)',
  PER_LITER_MIX: 'Por Litro de Calda (R$/L)',
};

const CROP_OPTIONS = [
  'Soja',
  'Milho',
  'Pastagem',
  'Cana-de-açúcar',
  'Algodão',
  'Café',
  'Citros',
  'Feijão',
  'Arroz',
  'Trigo',
  'Outra Cultura'
];

import { canUserAccessView } from '../utils/userPermissions';

export const PricingMatrixView: React.FC<PricingMatrixViewProps> = ({
  currentUser,
  pricingRules,
  setPricingRules,
}) => {
  const isAdmin = canUserAccessView(currentUser, 'pricing');

  // Strict Admin & Master Role Guard
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 rounded-3xl shadow-xl text-center space-y-4 animate-in fade-in">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
          <Lock className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-black text-emerald-950 dark:text-white">
            Acesso Restrito à Matriz de Precificação
          </h2>
          <p className="text-xs text-slate-600 dark:text-emerald-300/80 leading-relaxed max-w-md mx-auto">
            A visualização, simulação e configuração de tarifas base, fatores de relevo e faixas de desconto por volume são de acesso exclusivo aos <strong>Administradores</strong> e <strong>Usuários Master</strong>.
          </p>
        </div>
        <div className="pt-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Perfil Conectado: {currentUser.roleLabel}
          </span>
        </div>
      </div>
    );
  }

  // Simulator State (Starts from 0 ha as requested)
  const [simCrop, setSimCrop] = useState<string>('Soja');
  const [simTerrain, setSimTerrain] = useState<TerrainType>('FLAT_GRAINS');
  const [simHectares, setSimHectares] = useState<number>(0);

  // Table Search & Filtering State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCrop, setFilterCrop] = useState<string>('ALL');
  const [filterTerrain, setFilterTerrain] = useState<string>('ALL');

  // Modal State for Add/Edit Rule
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRule, setEditingRule] = useState<PricingMatrixRule | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);
  const [ruleToDelete, setRuleToDelete] = useState<PricingMatrixRule | null>(null);

  // Form State
  const [formData, setFormData] = useState<PricingMatrixRule>({
    id: '',
    name: '',
    cropType: 'Soja',
    terrainType: 'FLAT_GRAINS',
    pricingModel: 'PER_HECTARE',
    baseRate: 75.0,
    difficultyMultiplier: 1.0,
    minHectaresThreshold: 20,
    volumeDiscounts: [
      { minHa: 100, discountPercent: 5 },
      { minHa: 250, discountPercent: 8 },
    ],
  });

  // Custom Crop Input State (when "Outra Cultura" is chosen)
  const [customCropInput, setCustomCropInput] = useState<string>('');

  // Modal Simulator Sample Area
  const [modalSimHa, setModalSimHa] = useState<number>(150);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Find matching rule for Simulator
  const exactMatchedRule = pricingRules.find(
    r => r.cropType.toLowerCase() === simCrop.toLowerCase() && r.terrainType === simTerrain
  );

  const cropMatchedRule = pricingRules.find(
    r => r.cropType.toLowerCase() === simCrop.toLowerCase()
  ) || pricingRules[0];

  const matchedRule = exactMatchedRule || cropMatchedRule;
  const baseRate = matchedRule?.baseRate || 75.0;

  const TERRAIN_DEFAULT_FACTORS: Record<TerrainType, number> = {
    FLAT_GRAINS: 1.00,
    STEEP_SLOPE: 1.25,
    PASTURE: 1.15,
    ORCHARD_FRUIT: 1.20,
    WETLAND: 1.10,
  };

  const difficultyMult = exactMatchedRule
    ? exactMatchedRule.difficultyMultiplier
    : (TERRAIN_DEFAULT_FACTORS[simTerrain] ?? 1.0);

  const effectiveUnitRate = baseRate * difficultyMult;

  // Find volume discount
  let volumeDiscountPct = 0;
  if (matchedRule?.volumeDiscounts) {
    for (const disc of matchedRule.volumeDiscounts) {
      if (simHectares >= disc.minHa && disc.discountPercent > volumeDiscountPct) {
        volumeDiscountPct = disc.discountPercent;
      }
    }
  }

  const grossTotal = simHectares * effectiveUnitRate;
  const discountTotal = grossTotal * (volumeDiscountPct / 100);
  const netTotal = grossTotal - discountTotal;
  const netRatePerHa = simHectares > 0 ? netTotal / simHectares : 0;

  // Filtered Rules
  const filteredRules = pricingRules.filter(rule => {
    const matchesSearch = 
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.cropType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      TERRAIN_LABELS[rule.terrainType]?.label.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCrop = filterCrop === 'ALL' || rule.cropType === filterCrop;
    const matchesTerrain = filterTerrain === 'ALL' || rule.terrainType === filterTerrain;

    return matchesSearch && matchesCrop && matchesTerrain;
  });

  // Open Add Rule Modal
  const handleOpenAddModal = () => {
    setEditingRule(null);
    setCustomCropInput('');
    setFormData({
      id: `rule-${Date.now()}`,
      name: '',
      cropType: 'Soja',
      terrainType: 'FLAT_GRAINS',
      pricingModel: 'PER_HECTARE',
      baseRate: 75.0,
      difficultyMultiplier: 1.0,
      minHectaresThreshold: 20,
      volumeDiscounts: [
        { minHa: 100, discountPercent: 5 },
        { minHa: 250, discountPercent: 8 },
      ],
    });
    setIsModalOpen(true);
  };

  // Open Edit Rule Modal
  const handleOpenEditModal = (rule: PricingMatrixRule) => {
    setEditingRule(rule);
    const isStandardCrop = CROP_OPTIONS.includes(rule.cropType);
    setFormData({
      ...rule,
      cropType: isStandardCrop ? rule.cropType : 'Outra Cultura',
      volumeDiscounts: rule.volumeDiscounts ? [...rule.volumeDiscounts] : [],
    });
    setCustomCropInput(isStandardCrop ? '' : rule.cropType);
    setIsModalOpen(true);
  };

  // Duplicate Rule
  const handleDuplicateRule = (rule: PricingMatrixRule) => {
    const newRule: PricingMatrixRule = {
      ...rule,
      id: `rule-${Date.now()}`,
      name: `${rule.name} (Cópia)`,
      volumeDiscounts: rule.volumeDiscounts ? [...rule.volumeDiscounts] : [],
    };
    setPricingRules(prev => [newRule, ...prev]);
    setSimCrop(newRule.cropType);
    setSimTerrain(newRule.terrainType);
    showToast(`Regra duplicada com sucesso: "${newRule.name}"`);
  };

  // Delete Rule with System Confirmation Dialog
  const handleDeleteRule = (rule: PricingMatrixRule) => {
    showConfirm({
      title: 'Excluir Regra de Precificação',
      message: `Tem certeza que deseja remover a regra "${rule.name}"? Esta ação removerá a tarifação da tabela de preços.`,
      confirmLabel: 'Sim, Excluir',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setPricingRules(prev => prev.filter(r => r.id !== rule.id));
        showToast(`Regra "${rule.name}" removida com sucesso.`, 'info');
      }
    });
  };

  // Reset to Factory Rules with System Confirmation Dialog
  const handleResetToDefaults = () => {
    showConfirm({
      title: 'Restaurar Padrões de Fábrica',
      message: 'Tem certeza que deseja restaurar a tabela de precificação para as regras padrão de fábrica? Quaisquer alterações customizadas serão desfeitas.',
      confirmLabel: 'Sim, Restaurar',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setPricingRules(INITIAL_PRICING_RULES);
        setIsResetConfirmOpen(false);
        showToast('Tabela de precificação restaurada para as regras padrão de fábrica.', 'info');
      }
    });
  };

  // Save Rule (Add or Edit)
  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('Por favor, informe um nome descritivo para a regra.');
      return;
    }

    const effectiveCrop = (formData.cropType === 'Outra Cultura' && customCropInput.trim())
      ? customCropInput.trim()
      : formData.cropType;

    if (!effectiveCrop.trim()) {
      showToast('Por favor, especifique a cultura agrícola.');
      return;
    }

    if (formData.baseRate <= 0) {
      showToast('A tarifa base deve ser maior que zero (ex: R$ 75,00/ha).');
      return;
    }

    // Sort volume discounts by minHa ascending
    const sortedDiscounts = [...formData.volumeDiscounts].sort((a, b) => a.minHa - b.minHa);
    const cleanedRule: PricingMatrixRule = {
      ...formData,
      id: editingRule ? editingRule.id : `rule-${Date.now()}`,
      cropType: effectiveCrop,
      difficultyMultiplier: formData.difficultyMultiplier > 0 ? formData.difficultyMultiplier : 1.0,
      minHectaresThreshold: Math.max(0, formData.minHectaresThreshold || 0),
      volumeDiscounts: sortedDiscounts,
    };

    if (editingRule) {
      setPricingRules(prev => prev.map(r => r.id === editingRule.id ? cleanedRule : r));
      showToast(`Regra "${cleanedRule.name}" atualizada com sucesso!`);
    } else {
      setPricingRules(prev => [cleanedRule, ...prev]);
      showToast(`Nova regra "${cleanedRule.name}" criada com sucesso!`);
    }

    // Automatically update the simulator to use the new/edited rule
    setSimCrop(cleanedRule.cropType);
    setSimTerrain(cleanedRule.terrainType);
    setIsModalOpen(false);
  };

  // Volume Discount Helpers
  const handleAddDiscountTier = () => {
    const lastTier = formData.volumeDiscounts[formData.volumeDiscounts.length - 1];
    const newMinHa = lastTier ? lastTier.minHa + 100 : 100;
    const newPct = lastTier ? Math.min(lastTier.discountPercent + 3, 50) : 5;

    setFormData(prev => ({
      ...prev,
      volumeDiscounts: [...prev.volumeDiscounts, { minHa: newMinHa, discountPercent: newPct }],
    }));
  };

  const handleUpdateDiscountTier = (index: number, field: 'minHa' | 'discountPercent', value: number) => {
    setFormData(prev => {
      const updated = [...prev.volumeDiscounts];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, volumeDiscounts: updated };
    });
  };

  const handleRemoveDiscountTier = (index: number) => {
    showConfirm({
      title: 'Remover Faixa de Desconto',
      message: 'Tem certeza que deseja excluir esta faixa de desconto por volume?',
      confirmLabel: 'Sim, Remover',
      cancelLabel: 'Cancelar',
      isDestructive: true,
      onConfirm: () => {
        setFormData(prev => ({
          ...prev,
          volumeDiscounts: prev.volumeDiscounts.filter((_, i) => i !== index),
        }));
        showToast('Faixa de desconto removida.', 'info');
      }
    });
  };

  // Modal Live Preview Calculations
  const modalEffectiveRate = formData.baseRate * formData.difficultyMultiplier;
  let modalDiscountPct = 0;
  for (const disc of formData.volumeDiscounts) {
    if (modalSimHa >= disc.minHa && disc.discountPercent > modalDiscountPct) {
      modalDiscountPct = disc.discountPercent;
    }
  }
  const modalGross = modalSimHa * modalEffectiveRate;
  const modalDiscount = modalGross * (modalDiscountPct / 100);
  const modalNet = modalGross - modalDiscount;
  const modalNetPerHa = modalSimHa > 0 ? modalNet / modalSimHa : 0;

  // Unique list of crops from current rules + default options
  const availableCrops = Array.from(new Set([
    'Soja', 'Milho', 'Pastagem', 'Cana-de-açúcar',
    ...pricingRules.map(r => r.cropType)
  ]));

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 right-4 z-50 p-3 rounded-xl bg-emerald-950 text-emerald-100 border border-emerald-500/80 shadow-xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Matriz de Precificação & Simulador
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80">
            Tabela flexível por cultura, fator de relevo/declive e descontos escalonados por volume.
          </p>
        </div>

        {/* Admin Permission Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isAdmin ? (
            <div className="px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1.5 text-xs text-emerald-900 dark:text-emerald-200 font-bold shadow-2xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Edição Liberada (Admin)</span>
            </div>
          ) : (
            <div className="px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200 font-semibold shadow-2xs">
              <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Somente Leitura</span>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Card */}
      <div className="bg-emerald-900/90 text-white rounded-xl p-3 sm:p-4 border border-emerald-700/80 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-300" />
            <h3 className="text-xs sm:text-sm font-black tracking-tight text-white">
              Simulador Instantâneo de Orçamento
            </h3>
          </div>
          <span className="text-[10px] font-semibold text-emerald-200/80 hidden sm:inline-block">
            Cálculo em tempo real baseado na tabela vigente
          </span>
        </div>

        {/* Simulator Grid (3 Balanced Modern Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
          {/* 1. Cultura */}
          <div className="bg-emerald-950/70 p-2.5 sm:p-3 rounded-xl border border-emerald-700/60 flex flex-col justify-between space-y-1.5">
            <div>
              <label className="font-bold text-emerald-100 flex items-center gap-1 mb-1 text-xs">
                <Sprout className="w-3.5 h-3.5 text-emerald-400" />
                <span>1. Cultura Agrícola</span>
              </label>
              <select
                id="select-sim-crop"
                value={simCrop}
                onChange={(e) => setSimCrop(e.target.value)}
                className="w-full p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-600/70 text-white font-semibold cursor-pointer focus:ring-2 focus:ring-emerald-400 outline-none transition-colors text-xs"
              >
                {availableCrops.map(crop => (
                  <option key={crop} value={crop} className="bg-emerald-950 text-white">{crop}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-300/80 pt-1 border-t border-emerald-800/60">
              <span>Tarifa base:</span>
              <span className="font-mono font-bold text-white">{formatBRL(baseRate)}/ha</span>
            </div>
          </div>

          {/* 2. Tipologia de Relevo */}
          <div className="bg-emerald-950/70 p-2.5 sm:p-3 rounded-xl border border-emerald-700/60 flex flex-col justify-between space-y-1.5">
            <div>
              <label className="font-bold text-emerald-100 flex items-center gap-1 mb-1 text-xs">
                <Mountain className="w-3.5 h-3.5 text-emerald-400" />
                <span>2. Tipologia de Relevo</span>
              </label>
              <select
                id="select-sim-terrain"
                value={simTerrain}
                onChange={(e) => setSimTerrain(e.target.value as TerrainType)}
                className="w-full p-2 rounded-lg bg-emerald-900/80 hover:bg-emerald-900 border border-emerald-600/70 text-white font-semibold cursor-pointer focus:ring-2 focus:ring-emerald-400 outline-none transition-colors text-xs"
              >
                <option value="FLAT_GRAINS" className="bg-emerald-950 text-white">Plano / Planalto (1,00x)</option>
                <option value="STEEP_SLOPE" className="bg-emerald-950 text-white">Encosta Severa (1,25x)</option>
                <option value="PASTURE" className="bg-emerald-950 text-white">Pastagem c/ Tocos (1,15x)</option>
                <option value="ORCHARD_FRUIT" className="bg-emerald-950 text-white">Pomar / Fruticultura (1,20x)</option>
                <option value="WETLAND" className="bg-emerald-950 text-white">Várzea / Úmido (1,10x)</option>
              </select>
            </div>
            <div className="flex items-center justify-between text-[10px] text-emerald-300/80 pt-1 border-t border-emerald-800/60">
              <span>Fator Dificuldade:</span>
              <span className="font-mono font-bold text-emerald-300">{difficultyMult.toFixed(2).replace('.', ',')}x</span>
            </div>
          </div>

          {/* 3. Área Total a Aplicar */}
          <div className="bg-emerald-950/70 p-2.5 sm:p-3 rounded-xl border border-emerald-700/60 flex flex-col justify-between space-y-1.5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <label className="font-bold text-emerald-100 flex items-center gap-1 text-xs">
                <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                <span>3. Área a Aplicar</span>
              </label>
              {simHectares > 0 && (
                <button
                  type="button"
                  onClick={() => setSimHectares(0)}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-900/90 hover:bg-rose-900/50 text-emerald-300 hover:text-rose-200 border border-emerald-700/70 hover:border-rose-700/70 transition-all cursor-pointer"
                  title="Zerar área para 0 ha"
                >
                  Zerar
                </button>
              )}
            </div>

            {/* Stepper + Clean Input Field without Native Spinners */}
            <div className="flex items-center bg-emerald-900/90 rounded-lg border border-emerald-600/70 p-0.5 shadow-inner">
              <button
                type="button"
                onClick={() => setSimHectares(Math.max(0, simHectares - 10))}
                className="w-7 h-7 rounded bg-emerald-950/80 hover:bg-emerald-950 active:scale-95 text-emerald-300 hover:text-white flex items-center justify-center font-mono font-bold text-[10px] transition-all cursor-pointer border border-emerald-800/80"
                title="Diminuir 10 ha"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setSimHectares(Math.max(0, simHectares - 10))}
                className="hidden"
              >
                -10
              </button>
              <button
                type="button"
                onClick={() => setSimHectares(Math.max(0, simHectares - 1))}
                className="w-6 h-7 rounded bg-emerald-950/80 hover:bg-emerald-950 active:scale-95 text-emerald-300 hover:text-white flex items-center justify-center font-mono font-bold text-[10px] transition-all cursor-pointer border border-emerald-800/80 ml-0.5"
                title="Diminuir 1 ha"
              >
                -1
              </button>

              <div className="flex-1 flex items-center justify-center px-1">
                <input
                  id="input-sim-hectares-number"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={simHectares === 0 ? '' : simHectares}
                  placeholder="0"
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '');
                    const val = cleaned === '' ? 0 : Math.min(10000, parseInt(cleaned, 10) || 0);
                    setSimHectares(val);
                  }}
                  className="w-16 text-right bg-transparent text-emerald-200 font-mono font-black text-sm outline-none placeholder-emerald-600 focus:text-white"
                />
                <span className="text-emerald-400 font-mono font-bold text-[11px] ml-1 select-none">
                  ha
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSimHectares(simHectares + 1)}
                className="w-6 h-7 rounded bg-emerald-950/80 hover:bg-emerald-950 active:scale-95 text-emerald-300 hover:text-white flex items-center justify-center font-mono font-bold text-[10px] transition-all cursor-pointer border border-emerald-800/80 mr-0.5"
                title="Aumentar 1 ha"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => setSimHectares(simHectares + 10)}
                className="w-7 h-7 rounded bg-emerald-950/80 hover:bg-emerald-950 active:scale-95 text-emerald-300 hover:text-white flex items-center justify-center font-mono font-bold text-[10px] transition-all cursor-pointer border border-emerald-800/80"
                title="Aumentar 10 ha"
              >
                +10
              </button>
            </div>

            {/* Slider */}
            <input
              id="range-sim-hectares"
              type="range"
              min="0"
              max="1000"
              step="1"
              value={simHectares}
              onChange={(e) => setSimHectares(parseInt(e.target.value) || 0)}
              className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-emerald-950 rounded-lg"
            />

            {/* Quick Minimalist Chips */}
            <div className="flex items-center justify-between gap-1 pt-1 border-t border-emerald-800/60">
              <div className="flex items-center gap-1 flex-wrap">
                {[0, 20, 50, 100, 250, 500].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setSimHectares(val)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all cursor-pointer border ${
                      simHectares === val
                        ? 'bg-emerald-400 text-emerald-950 border-emerald-300 font-black'
                        : 'bg-emerald-900/70 text-emerald-300 border-emerald-800/70 hover:bg-emerald-800 hover:text-white'
                    }`}
                  >
                    {val === 0 ? '0' : `${val}ha`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSimHectares(simHectares + 50)}
                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/60 cursor-pointer transition-all shrink-0"
                title="Adicionar 50 hectares"
              >
                +50
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Volume Discount Banner if applicable */}
        {volumeDiscountPct > 0 && (
          <div className="px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
            <span className="flex items-center gap-1 font-semibold text-[11px]">
              <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              Faixa de Desconto: <strong className="text-amber-300 font-mono">-{volumeDiscountPct}%</strong>
            </span>
            <span className="font-mono font-bold text-amber-300 text-[11px]">
              Economia {formatBRL(discountTotal)}
            </span>
          </div>
        )}

        {/* Calculated Quote Box */}
        <div className="p-3 sm:p-3.5 rounded-xl bg-emerald-950/90 border border-emerald-700/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div>
            <span className="text-emerald-300/80 text-[9px] block font-semibold">Tarifa Base</span>
            <span className="text-sm sm:text-base font-black text-white font-mono">
              {formatBRL(baseRate)} / ha
            </span>
            <span className="text-[9px] text-emerald-300/70 block truncate" title={matchedRule?.name}>
              {matchedRule?.name || 'Padrão'}
            </span>
          </div>

          <div>
            <span className="text-emerald-300/80 text-[9px] block font-semibold">Multiplicador Relevo</span>
            <span className="text-sm sm:text-base font-black text-emerald-300 font-mono">
              {difficultyMult.toFixed(2).replace('.', ',')}x
            </span>
            <span className="text-[9px] text-emerald-300/70 block">
              Efetiva: {formatBRL(effectiveUnitRate)}
            </span>
          </div>

          <div>
            <span className="text-emerald-300/80 text-[9px] block font-semibold">Desconto Volume</span>
            <span className="text-sm sm:text-base font-black text-amber-300 font-mono">
              {volumeDiscountPct > 0 
                ? `-${volumeDiscountPct}%` 
                : simHectares === 0 
                  ? 'Aguardando área'
                  : 'Sem desconto'}
            </span>
            <span className="text-[9px] text-emerald-300/70 block">
              {volumeDiscountPct > 0 
                ? `≥ ${simHectares} ha` 
                : simHectares === 0 
                  ? 'Defina a área' 
                  : 'Tarifa cheia'}
            </span>
          </div>

          <div>
            <span className="text-emerald-300/80 text-[9px] block font-semibold">Total Líquido</span>
            <span className="text-base sm:text-lg lg:text-xl font-black text-emerald-300 font-mono block">
              {formatBRL(netTotal)}
            </span>
            <span className="text-[9px] text-emerald-200/70 font-semibold">
              {simHectares === 0 ? '(0 ha selecionados)' : `(${formatBRL(netRatePerHa)}/ha final)`}
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Matrix Table Section */}
      <div className="bg-emerald-50/70 dark:bg-[#072a1e]/90 border border-emerald-200/80 dark:border-emerald-800/80 rounded-xl p-3 sm:p-4 shadow-2xs space-y-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-2 border-b border-emerald-200/60 dark:border-emerald-800/60">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-emerald-950 dark:text-white">
                Tabela Vigente de Preços e Regras de Precificação
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                {pricingRules.length} {pricingRules.length === 1 ? 'regra' : 'regras'}
              </span>
            </div>
            <p className="text-[10px] text-emerald-800/70 dark:text-emerald-300/70 mt-0.5">
              {isAdmin 
                ? 'Administradores podem criar, editar, duplicar tarifas e calibrar faixas de desconto por volume.'
                : 'Consulte os valores praticados para pulverização aeroagrícola com drones.'}
            </p>
          </div>

          {/* Admin Table Actions */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 flex-wrap self-start md:self-auto">
              <button
                id="btn-reset-pricing-rules"
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Restaurar tabela padrão original"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restaurar Padrões</span>
              </button>

              <button
                id="btn-add-pricing-rule"
                type="button"
                onClick={handleOpenAddModal}
                className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-transform active:scale-95 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Regra</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter / Search Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-emerald-700/70 dark:text-emerald-300/70" />
            <input
              id="input-search-pricing-rule"
              type="text"
              placeholder="Buscar por cultura, nome da regra ou relevo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 outline-none focus:ring-2 focus:ring-emerald-500 font-medium shadow-2xs text-xs"
            />
          </div>

          <div>
            <select
              id="select-filter-crop"
              value={filterCrop}
              onChange={(e) => setFilterCrop(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer shadow-2xs text-xs"
            >
              <option value="ALL">Todas as Culturas</option>
              {availableCrops.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              id="select-filter-terrain"
              value={filterTerrain}
              onChange={(e) => setFilterTerrain(e.target.value)}
              className="w-full py-1.5 px-2.5 rounded-lg bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 outline-none focus:ring-2 focus:ring-emerald-500 font-medium cursor-pointer shadow-2xs text-xs"
            >
              <option value="ALL">Todos os Tipos de Relevo</option>
              {Object.entries(TERRAIN_LABELS).map(([key, value]) => (
                <option key={key} value={key}>{value.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Rules Table */}
        <div className="overflow-x-auto rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
          <table className="w-full text-left text-[11px] sm:text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-100/60 dark:bg-emerald-950/60 border-b border-emerald-200/80 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200">
                <th className="py-2 px-3 font-black">Cultura & Regra Comercial</th>
                <th className="py-2 px-2 font-black">Modelo</th>
                <th className="py-2 px-2 font-black">Tarifa Base</th>
                <th className="py-2 px-2 font-black">Relevo / Fator</th>
                <th className="py-2 px-2 font-black">Área Mínima</th>
                <th className="py-2 px-2 font-black">Escalonamento por Volume</th>
                {isAdmin && <th className="py-2 px-3 font-black text-right">Ações (Admin)</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-200/60 dark:divide-emerald-800/60 bg-white/60 dark:bg-[#041c14]/40">
              {filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-6 text-center text-emerald-800/70 dark:text-emerald-300/70">
                    <p className="font-semibold text-xs">Nenhuma regra encontrada para os filtros aplicados.</p>
                    {isAdmin && (
                      <button
                        onClick={handleOpenAddModal}
                        className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Cadastrar Regra de Preço</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => {
                  const terrainInfo = TERRAIN_LABELS[rule.terrainType] || { label: rule.terrainType, factor: '1.0x' };
                  return (
                    <tr 
                      key={rule.id} 
                      className="hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 transition-colors"
                    >
                      {/* Name & Crop */}
                      <td className="py-2 px-3 font-bold text-emerald-950 dark:text-white">
                        <div className="flex items-start gap-1.5">
                          <div className="w-6 h-6 rounded bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300/70 dark:border-emerald-700 flex items-center justify-center text-emerald-700 dark:text-emerald-400 shrink-0 mt-0.5">
                            <Sprout className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <span className="font-black text-emerald-950 dark:text-white block text-xs">
                              {rule.name}
                            </span>
                            <div className="flex items-center gap-1 mt-0.5">
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200/70 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200">
                                {rule.cropType}
                              </span>
                              <span className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70">
                                ID: {rule.id}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Pricing Model */}
                      <td className="py-2 px-2 text-emerald-800/90 dark:text-emerald-300/90 font-medium">
                        {PRICING_MODEL_LABELS[rule.pricingModel] || rule.pricingModel}
                      </td>

                      {/* Base Rate */}
                      <td className="py-2 px-2 font-mono font-black text-emerald-700 dark:text-emerald-400 text-xs sm:text-sm">
                        {formatBRL(rule.baseRate)}
                      </td>

                      {/* Terrain Multiplier */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Mountain className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-mono font-bold text-emerald-950 dark:text-white">
                            {rule.difficultyMultiplier.toFixed(2).replace('.', ',')}x
                          </span>
                        </div>
                        <span className="text-[9px] text-emerald-700/70 dark:text-emerald-400/70 block">
                          {terrainInfo.label}
                        </span>
                      </td>

                      {/* Min Threshold */}
                      <td className="py-2 px-2 font-mono font-semibold text-emerald-900 dark:text-emerald-200">
                        {rule.minHectaresThreshold ? `${rule.minHectaresThreshold} ha` : 'Sem mínimo'}
                      </td>

                      {/* Volume Discounts */}
                      <td className="py-2 px-2 text-emerald-800 dark:text-emerald-300">
                        {rule.volumeDiscounts && rule.volumeDiscounts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {rule.volumeDiscounts.map((d, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700/70"
                              >
                                ≥{d.minHa}ha: -{d.discountPercent}%
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-emerald-700/60 dark:text-emerald-400/60 text-[10px] italic">
                            Sem desconto
                          </span>
                        )}
                      </td>

                      {/* Admin Actions */}
                      {isAdmin && (
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              id={`btn-edit-rule-${rule.id}`}
                              type="button"
                              onClick={() => handleOpenEditModal(rule)}
                              className="p-1 rounded text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer"
                              title="Editar Regra de Preço"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn-duplicate-rule-${rule.id}`}
                              type="button"
                              onClick={() => handleDuplicateRule(rule)}
                              className="p-1 rounded text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/70 dark:hover:bg-emerald-900/80 transition-colors cursor-pointer"
                              title="Duplicar Regra"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              id={`btn-delete-rule-${rule.id}`}
                              type="button"
                              onClick={() => handleDeleteRule(rule)}
                              className="p-1 rounded text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/70 transition-colors cursor-pointer"
                              title="Excluir Regra"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Add / Edit Pricing Rule */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#041c14]/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-emerald-50 dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 rounded-3xl shadow-2xl p-6 sm:p-8 my-auto max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/80 dark:border-emerald-800/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-emerald-950 dark:text-white">
                    {editingRule ? 'Editar Regra de Precificação' : 'Nova Regra de Precificação'}
                  </h3>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Defina cultura, tarifas, multiplicador de declive e escalonamento por volume.
                  </p>
                </div>
              </div>
              <button
                id="btn-close-pricing-modal"
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-5 text-xs">
              {/* Rule Name */}
              <div>
                <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                  Nome Descritivo da Regra Comercial *
                </label>
                <input
                  id="input-rule-name"
                  type="text"
                  required
                  placeholder="Ex: Soja / Grãos em Relevo Plano ou Café em Declive Severo"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 placeholder:text-slate-400 dark:placeholder:text-emerald-400/60 font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                />
              </div>

              {/* Crop & Terrain */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                    Cultura Agrícola
                  </label>
                  <select
                    id="input-rule-crop"
                    value={formData.cropType}
                    onChange={(e) => setFormData(prev => ({ ...prev, cropType: e.target.value }))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {CROP_OPTIONS.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                  {formData.cropType === 'Outra Cultura' && (
                    <input
                      id="input-rule-custom-crop"
                      type="text"
                      placeholder="Digite a cultura (ex: Girassol, Eucalipto)"
                      value={customCropInput}
                      onChange={(e) => setCustomCropInput(e.target.value)}
                      className="mt-2 w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                    Tipologia de Relevo / Terreno
                  </label>
                  <select
                    id="input-rule-terrain"
                    value={formData.terrainType}
                    onChange={(e) => {
                      const terrain = e.target.value as TerrainType;
                      // Auto suggest multiplier based on terrain if standard
                      const defaultMultiplier = terrain === 'STEEP_SLOPE' ? 1.25 : terrain === 'PASTURE' ? 1.15 : terrain === 'ORCHARD_FRUIT' ? 1.20 : terrain === 'WETLAND' ? 1.10 : 1.00;
                      setFormData(prev => ({ 
                        ...prev, 
                        terrainType: terrain,
                        difficultyMultiplier: prev.difficultyMultiplier === 1.0 ? defaultMultiplier : prev.difficultyMultiplier
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    {Object.entries(TERRAIN_LABELS).map(([key, val]) => (
                      <option key={key} value={key}>{val.label} ({val.factor})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pricing Model, Base Rate, Difficulty Multiplier, Min Hectares */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                    Modelo de Cobrança
                  </label>
                  <select
                    id="input-rule-pricing-model"
                    value={formData.pricingModel}
                    onChange={(e) => setFormData(prev => ({ ...prev, pricingModel: e.target.value as PricingModel }))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-2xs"
                  >
                    <option value="PER_HECTARE">Por Hectare (R$/ha)</option>
                    <option value="PER_FLIGHT_HOUR">Por Hora de Voo (R$/h)</option>
                    <option value="PER_LITER_MIX">Por Litro de Calda (R$/L)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                    Tarifa Base (R$) *
                  </label>
                  <input
                    id="input-rule-base-rate"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={formData.baseRate || ''}
                    placeholder="0"
                    onChange={(e) => setFormData(prev => ({ ...prev, baseRate: parseFloat(e.target.value) || 0 }))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                    Multiplicador Relevo (Fator)
                  </label>
                  <input
                    id="input-rule-difficulty-multiplier"
                    type="number"
                    step="any"
                    min="0"
                    max="10.0"
                    required
                    value={formData.difficultyMultiplier || ''}
                    placeholder="1.0"
                    onChange={(e) => setFormData(prev => ({ ...prev, difficultyMultiplier: parseFloat(e.target.value) || 1.0 }))}
                    className="w-full p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Minimum Hectares Threshold */}
              <div>
                <label className="font-bold text-emerald-950 dark:text-emerald-100 block mb-1">
                  Franquia / Área Mínima Faturável (ha)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="input-rule-min-threshold"
                    type="number"
                    min="0"
                    step="any"
                    value={formData.minHectaresThreshold || ''}
                    placeholder="0"
                    onChange={(e) => setFormData(prev => ({ ...prev, minHectaresThreshold: parseFloat(e.target.value) || 0 }))}
                    className="w-36 p-2.5 rounded-xl bg-white dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-600 text-emerald-950 dark:text-emerald-50 font-mono font-bold outline-none focus:ring-2 focus:ring-emerald-500 shadow-2xs"
                  />
                  <span className="text-emerald-800/80 dark:text-emerald-300/80 text-[11px]">
                    Aplicações menores que este valor cobrarão a tarifa proporcional mínima contratada.
                  </span>
                </div>
              </div>

              {/* Volume Discount Tiers Manager */}
              <div className="p-4 rounded-2xl bg-emerald-100/60 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-black text-emerald-950 dark:text-white">
                      Escalonamento de Descontos por Volume Acumulado
                    </h4>
                  </div>
                  <button
                    id="btn-add-discount-tier"
                    type="button"
                    onClick={handleAddDiscountTier}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Faixa</span>
                  </button>
                </div>

                <p className="text-[11px] text-emerald-800/70 dark:text-emerald-300/70">
                  Defina porcentagens de desconto progressivo para fidelização e grandes talhões.
                </p>

                {formData.volumeDiscounts.length === 0 ? (
                  <div className="py-3 text-center text-emerald-700/70 dark:text-emerald-400/70 italic bg-white/50 dark:bg-[#041c14]/50 rounded-xl">
                    Nenhum desconto configurado para esta regra (cobrança com preço fixo).
                  </div>
                ) : (
                  <div className="space-y-2">
                    {formData.volumeDiscounts.map((tier, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/80 dark:bg-[#041c14]/80 p-2.5 rounded-xl border border-emerald-200/80 dark:border-emerald-800">
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">
                          Faixa {idx + 1}: A partir de
                        </span>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          value={tier.minHa || ''}
                          placeholder="0"
                          onChange={(e) => handleUpdateDiscountTier(idx, 'minHa', parseFloat(e.target.value) || 0)}
                          className="w-24 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-white font-mono font-bold text-center"
                        />
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">ha → Desconto de</span>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="any"
                          value={tier.discountPercent || ''}
                          placeholder="0"
                          onChange={(e) => handleUpdateDiscountTier(idx, 'discountPercent', parseFloat(e.target.value) || 0)}
                          className="w-20 p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-white font-mono font-bold text-center"
                        />
                        <span className="font-bold text-emerald-900 dark:text-emerald-200 text-[11px]">%</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveDiscountTier(idx)}
                          className="p-1.5 ml-auto rounded-lg text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                          title="Remover Faixa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Live Preview Box inside Modal */}
              <div className="p-4 rounded-2xl bg-emerald-950 text-white border border-emerald-700/80 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Simulação em Tempo Real da Regra:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-200/80 font-mono font-bold">{modalSimHa} ha:</span>
                    <input
                      type="range"
                      min="0"
                      max="500"
                      step="5"
                      value={modalSimHa}
                      onChange={(e) => setModalSimHa(parseInt(e.target.value) || 0)}
                      className="w-24 accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-emerald-800">
                  <div>
                    <span className="text-emerald-300/70 text-[10px] block">Tarifa Efetiva</span>
                    <span className="font-mono font-bold text-white">
                      {formatBRL(modalEffectiveRate)}/ha
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-300/70 text-[10px] block">Desconto Aplicado</span>
                    <span className="font-mono font-bold text-amber-300">
                      {modalDiscountPct > 0 ? `-${modalDiscountPct}% (${formatBRL(modalDiscount)})` : 'Sem desconto'}
                    </span>
                  </div>
                  <div>
                    <span className="text-emerald-300/70 text-[10px] block">Valor Total Líquido</span>
                    <span className="font-mono font-black text-emerald-300 text-sm">
                      {formatBRL(modalNet)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  id="btn-cancel-pricing-modal"
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  id="btn-save-pricing-rule"
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-transform active:scale-95 flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRule ? 'Salvar Alterações' : 'Criar Nova Regra'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Delete Rule */}
      {ruleToDelete && (
        <div className="fixed inset-0 z-50 bg-[#041c14]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-emerald-50 dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950 dark:text-white">
                  Excluir Regra de Precificação?
                </h3>
                <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-900 dark:text-emerald-200 bg-white/80 dark:bg-[#041c14]/80 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 font-semibold">
              Regra: <span className="font-mono text-emerald-700 dark:text-emerald-400">{ruleToDelete.name}</span> ({formatBRL(ruleToDelete.baseRate)}/ha)
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                id="btn-cancel-delete-rule"
                type="button"
                onClick={() => setRuleToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-delete-rule"
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Excluir Regra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL: Reset to Defaults */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-[#041c14]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-emerald-50 dark:bg-[#072a1e] border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-emerald-950 dark:text-white">
                  Restaurar Padrões de Fábrica?
                </h3>
                <p className="text-xs text-emerald-800/70 dark:text-emerald-300/70">
                  Todas as regras personalizadas serão substituídas pela tabela base oficial.
                </p>
              </div>
            </div>

            <p className="text-xs text-emerald-900 dark:text-emerald-200">
              Deseja recarregar as 4 regras padrão de Soja, Milho Safrinha, Pastagem e Cana-de-açúcar?
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                id="btn-cancel-reset-pricing"
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-confirm-reset-pricing"
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                Confirmar Restauração
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
