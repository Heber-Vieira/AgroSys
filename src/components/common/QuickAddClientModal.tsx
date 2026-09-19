import React, { useState } from 'react';
import { 
  UserPlus, 
  X, 
  Building, 
  Sprout, 
  Ruler, 
  Phone, 
  FileText, 
  CheckCircle2,
  Mountain
} from 'lucide-react';
import { ClientProducer, FarmPlot, TerrainType } from '../../types';
import { BrazilCityAutocomplete } from './BrazilCityAutocomplete';
import { playSuccessChime } from '../../utils/audioAlerts';
import { showToast } from '../../services/notificationService';

interface QuickAddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newClient: ClientProducer, newPlot: FarmPlot) => void;
  companyId?: string;
}

export const QuickAddClientModal: React.FC<QuickAddClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  companyId = 'ciclodrone',
}) => {
  const [clientName, setClientName] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('');
  const [cityState, setCityState] = useState('Rio Verde - GO');
  const [farmName, setFarmName] = useState('');
  const [plotName, setPlotName] = useState('Talhão 01');
  const [crop, setCrop] = useState<'Soja' | 'Milho' | 'Algodão' | 'Cana-de-açúcar' | 'Pastagem' | 'Café'>('Soja');
  const [hectares, setHectares] = useState<number | string>(100);
  const [terrain, setTerrain] = useState<TerrainType>('FLAT_GRAINS');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName.trim()) {
      showToast('Por favor, informe o nome do cliente / produtor.', 'warning');
      return;
    }

    if (!farmName.trim()) {
      showToast('Por favor, informe o nome da fazenda.', 'warning');
      return;
    }

    if (!plotName.trim()) {
      showToast('Por favor, informe o nome do talhão.', 'warning');
      return;
    }

    const numHectares = Number(hectares);
    if (!numHectares || numHectares <= 0) {
      showToast('Por favor, informe uma área válida em hectares.', 'warning');
      return;
    }

    const timestamp = Date.now();
    const clientId = `client-${timestamp}`;
    const farmId = `farm-${timestamp}`;
    const plotId = `plot-${timestamp}`;

    const newClient: ClientProducer = {
      id: clientId,
      companyId,
      name: clientName.trim(),
      tradeName: clientName.trim(),
      cpfCnpj: cpfCnpj.trim() || 'Não informado',
      phone: phone.trim() || '(64) 99999-0000',
      email: `${clientName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'cliente'}@produtor.com.br`,
      cityState: cityState || 'Rio Verde - GO',
      farmNames: [farmName.trim()],
      totalHectaresRegistered: numHectares,
      creditLimit: 50000,
      paymentTermsDays: 30,
      status: 'ACTIVE',
      notes: 'Cadastrado rapidamente durante criação de Ordem de Serviço.'
    };

    const newPlot: FarmPlot = {
      id: plotId,
      companyId,
      farmId,
      farmName: farmName.trim(),
      clientName: clientName.trim(),
      name: plotName.trim(),
      crop,
      season: '2025/2026',
      phenologicalStage: 'V4',
      hectares: numHectares,
      terrain,
      slopeDegrees: terrain === 'STEEP_SLOPE' ? 15 : 2,
      coordinates: [
        [-50.92, -17.79],
        [-50.91, -17.79],
        [-50.91, -17.80],
        [-50.92, -17.80]
      ],
      cityState: cityState || 'Rio Verde - GO',
      healthIndexNDVI: 0.78
    };

    onSave(newClient, newPlot);
    playSuccessChime();
    showToast(`Cliente "${newClient.name}" e Talhão "${newPlot.name}" cadastrados com sucesso!`, 'success');
    
    // Reset defaults and close
    setClientName('');
    setCpfCnpj('');
    setPhone('');
    setFarmName('');
    setPlotName('Talhão 01');
    setHectares(100);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserPlus className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Cadastrar Novo Cliente & Talhão
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Preencha os dados do produtor e do seu talhão inicial para vincular à Ordem de Serviço
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Section 1: Dados do Cliente */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <Building className="w-4 h-4" /> Dados do Produtor / Cliente
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Produtor / Cliente <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João Silva ou Agropecuária Sol"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  CPF ou CNPJ
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="000.000.000-00 ou 00.000.000/0001-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="(64) 99999-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cidade - UF
                </label>
                <BrazilCityAutocomplete
                  value={cityState}
                  onChange={(val) => setCityState(val)}
                  placeholder="Selecione a cidade..."
                />
              </div>
            </div>
          </div>

          {/* Section 2: Dados da Fazenda & Talhão */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <Sprout className="w-4 h-4" /> Dados da Propriedade & Talhão Inicial
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Fazenda <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Fazenda Boa Vista"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome / Identificação do Talhão <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Talhão 01 - Pivô Central"
                  value={plotName}
                  onChange={(e) => setPlotName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cultura Agrícola
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="Soja">Soja</option>
                  <option value="Milho">Milho</option>
                  <option value="Algodão">Algodão</option>
                  <option value="Cana-de-açúcar">Cana-de-açúcar</option>
                  <option value="Pastagem">Pastagem</option>
                  <option value="Café">Café</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Área do Talhão (Hectares) <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <Ruler className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <input
                    type="number"
                    min="1"
                    step="0.1"
                    required
                    placeholder="100"
                    value={hectares}
                    onChange={(e) => setHectares(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Relevo / Tipo de Terreno
                </label>
                <div className="relative">
                  <Mountain className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-3" />
                  <select
                    value={terrain}
                    onChange={(e) => setTerrain(e.target.value as TerrainType)}
                    className="w-full bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="FLAT_GRAINS">Plano (Grãos / Extensivo)</option>
                    <option value="PASTURE">Pastagem / Relevo Suave</option>
                    <option value="STEEP_SLOPE">Declive Acentuado / Montanhoso</option>
                    <option value="ORCHARD_FRUIT">Pomar / Fruticultura</option>
                    <option value="WETLAND">Várzea / Terreno Úmido</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Cadastrar e Selecionar na OS
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
