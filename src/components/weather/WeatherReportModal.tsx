import React, { useState } from 'react';
import { 
  FileText, 
  X, 
  Copy, 
  Check, 
  Printer, 
  ShieldCheck, 
  Calendar, 
  MapPin, 
  Wind, 
  Thermometer, 
  Droplets,
  Zap,
  Lock,
  Unlock
} from 'lucide-react';
import { WeatherForecastData } from '../../services/weatherService';
import { UserProfile } from '../../types';

interface WeatherReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherForecastData;
  currentUser?: UserProfile;
}

export const WeatherReportModal: React.FC<WeatherReportModalProps> = ({
  isOpen,
  onClose,
  weatherData,
  currentUser
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const { city, current } = weatherData;
  const { assessment } = current;
  const now = new Date();
  const dateFormatted = now.toLocaleDateString('pt-BR');
  const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const reportText = `=====================================================
LAUDO TÉCNICO METEOROLÓGICO DE APLICAÇÃO AEROAGRÍCOLA
Conformidade: MAPA IN-02/2008 • ANAC RBAC 137 • EMBRAPA
=====================================================
Data/Hora Emissão: ${dateFormatted} às ${timeFormatted}
Responsável Técnico: ${currentUser?.name || 'Engenheiro Agrônomo Responsável'}
Credencial / Função: ${currentUser?.badge || currentUser?.roleLabel || 'Piloto Agrícola / RT'}

1. LOCALIZAÇÃO E TALHÃO
-----------------------------------------------------
Município: ${city.name} - ${city.state} (${city.country})
Coordenadas GPS: Lat ${city.latitude.toFixed(5).replace('.', ',')}°, Lon ${city.longitude.toFixed(5).replace('.', ',')}°
Altitude Estimada: ${city.elevationMeters || '---'} m
Região Agrícola: ${city.region || 'Cerrado Brasileiro'}

2. PARÂMETROS METEOROLÓGICOS REGISTRADOS
-----------------------------------------------------
• Temperatura do Ar (T): ${current.temperature.toFixed(1).replace('.', ',')} °C
• Temperatura Bulbo Úmido (Tw): ${current.wetBulbTemp.toFixed(1).replace('.', ',')} °C
• Diferencial Psicrométrico Delta T: ${current.deltaT.toFixed(1).replace('.', ',')} °C
• Umidade Relativa do Ar (UR): ${current.relativeHumidity.toFixed(0)} %
• Velocidade do Vento: ${current.windSpeed.toFixed(1).replace('.', ',')} km/h
• Rajadas Máximas de Vento: ${current.windGusts.toFixed(1).replace('.', ',')} km/h
• Direção Predominante: ${current.windDirectionCompass} (${current.windDirectionDegrees}°)
• Precipitação Pluviométrica: ${current.precipitation.toFixed(1).replace('.', ',')} mm (Probabilidade: ${current.precipitationProbability}%)
• Pressão Barométrica: ${current.surfacePressure} hPa

3. PARECER DO PORTÃO DE DECOLAGEM
-----------------------------------------------------
STATUS DE VOO: ${assessment.isAllowed ? 'APROVADO (PORTÃO ABERTO)' : 'BLOQUEADO (PORTÃO FECHADO)'}
Classificação Técnica: ${assessment.title}
Índice de Segurança Operacional: ${assessment.score}%
Risco de Deriva Externa: ${assessment.driftRiskLevel}
Risco de Evaporação de Gota: ${assessment.evaporationRiskLevel}

4. PRESCRIÇÃO TÉCNICA DE APLICAÇÃO
-----------------------------------------------------
• Classe de Gota Indicada: ${assessment.recommendedDropletSize}
• Ponta / Atomizador Sugerido: ${assessment.recommendedNozzle}
• Adjuvante de Calda Recomendado: ${assessment.recommendedAdjuvant}
• Observações Operacionais: ${assessment.description}

=====================================================
Documento gerado digitalmente via Sistema AgroSys.
Válido para anexo em Ordem de Serviço (OS) e ART.
=====================================================`;

  const handleCopy = () => {
    navigator.clipboard.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-[#072a1e] border border-emerald-300 dark:border-emerald-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="print:hidden p-4 sm:p-5 border-b border-emerald-200 dark:border-emerald-800 flex items-center justify-between bg-emerald-50/80 dark:bg-[#052117]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-emerald-950 dark:text-white">
                Laudo Técnico Meteorológico de Aplicação
              </h2>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Certificado oficial para anexo na Ordem de Serviço e conformidade com MAPA/ANAC
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - Scrollable Formatted Report */}
        <div id="printable-weather-document" className="printable-document p-5 overflow-y-auto space-y-4 text-xs font-mono">
          {/* Visual Header Box */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 space-y-2 font-sans">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-black text-sm text-emerald-950 dark:text-white">
                  {city.name} - {city.state}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                {dateFormatted} às {timeFormatted}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1 ${
                assessment.isAllowed ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {assessment.isAllowed ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                {assessment.isAllowed ? 'Decolagem Aprovada' : 'Decolagem Bloqueada'}
              </span>
              <span className="text-[11px] text-emerald-900 dark:text-emerald-200 font-bold">
                Delta T: {current.deltaT.toFixed(1).replace('.', ',')}°C • Vento: {current.windSpeed.toFixed(1).replace('.', ',')} km/h • UR: {current.relativeHumidity.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Raw Formatted Text Area for quick copy */}
          <pre className="p-4 rounded-2xl bg-slate-900 text-emerald-300 print:bg-white print:text-black print:border-none text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono border border-slate-700 shadow-inner max-h-72 print:max-h-none">
            {reportText}
          </pre>
        </div>

        {/* Modal Footer Actions */}
        <div className="print:hidden p-4 border-t border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-[#052117] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Printer className="w-4 h-4 text-emerald-600" />
              Imprimir
            </button>

            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copiado com Sucesso!' : 'Copiar Laudo Formatado'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
