import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Trash2, 
  Printer, 
  Mail, 
  Share2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  DollarSign, 
  MapPin, 
  Droplets, 
  Calendar, 
  ArrowLeft,
  Briefcase,
  Layers,
  FileCheck2,
  TrendingUp,
  Info,
  AlertTriangle,
  Pencil
} from 'lucide-react';
import { 
  UserProfile, 
  WhiteLabelTheme, 
  SprayQuotation, 
  ClientProducer, 
  FarmPlot, 
  AgriculturalDrone, 
  ServiceOrder, 
  PricingModel, 
  QuotationStatus,
  SprayQuotationItem,
  SprayQuotationProduct
} from '../types';
import { ChemicalLeafletModal } from './ChemicalLeafletModal';
import { BrandLogo } from './BrandLogo';
import { formatDecimal, formatBRL, formatHectares, formatNumber, formatPercent, toSafeNumber } from '../utils/formatters';

interface QuotationsViewProps {
  currentUser: UserProfile;
  theme: WhiteLabelTheme;
  quotations: SprayQuotation[];
  setQuotations: React.Dispatch<React.SetStateAction<SprayQuotation[]>>;
  clients: ClientProducer[];
  plots: FarmPlot[];
  drones: AgriculturalDrone[];
  orders: ServiceOrder[];
  setOrders: React.Dispatch<React.SetStateAction<ServiceOrder[]>>;
  onNavigate: (view: string) => void;
}

export const QuotationsView: React.FC<QuotationsViewProps> = ({
  currentUser,
  theme,
  quotations,
  setQuotations,
  clients,
  plots,
  drones,
  orders,
  setOrders,
  onNavigate
}) => {
  // Navigation tabs or active sub-view
  const [activeTab, setActiveTab] = useState<QuotationStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuotation, setSelectedQuotation] = useState<SprayQuotation | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingQuotation, setEditingQuotation] = useState<SprayQuotation | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // New/Edit form state
  const [formData, setFormData] = useState({
    clientId: '',
    clientName: '',
    clientCpfCnpj: '',
    clientPhone: '',
    clientEmail: '',
    farmName: '',
    cityState: '',
    crop: 'Soja',
    targetPestOrGoal: '',
    totalHectares: 50,
    droneModelSuggested: drones[0]?.modelName || 'DJI Agras T40',
    pricingModel: 'PER_HECTARE' as PricingModel,
    baseRatePerHa: 80,
    displacementFee: 0,
    discountPercent: 0,
    paymentTerms: '50% de entrada e 50% após a conclusão dos serviços.',
    validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days
    notes: 'Preço sujeito a alteração caso ocorram mudanças severas nas condições do terreno ou clima que atrasem a equipe.',
  });

  const [formItems, setFormItems] = useState<Omit<SprayQuotationItem, 'id'>[]>([
    { description: 'Pulverização aérea automatizada com drone', hectares: 50, ratePerHa: 80, subtotal: 4000, crop: 'Soja' }
  ]);

  const [formProducts, setFormProducts] = useState<Omit<SprayQuotationProduct, 'id'>[]>([]);

  // Start creating new blank quotation
  const handleStartNew = () => {
    setEditingQuotation(null);
    setFormData({
      clientId: '',
      clientName: '',
      clientCpfCnpj: '',
      clientPhone: '',
      clientEmail: '',
      farmName: '',
      cityState: '',
      crop: 'Soja',
      targetPestOrGoal: '',
      totalHectares: 50,
      droneModelSuggested: drones[0]?.modelName || 'DJI Agras T40',
      pricingModel: 'PER_HECTARE' as PricingModel,
      baseRatePerHa: 80,
      displacementFee: 0,
      discountPercent: 0,
      paymentTerms: '50% de entrada e 50% após a conclusão dos serviços.',
      validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Preço sujeito a alteração caso ocorram mudanças severas nas condições do terreno ou clima que atrasem a equipe.',
    });
    setFormItems([
      { description: 'Pulverização aérea automatizada com drone', hectares: 50, ratePerHa: 80, subtotal: 4000, crop: 'Soja' }
    ]);
    setFormProducts([]);
    setIsCreating(true);
    setSelectedQuotation(null);
  };

  // Start editing existing quotation
  const handleStartEdit = (q: SprayQuotation) => {
    setEditingQuotation(q);
    setFormData({
      clientId: q.clientId || '',
      clientName: q.clientName || '',
      clientCpfCnpj: q.clientCpfCnpj || '',
      clientPhone: q.clientPhone || '',
      clientEmail: q.clientEmail || '',
      farmName: q.farmName || '',
      cityState: q.cityState || '',
      crop: q.crop || 'Soja',
      targetPestOrGoal: q.targetPestOrGoal || '',
      totalHectares: q.totalHectares || 50,
      droneModelSuggested: q.droneModelSuggested || drones[0]?.modelName || 'DJI Agras T40',
      pricingModel: q.pricingModel || 'PER_HECTARE',
      baseRatePerHa: q.baseRatePerHa || 80,
      displacementFee: q.displacementFee || 0,
      discountPercent: q.discountPercent || 0,
      paymentTerms: q.paymentTerms || '50% de entrada e 50% após a conclusão dos serviços.',
      validUntil: q.validUntil || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: q.notes || '',
    });

    setFormItems(
      q.items && q.items.length > 0
        ? q.items.map(i => ({
            description: i.description,
            hectares: i.hectares,
            ratePerHa: i.ratePerHa,
            subtotal: i.subtotal,
            crop: i.crop || q.crop
          }))
        : [{
            description: `Pulverização aérea automatizada na cultura de ${q.crop}`,
            hectares: q.totalHectares,
            ratePerHa: q.baseRatePerHa,
            subtotal: q.totalHectares * q.baseRatePerHa,
            crop: q.crop
          }]
    );

    setFormProducts(
      q.products && q.products.length > 0
        ? q.products.map(p => ({
            productName: p.productName,
            dosePerHa: p.dosePerHa,
            doseUnit: p.doseUnit,
            totalQuantityNeeded: p.totalQuantityNeeded,
            unitPrice: p.unitPrice,
            totalCost: p.totalCost,
            suppliedByCompany: p.suppliedByCompany
          }))
        : []
    );

    setIsCreating(true);
    setSelectedQuotation(null);
  };
  
  // Product adding helpers
  const [newProdName, setNewProdName] = useState('');
  const [newProdDose, setNewProdDose] = useState<string | number>('0,2');
  const [newProdUnit, setNewProdUnit] = useState('L/ha');
  const [newProdPrice, setNewProdPrice] = useState<string | number>('50,00');
  const [newProdSupplied, setNewProdSupplied] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [productSuccessMsg, setProductSuccessMsg] = useState<string | null>(null);

  // Quick preset products for instant selection
  const PRODUCT_PRESETS = [
    { name: 'Espalhante Siliconado Organosilicone', dose: 0.05, unit: 'L/ha', price: 90 },
    { name: 'Óleo Mineral Antideriva Especial', dose: 0.5, unit: 'L/ha', price: 35 },
    { name: 'Redutor de Deriva & Anti-espuma', dose: 0.1, unit: 'L/ha', price: 65 },
    { name: 'Condicionador de Calda & Sequestrante', dose: 0.1, unit: 'L/ha', price: 45 },
    { name: 'Fertilizante Foliar Boro + Zinco', dose: 0.5, unit: 'L/ha', price: 40 },
  ];

  // Filter & Stats calculation
  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = q.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          q.farmName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          q.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'ALL' || q.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const totalQuotedVal = quotations.reduce((acc, q) => acc + q.totalValue, 0);
  const approvedQuotations = quotations.filter(q => q.status === 'APPROVED' || q.status === 'CONVERTED');
  const totalApprovedVal = approvedQuotations.reduce((acc, q) => acc + q.totalValue, 0);
  const conversionRate = quotations.length ? Math.round((approvedQuotations.length / quotations.length) * 100) : 0;
  const pendingCount = quotations.filter(q => q.status === 'SENT' || q.status === 'DRAFT').length;

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (client) {
      // Find possible plots to auto-suggest
      const clientPlots = plots.filter(p => p.clientName === client.name);
      const defaultFarm = client.farmNames[0] || '';
      const defaultCity = clientPlots[0]?.cityState || client.cityState || '';
      const totalHa = clientPlots.reduce((acc, p) => acc + p.hectares, 0) || 50;

      setFormData(prev => ({
        ...prev,
        clientId: client.id,
        clientName: client.name,
        clientCpfCnpj: client.cpfCnpj,
        clientPhone: client.phone,
        clientEmail: client.email,
        farmName: defaultFarm,
        cityState: defaultCity,
        totalHectares: totalHa,
      }));

      // Update current form items
      setFormItems([{
        description: `Serviço de pulverização agrícola na cultura de ${formData.crop}`,
        hectares: totalHa,
        ratePerHa: formData.baseRatePerHa,
        subtotal: totalHa * formData.baseRatePerHa,
        crop: formData.crop
      }]);
    }
  };

  const handleApplyPreset = (preset: typeof PRODUCT_PRESETS[0], autoInclude = false) => {
    setNewProdName(preset.name);
    setNewProdDose(formatDecimal(preset.dose, 2));
    setNewProdUnit(preset.unit);
    setNewProdPrice(formatDecimal(preset.price, 2));
    setProductError(null);

    if (autoInclude) {
      const ha = toSafeNumber(formData.totalHectares) || 1;
      const totalQty = ha * preset.dose;
      const totalCost = totalQty * preset.price;

      setFormProducts(prev => [
        ...prev,
        {
          productName: preset.name,
          dosePerHa: preset.dose,
          doseUnit: preset.unit,
          totalQuantityNeeded: totalQty,
          unitPrice: preset.price,
          totalCost: totalCost,
          suppliedByCompany: true
        }
      ]);
      setProductSuccessMsg(`Insumo "${preset.name}" incluído automaticamente!`);
      setTimeout(() => setProductSuccessMsg(null), 3500);
      setNewProdName('');
    }
  };

  const handleAddProduct = (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let trimmedName = newProdName.trim();
    if (!trimmedName) {
      // Default to generic insumo if user clicks without typing name
      trimmedName = `Insumo / Adjuvante #${formProducts.length + 1}`;
    }

    const dose = toSafeNumber(newProdDose);
    if (dose <= 0) {
      setProductError('Por favor, informe uma dose válida por hectare (ex: 0,2 ou 0.5).');
      return;
    }

    const price = toSafeNumber(newProdPrice);
    if (price < 0) {
      setProductError('O preço unitário não pode ser negativo.');
      return;
    }

    setProductError(null);
    const ha = toSafeNumber(formData.totalHectares) || 1;
    const totalQty = ha * dose;
    const totalCost = totalQty * price;

    setFormProducts(prev => [
      ...prev,
      {
        productName: trimmedName,
        dosePerHa: dose,
        doseUnit: newProdUnit || 'L/ha',
        totalQuantityNeeded: totalQty,
        unitPrice: price,
        totalCost: totalCost,
        suppliedByCompany: newProdSupplied
      }
    ]);

    setProductSuccessMsg(`Insumo "${trimmedName}" incluído com sucesso!`);
    setTimeout(() => setProductSuccessMsg(null), 3500);

    // Reset fields for next entry
    setNewProdName('');
    setNewProdDose('0,2');
    setNewProdPrice('0,00');
  };

  const handleRemoveProduct = (index: number) => {
    setFormProducts(prev => prev.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const ha = Number(formData.totalHectares) || 0;
    const subtotalServices = formItems.reduce((acc, item) => acc + item.subtotal, 0);
    const subtotalProducts = formProducts.reduce((acc, prod) => {
      if (!prod.suppliedByCompany) return acc;
      const totalQty = ha * prod.dosePerHa;
      return acc + (totalQty * prod.unitPrice);
    }, 0);
    const baseTotal = subtotalServices + subtotalProducts + Number(formData.displacementFee || 0);
    
    let discountValue = 0;
    if (formData.discountPercent > 0) {
      discountValue = (baseTotal * formData.discountPercent) / 100;
    }

    const totalValue = Math.max(0, baseTotal - discountValue);

    return {
      subtotalServices,
      subtotalProducts,
      discountValue,
      totalValue
    };
  };

  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert('Selecione um cliente.');
      return;
    }

    const totals = calculateTotals();

    if (editingQuotation) {
      const updatedQuotation: SprayQuotation = {
        ...editingQuotation,
        clientId: formData.clientId,
        clientName: formData.clientName,
        clientCpfCnpj: formData.clientCpfCnpj,
        clientPhone: formData.clientPhone,
        clientEmail: formData.clientEmail,
        farmName: formData.farmName,
        cityState: formData.cityState,
        crop: formData.crop,
        targetPestOrGoal: formData.targetPestOrGoal || 'Controle Fitossanitário Geral',
        totalHectares: formData.totalHectares,
        droneModelSuggested: formData.droneModelSuggested,
        pricingModel: formData.pricingModel,
        baseRatePerHa: formData.baseRatePerHa,
        subtotalServices: totals.subtotalServices,
        subtotalProducts: totals.subtotalProducts,
        displacementFee: Number(formData.displacementFee),
        discountPercent: Number(formData.discountPercent),
        discountValue: totals.discountValue,
        totalValue: totals.totalValue,
        paymentTerms: formData.paymentTerms,
        validUntil: formData.validUntil,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
        items: formItems.map((item, idx) => ({ ...item, id: (item as any).id || `item-${idx}` })),
        products: formProducts.map((prod, idx) => {
          const qty = (Number(formData.totalHectares) || 0) * prod.dosePerHa;
          const cost = qty * prod.unitPrice;
          return {
            ...prod,
            id: (prod as any).id || `prod-${idx}`,
            totalQuantityNeeded: qty,
            totalCost: cost
          };
        })
      };

      setQuotations(prev => prev.map(q => q.id === editingQuotation.id ? updatedQuotation : q));
      setIsCreating(false);
      setEditingQuotation(null);
      setSelectedQuotation(updatedQuotation);
      return;
    }

    const code = `ORC-${new Date().getFullYear()}-${String(quotations.length + 1).padStart(3, '0')}`;

    const newQuotation: SprayQuotation = {
      id: `orc-${Date.now()}`,
      code,
      clientId: formData.clientId,
      clientName: formData.clientName,
      clientCpfCnpj: formData.clientCpfCnpj,
      clientPhone: formData.clientPhone,
      clientEmail: formData.clientEmail,
      farmName: formData.farmName,
      cityState: formData.cityState,
      crop: formData.crop,
      targetPestOrGoal: formData.targetPestOrGoal || 'Controle Fitossanitário Geral',
      totalHectares: formData.totalHectares,
      droneModelSuggested: formData.droneModelSuggested,
      pricingModel: formData.pricingModel,
      baseRatePerHa: formData.baseRatePerHa,
      subtotalServices: totals.subtotalServices,
      subtotalProducts: totals.subtotalProducts,
      displacementFee: Number(formData.displacementFee),
      discountPercent: Number(formData.discountPercent),
      discountValue: totals.discountValue,
      totalValue: totals.totalValue,
      paymentTerms: formData.paymentTerms,
      validUntil: formData.validUntil,
      status: 'DRAFT',
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      items: formItems.map((item, idx) => ({ ...item, id: `item-${idx}` })),
      products: formProducts.map((prod, idx) => {
        const qty = (Number(formData.totalHectares) || 0) * prod.dosePerHa;
        const cost = qty * prod.unitPrice;
        return {
          ...prod,
          id: `prod-${idx}`,
          totalQuantityNeeded: qty,
          totalCost: cost
        };
      })
    };

    setQuotations(prev => [newQuotation, ...prev]);
    setIsCreating(false);
    setSelectedQuotation(newQuotation);
  };

  const handleUpdateStatus = (id: string, newStatus: QuotationStatus) => {
    setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, updatedAt: new Date().toISOString() } : q));
    if (selectedQuotation && selectedQuotation.id === id) {
      setSelectedQuotation(prev => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null);
    }
  };

  const handleSendSimulated = (q: SprayQuotation) => {
    handleUpdateStatus(q.id, 'SENT');
    alert(`Orçamento ${q.code} enviado com sucesso por simulação de e-mail e WhatsApp para ${q.clientName}!`);
  };

  const handleConvertToOS = (q: SprayQuotation) => {
    if (q.status === 'CONVERTED') return;

    // We find a matching plot
    const matchingPlot = plots.find(p => p.clientName === q.clientName && p.farmName === q.farmName) || plots[0];
    const matchingDrone = drones.find(d => d.modelName === q.droneModelSuggested) || drones[0];

    const newOSCode = `OS-2026-${String(orders.length + 42).padStart(3, '0')}`;

    const newOS: ServiceOrder = {
      id: `os-${Date.now()}`,
      code: newOSCode,
      clientId: q.clientId,
      clientName: q.clientName,
      farmName: q.farmName,
      plotId: matchingPlot?.id || 'plot-1',
      plotName: matchingPlot?.name || 'Talhão Principal',
      crop: q.crop,
      targetHectares: q.totalHectares,
      sprayedHectares: 0,
      targetPestOrGoal: q.targetPestOrGoal,
      status: 'SCHEDULED',
      scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Day after tomorrow
      sprayRateLHa: 10,
      droneId: matchingDrone?.id || 'drone-1',
      droneModel: matchingDrone?.modelName || 'DJI Agras T40',
      droneAnac: matchingDrone?.anacPrefix || 'PP-AGR-01',
      pilotId: 'pilot-1',
      pilotName: 'Cmdt. Diego Santos',
      assistantId: 'assistant-1',
      assistantName: 'Lucas Mendes',
      pricingModel: q.pricingModel,
      baseRatePerHa: q.baseRatePerHa,
      totalGrossValue: q.totalValue,
      pilotCommission: q.totalHectares * 8, // fallback commission calculation
      assistantCommission: q.totalHectares * 3,
      weatherSafeApproved: false,
      mixPreparedApproved: false,
      digitalSigned: false,
      startTime: '07:00',
      endTime: '11:00',
      cityState: q.cityState,
      notes: q.notes
    };

    setOrders(prev => [newOS, ...prev]);
    setQuotations(prev => prev.map(item => item.id === q.id ? { ...item, status: 'CONVERTED', convertedOSCode: newOSCode, updatedAt: new Date().toISOString() } : item));
    
    if (selectedQuotation && selectedQuotation.id === q.id) {
      setSelectedQuotation(prev => prev ? { ...prev, status: 'CONVERTED', convertedOSCode: newOSCode } : null);
    }

    alert(`Sucesso! O Orçamento ${q.code} foi aprovado e convertido para a Ordem de Serviço ${newOSCode} agendada.`);
  };

  const activeTotals = calculateTotals();

  return (
    <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-150">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div>
          <h1 className="text-base sm:text-lg lg:text-xl font-black tracking-tight text-emerald-950 dark:text-white flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Orçamentos de Pulverização
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-800/80 dark:text-emerald-300/80 font-medium">
            Elabore propostas comerciais, inclua taxas de deslocamento e insumos, e envie para aprovação.
          </p>
        </div>
        
        {!isCreating && !selectedQuotation && (
          <button
            onClick={handleStartNew}
            className="px-3 py-1.5 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Orçamento</span>
          </button>
        )}
      </div>

      {/* METRIC SUMMARIES */}
      {!isCreating && !selectedQuotation && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Total Orçado</span>
              <div className="w-6 h-6 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                {formatBRL(totalQuotedVal)}
              </span>
              <p className="text-[9px] text-slate-400 truncate">Receita total enviada</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Fechados</span>
              <div className="w-6 h-6 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <FileCheck2 className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                {formatBRL(totalApprovedVal)}
              </span>
              <p className="text-[9px] text-emerald-600 font-semibold truncate">Convertidos em receita</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Conversão</span>
              <div className="w-6 h-6 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400">
                {formatPercent(conversionRate, 0)}
              </span>
              <p className="text-[9px] text-slate-400 truncate">Taxa de aprovação</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 p-2.5 sm:p-3 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">Aguardando</span>
              <div className="w-6 h-6 rounded-md bg-emerald-100/80 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Layers className="w-3 h-3" />
              </div>
            </div>
            <div className="mt-1">
              <span className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400">
                {formatDecimal(pendingCount, 0)}
              </span>
              <p className="text-[9px] text-slate-400 truncate">Enviados / Rascunhos</p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 1: CREATOR FORM */}
      {isCreating && (
        <form onSubmit={handleSaveQuotation} className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              {editingQuotation ? (
                <>
                  <Pencil className="w-5 h-5 text-emerald-600" />
                  Editar Orçamento <span className="font-mono text-emerald-600 dark:text-emerald-400">{editingQuotation.code}</span>
                </>
              ) : (
                <>
                  <Briefcase className="w-5 h-5 text-emerald-600" />
                  Elaborar Novo Orçamento
                </>
              )}
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setEditingQuotation(null);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          {/* Form Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1: Client Selection */}
            <div className="space-y-4 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
              <h3 className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                1. Seleção do Cliente Rural
              </h3>
              
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Cliente Contratante</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => handleClientChange(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-bold"
                  >
                    <option value="">Selecione um cliente...</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">CPF / CNPJ</label>
                    <input
                      type="text"
                      disabled
                      value={formData.clientCpfCnpj}
                      className="w-full text-xs bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Telefone</label>
                    <input
                      type="text"
                      disabled
                      value={formData.clientPhone}
                      className="w-full text-xs bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">E-mail</label>
                  <input
                    type="text"
                    disabled
                    value={formData.clientEmail}
                    className="w-full text-xs bg-slate-100 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-slate-500"
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Target & Location */}
            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                2. Detalhes de Campo
              </h3>

              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Fazenda Alvo</label>
                  <input
                    type="text"
                    value={formData.farmName}
                    onChange={(e) => setFormData(p => ({ ...p, farmName: e.target.value }))}
                    placeholder="Ex: Fazenda Santa Fé"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Cidade - Estado</label>
                  <input
                    type="text"
                    value={formData.cityState}
                    onChange={(e) => setFormData(p => ({ ...p, cityState: e.target.value }))}
                    placeholder="Ex: Sorriso - MT"
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Cultura (Crop)</label>
                    <select
                      value={formData.crop}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData(p => ({ ...p, crop: val }));
                        setFormItems(prev => prev.map(item => ({ ...item, crop: val, description: `Pulverização em cultura de ${val}` })));
                      }}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                    >
                      <option value="Soja">Soja</option>
                      <option value="Milho">Milho</option>
                      <option value="Algodão">Algodão</option>
                      <option value="Cana-de-açúcar">Cana-de-açúcar</option>
                      <option value="Pastagem">Pastagem</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Drone Sugerido</label>
                    <select
                      value={formData.droneModelSuggested}
                      onChange={(e) => setFormData(p => ({ ...p, droneModelSuggested: e.target.value }))}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                    >
                      {drones.map(d => (
                        <option key={d.id} value={d.modelName}>{d.modelName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Alvo Técnico / Praga</label>
                  <input
                    type="text"
                    value={formData.targetPestOrGoal}
                    onChange={(e) => setFormData(p => ({ ...p, targetPestOrGoal: e.target.value }))}
                    placeholder="Ex: Dessecação, Fungicida, Percevejo..."
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Service area & Rates */}
            <div className="space-y-4 bg-slate-50/50 dark:bg-slate-900/20 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                3. Área & Precificação
              </h3>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Área Total (Hectares)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.totalHectares || ''}
                      onChange={(e) => {
                        const ha = parseFloat(e.target.value) || 0;
                        setFormData(p => ({ ...p, totalHectares: ha }));
                        // update service item
                        setFormItems([{
                          description: `Serviço de pulverização agrícola na cultura de ${formData.crop}`,
                          hectares: ha,
                          ratePerHa: formData.baseRatePerHa,
                          subtotal: ha * formData.baseRatePerHa,
                          crop: formData.crop
                        }]);
                      }}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-black text-emerald-800 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Preço Base (R$/ha)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.baseRatePerHa || ''}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        setFormData(p => ({ ...p, baseRatePerHa: rate }));
                        // update service item
                        setFormItems([{
                          description: `Serviço de pulverização agrícola na cultura de ${formData.crop}`,
                          hectares: formData.totalHectares,
                          ratePerHa: rate,
                          subtotal: formData.totalHectares * rate,
                          crop: formData.crop
                        }]);
                      }}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-black text-emerald-800 dark:text-emerald-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Deslocamento (R$)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={formData.displacementFee === 0 ? '' : formData.displacementFee}
                      placeholder="0"
                      onChange={(e) => setFormData(p => ({ ...p, displacementFee: parseFloat(e.target.value) || 0 }))}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Desconto (%)</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      max="100"
                      value={formData.discountPercent === 0 ? '' : formData.discountPercent}
                      placeholder="0"
                      onChange={(e) => setFormData(p => ({ ...p, discountPercent: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) }))}
                      className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Condições de Pagamento</label>
                  <input
                    type="text"
                    value={formData.paymentTerms}
                    onChange={(e) => setFormData(p => ({ ...p, paymentTerms: e.target.value }))}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Válido Até</label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData(p => ({ ...p, validUntil: e.target.value }))}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Optional Insumos / Products supplied by company */}
          <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200/60 dark:border-slate-700 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-emerald-600" />
                Adicionar Insumos / Adjuvantes Fornecidos (Opcional)
              </h3>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                {formProducts.length} {formProducts.length === 1 ? 'insumo incluído' : 'insumos incluídos'}
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                Sugestões Rápidas de Adjuvantes & Insumos (Clique para preencher ou incluir):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(preset, false)}
                    className="text-[10.5px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 transition-colors cursor-pointer font-medium flex items-center gap-1"
                    title={`Preencher dados de ${preset.name}`}
                  >
                    <span>+ {preset.name.split(' ')[0]} ({formatDecimal(preset.dose, 2)} {preset.unit})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Product Error Feedback */}
            {productError && (
              <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{productError}</span>
              </div>
            )}

            {/* Product Success Feedback */}
            {productSuccessMsg && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{productSuccessMsg}</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Nome do Produto / Espalhante / Nutriente *</label>
                <input
                  id="input-quotation-product-name"
                  type="text"
                  value={newProdName}
                  onChange={(e) => {
                    setNewProdName(e.target.value);
                    if (productError) setProductError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProduct();
                    }
                  }}
                  placeholder="Ex: Espalhante Siliconado Organosilicone"
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Dose / Hectare *</label>
                <div className="flex gap-1">
                  <input
                    id="input-quotation-product-dose"
                    type="text"
                    inputMode="decimal"
                    value={newProdDose}
                    placeholder="0,2"
                    onChange={(e) => {
                      setNewProdDose(e.target.value);
                      if (productError) setProductError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddProduct();
                      }
                    }}
                    className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                  />
                  <select
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="text-[10px] bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 cursor-pointer font-medium"
                  >
                    <option value="L/ha">L/ha</option>
                    <option value="kg/ha">kg/ha</option>
                    <option value="mL/ha">mL/ha</option>
                    <option value="g/ha">g/ha</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 block mb-1">Preço Unitário (R$)</label>
                <input
                  id="input-quotation-product-price"
                  type="text"
                  inputMode="decimal"
                  value={newProdPrice}
                  placeholder="0,00"
                  onChange={(e) => {
                    setNewProdPrice(e.target.value);
                    if (productError) setProductError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddProduct();
                    }
                  }}
                  className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                />
              </div>

              <button
                id="btn-add-quotation-product"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleAddProduct();
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg font-bold text-xs cursor-pointer h-[34px] flex items-center justify-center gap-1.5 transition-all shadow-sm hover:shadow-md"
                title="Incluir este insumo na proposta comercial"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span>Incluir</span>
              </button>
            </div>

            {formProducts.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                      <th className="p-2.5">Insumo</th>
                      <th className="p-2.5">Dose Recomendada</th>
                      <th className="p-2.5">Quantidade Necessária ({formatHectares(formData.totalHectares)})</th>
                      <th className="p-2.5 text-right">Preço Unitário</th>
                      <th className="p-2.5 text-right">Custo Total</th>
                      <th className="p-2.5 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formProducts.map((prod, index) => {
                      const qty = (Number(formData.totalHectares) || 0) * prod.dosePerHa;
                      const cost = qty * prod.unitPrice;
                      return (
                        <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-100">{prod.productName}</td>
                          <td className="p-2.5">{formatDecimal(prod.dosePerHa, 2)} {prod.doseUnit}</td>
                          <td className="p-2.5">{formatDecimal(qty, 2)}</td>
                          <td className="p-2.5 text-right">{formatBRL(prod.unitPrice)}</td>
                          <td className="p-2.5 text-right font-black text-emerald-700 dark:text-emerald-400">{formatBRL(cost)}</td>
                          <td className="p-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveProduct(index)}
                              className="text-rose-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 p-1.5 rounded-md cursor-pointer transition-colors"
                              title="Remover insumo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-3 bg-white/60 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
                <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                  Nenhum insumo ou adjuvante incluído ainda. Digite um nome acima ou selecione uma sugestão rápida e clique em <strong>Incluir</strong>.
                </p>
              </div>
            )}
          </div>

          {/* Section: Text details / Notes */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block mb-1">Notas e Termos de Garantia</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
              placeholder="Notas de rodapé, informações sobre voo RTK, condições meteorológicas favoráveis, etc."
              className="w-full text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2"
            />
          </div>

          {/* Dynamic Budget Draft Live Preview summary */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Resumo do Faturamento Proposto</span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-950 dark:text-emerald-200">
                  {formatBRL(activeTotals.totalValue)}
                </span>
                <span className="text-xs text-emerald-700/80">({formatHectares(formData.totalHectares)})</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Serviços: {formatBRL(activeTotals.subtotalServices)} • Insumos: {formatBRL(activeTotals.subtotalProducts)} • Deslocamento: {formatBRL(formData.displacementFee)} {formData.discountPercent > 0 && `• Desconto: ${formatPercent(formData.discountPercent, 1)} (-${formatBRL(activeTotals.discountValue)})`}
              </p>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingQuotation(null);
                }}
                className="flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-slate-700 dark:text-slate-300"
              >
                Voltar
              </button>
              <button
                type="submit"
                className="flex-1 md:flex-none px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{editingQuotation ? 'Salvar Alterações' : 'Salvar Rascunho'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* VIEW 2: BUDGET DETAIL AND DIGITAL PROPOSAL VIEW */}
      {selectedQuotation && !isCreating && (
        <div className="space-y-6">
          {/* Action Header bar */}
          <div className="print:hidden bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <button
              onClick={() => {
                setSelectedQuotation(null);
                setIsPreviewing(false);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Lista</span>
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handleStartEdit(selectedQuotation)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 text-xs font-bold border border-slate-200 dark:border-slate-600 cursor-pointer flex items-center gap-1.5"
                title="Editar este orçamento"
              >
                <Pencil className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Editar Orçamento</span>
              </button>

              {/* Draft state controls */}
              {selectedQuotation.status === 'DRAFT' && (
                <>
                  <button
                    onClick={() => handleSendSimulated(selectedQuotation)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Enviar Proposta</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuotation.id, 'APPROVED')}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-100/90 text-emerald-950 hover:bg-emerald-200 text-xs font-black border border-emerald-300/60 cursor-pointer flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Aprovar Direto</span>
                  </button>
                </>
              )}

              {/* Sent state controls */}
              {selectedQuotation.status === 'SENT' && (
                <>
                  <button
                    onClick={() => handleConvertToOS(selectedQuotation)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-100 animate-pulse" />
                    <span>Aprovar & Gerar OS</span>
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedQuotation.id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold border border-rose-200 cursor-pointer flex items-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Recusar</span>
                  </button>
                </>
              )}

              {/* Approved but not converted state */}
              {selectedQuotation.status === 'APPROVED' && (
                <button
                  onClick={() => handleConvertToOS(selectedQuotation)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-100 animate-pulse" />
                  <span>Gerar Ordem de Serviço (OS)</span>
                </button>
              )}

              {/* Shared PDF/Print Preview mode */}
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-bold border border-slate-200 dark:border-slate-600 cursor-pointer flex items-center gap-1.5"
                title="Imprimir orçamento ou salvar como PDF"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir / PDF</span>
              </button>
            </div>
          </div>

          {/* COMMERCIAL PROPOSAL CARD SHEET - PRINT STYLED */}
          <div id="printable-quotation-document" className="printable-document bg-white dark:bg-slate-800 border-2 border-emerald-600/30 rounded-3xl p-6 sm:p-8 shadow-md relative overflow-hidden print:border-0 print:shadow-none print:p-0">
            {/* Elegant Background header aura */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl -z-10" />

            {/* Proposal Sheet Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/80">
              <div className="flex items-center gap-3.5">
                <BrandLogo theme={theme} size="md" className="w-12 h-12 shrink-0" />
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                    PROPOSTA COMERCIAL
                  </h2>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                    {theme.companyName.toUpperCase()} • {theme.tagline || 'TECNOLOGIA DE PULVERIZAÇÃO AEROAGRÍCOLA'}
                  </p>
                </div>
              </div>

              <div className="text-left md:text-right">
                <span className="text-xs text-slate-400 dark:text-slate-500 uppercase font-bold block">Código da Proposta</span>
                <span className="text-lg font-mono font-black text-slate-800 dark:text-emerald-400">{selectedQuotation.code}</span>
                <span className="text-xs text-slate-500 block">Gerado em {new Date(selectedQuotation.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Two-Column Client & Supplier Information Block */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-slate-100 dark:border-slate-700/80 text-xs">
              {/* Prestador / Empresa */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Prestador de Serviços
                </h3>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 dark:text-slate-100">{theme.companyName}</p>
                  <p className="text-slate-500 dark:text-slate-400">SulSpray Agrícola & Tecnologia Aeroespacial Ltda.</p>
                  <p className="text-slate-500 dark:text-slate-400">CNPJ: 12.345.678/0001-90 | CREA-GO / MAPA-REG</p>
                  <p className="text-slate-500 dark:text-slate-400">Contato: rafael.silveira@agrosys.agr.br | (65) 99841-3200</p>
                </div>
              </div>

              {/* Contratante / Cliente */}
              <div className="space-y-2">
                <h3 className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                  Cliente Contratante
                </h3>
                <div className="space-y-1">
                  <p className="font-black text-slate-800 dark:text-slate-100">{selectedQuotation.clientName}</p>
                  <p className="text-slate-500 dark:text-slate-400"><strong>Fazenda:</strong> {selectedQuotation.farmName}</p>
                  <p className="text-slate-500 dark:text-slate-400"><strong>Localidade:</strong> {selectedQuotation.cityState}</p>
                  <p className="text-slate-500 dark:text-slate-400"><strong>CPF/CNPJ:</strong> {selectedQuotation.clientCpfCnpj || 'Não Informado'}</p>
                  {selectedQuotation.clientPhone && (
                    <p className="text-slate-500 dark:text-slate-400"><strong>Telefone:</strong> {selectedQuotation.clientPhone}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Target Area Details */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-4 my-6 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Cultura / Cultivo</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{selectedQuotation.crop}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Área Alvo Total</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{selectedQuotation.totalHectares} Hectares</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Drone Recomendado</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{selectedQuotation.droneModelSuggested}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase font-bold">Alvo Técnico</span>
                <span className="font-black text-slate-800 dark:text-slate-200">{selectedQuotation.targetPestOrGoal}</span>
              </div>
            </div>

            {/* Services Proposal Details */}
            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b pb-2">
                Especificação de Preços & Escopo
              </h3>

              <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
                      <th className="p-3">Descrição do Serviço Aeroagrícola</th>
                      <th className="p-3 text-center">Área (ha)</th>
                      <th className="p-3 text-right">Taxa (R$/ha)</th>
                      <th className="p-3 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedQuotation.items && selectedQuotation.items.length > 0 ? (
                      selectedQuotation.items.map((item) => (
                        <tr key={item.id}>
                          <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{item.description}</td>
                          <td className="p-3 text-center">{formatHectares(item.hectares)}</td>
                          <td className="p-3 text-right">{formatBRL(item.ratePerHa)}</td>
                          <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatBRL(item.subtotal)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="p-3 font-medium text-slate-800 dark:text-slate-100">Pulverização automatizada sistemática com Drones</td>
                        <td className="p-3 text-center">{formatHectares(selectedQuotation.totalHectares)}</td>
                        <td className="p-3 text-right">{formatBRL(selectedQuotation.baseRatePerHa)}</td>
                        <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatBRL(selectedQuotation.subtotalServices)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Products Block if any */}
              {selectedQuotation.products && selectedQuotation.products.length > 0 && (
                <div className="space-y-2.5">
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Insumos Fornecidos Integrados</h4>
                  <div className="overflow-x-auto border border-slate-100 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900/40">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200/80 dark:border-slate-700">
                          <th className="p-3">Nome do Produto</th>
                          <th className="p-3">Dose recomendada</th>
                          <th className="p-3">Quantidade total</th>
                          <th className="p-3 text-right">Preço Unitário</th>
                          <th className="p-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {selectedQuotation.products.map((prod) => (
                          <tr key={prod.id}>
                            <td className="p-3 font-medium text-slate-800 dark:text-slate-100">{prod.productName}</td>
                            <td className="p-3">{formatDecimal(prod.dosePerHa, 2)} {prod.doseUnit}</td>
                            <td className="p-3">{formatDecimal(prod.totalQuantityNeeded, 2)}</td>
                            <td className="p-3 text-right">{formatBRL(prod.unitPrice)}</td>
                            <td className="p-3 text-right font-bold text-slate-800 dark:text-slate-100">{formatBRL(prod.totalCost)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Value block with Displacement and discounts */}
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 pt-6 mt-6 border-t border-slate-100 dark:border-slate-700/80 text-xs">
              <div className="space-y-3.5 max-w-md">
                <div className="space-y-1 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                  <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Condições Comerciais</span>
                  <p className="text-slate-700 dark:text-slate-300"><strong>Validade da Proposta:</strong> {new Date(selectedQuotation.validUntil).toLocaleDateString('pt-BR')}</p>
                  <p className="text-slate-700 dark:text-slate-300"><strong>Termos de Pagamento:</strong> {selectedQuotation.paymentTerms}</p>
                </div>

                {selectedQuotation.notes && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Observações Importantes</span>
                    <p className="text-slate-500 dark:text-slate-400 italic leading-relaxed">{selectedQuotation.notes}</p>
                  </div>
                )}
              </div>

              {/* Pricing Totals Grid */}
              <div className="space-y-2 w-full md:w-80 text-right">
                <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                  <span>Subtotal Serviços</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(selectedQuotation.subtotalServices)}</span>
                </div>
                {selectedQuotation.subtotalProducts > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>Subtotal Insumos</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(selectedQuotation.subtotalProducts)}</span>
                  </div>
                )}
                {selectedQuotation.displacementFee > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                    <span>Taxa de Deslocamento</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{formatBRL(selectedQuotation.displacementFee)}</span>
                  </div>
                )}
                {selectedQuotation.discountValue > 0 && (
                  <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-rose-500">
                    <span>Desconto ({formatPercent(selectedQuotation.discountPercent, 1)})</span>
                    <span className="font-semibold">- {formatBRL(selectedQuotation.discountValue)}</span>
                  </div>
                )}

                <div className="flex justify-between items-center py-2 bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <span className="font-bold text-emerald-900 dark:text-emerald-300">VALOR TOTAL</span>
                  <span className="text-xl font-black text-emerald-950 dark:text-emerald-200">
                    {formatBRL(selectedQuotation.totalValue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Document signatures mockup */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
              <div className="space-y-1">
                <div className="border-b border-slate-300 dark:border-slate-700 h-10 w-48 mx-auto" />
                <p className="font-bold text-slate-800 dark:text-slate-200">{theme.companyName}</p>
                <p className="text-[10px] text-slate-500">Representante Comercial</p>
              </div>

              <div className="space-y-1">
                <div className="border-b border-slate-300 dark:border-slate-700 h-10 w-48 mx-auto" />
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedQuotation.clientName}</p>
                <p className="text-[10px] text-slate-500">Aceite do Cliente Contratante</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: QUOTATIONS LIST TABLE */}
      {!isCreating && !selectedQuotation && (
        <div className="bg-white dark:bg-slate-800/95 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm overflow-hidden">
          {/* Controls Bar */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
              {(['ALL', 'DRAFT', 'SENT', 'APPROVED', 'REJECTED', 'CONVERTED'] as const).map((tab) => {
                const labelMap = {
                  ALL: 'Todos',
                  DRAFT: 'Rascunho',
                  SENT: 'Enviado',
                  APPROVED: 'Aprovado',
                  REJECTED: 'Recusado',
                  CONVERTED: 'Convertido'
                };
                const isActive = activeTab === tab;
                const count = tab === 'ALL' ? quotations.length : quotations.filter(q => q.status === tab).length;

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-emerald-950 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {labelMap[tab]} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search filter */}
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por cliente, fazenda ou código..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 py-2"
              />
            </div>
          </div>

          {/* Quotations Table */}
          {filteredQuotations.length === 0 ? (
            <div className="p-10 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-2">
              <FileText className="w-10 h-10 text-slate-300" />
              <p className="text-xs font-semibold">Nenhum orçamento encontrado para os critérios selecionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                    <th className="p-4 font-mono">Código</th>
                    <th className="p-4">Cliente Rural</th>
                    <th className="p-4">Fazenda / Cidade</th>
                    <th className="p-4">Cultura / Área</th>
                    <th className="p-4 text-right">Valor Total</th>
                    <th className="p-4">Validade</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredQuotations.map((q) => (
                    <tr
                      key={q.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedQuotation(q)}
                    >
                      <td className="p-4 font-mono font-black text-slate-800 dark:text-emerald-400">{q.code}</td>
                      <td className="p-4 font-bold text-slate-800 dark:text-white">{q.clientName}</td>
                      <td className="p-4">
                        <div>{q.farmName}</div>
                        <div className="text-[10px] text-slate-400">{q.cityState}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-semibold">{q.crop}</span>
                        <div className="text-[10px] text-slate-400">{formatHectares(q.totalHectares)} • {q.droneModelSuggested}</div>
                      </td>
                      <td className="p-4 text-right font-black text-emerald-800 dark:text-emerald-300">
                        {formatBRL(q.totalValue)}
                      </td>
                      <td className="p-4 text-slate-500 font-medium">
                        {new Date(q.validUntil).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          q.status === 'CONVERTED'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                            : q.status === 'APPROVED'
                            ? 'bg-blue-500/10 text-blue-700 border-blue-500/30'
                            : q.status === 'SENT'
                            ? 'bg-amber-500/10 text-amber-700 border-amber-500/30'
                            : q.status === 'REJECTED'
                            ? 'bg-rose-500/10 text-rose-700 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-600 border-slate-500/30'
                        }`}>
                          {q.status === 'CONVERTED' ? `OS: ${q.convertedOSCode}` : q.status}
                        </span>
                      </td>
                      <td className="p-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleStartEdit(q)}
                            className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer"
                            title="Editar Orçamento"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {q.status === 'DRAFT' && (
                            <button
                              onClick={() => handleSendSimulated(q)}
                              className="p-1 text-slate-500 hover:text-emerald-600 cursor-pointer"
                              title="Enviar por Email/WhatsApp"
                            >
                              <Mail className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {q.status === 'APPROVED' && (
                            <button
                              onClick={() => handleConvertToOS(q)}
                              className="p-1 text-emerald-600 hover:text-emerald-500 font-black cursor-pointer"
                              title="Gerar Ordem de Serviço (OS)"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedQuotation(q)}
                            className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-100 rounded-lg cursor-pointer"
                          >
                            Visualizar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
