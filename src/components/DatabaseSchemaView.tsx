import React, { useState } from 'react';
import { Database, Copy, Check, Search, MapPin, DollarSign, Activity, CloudSun, Radio, Layers, Code, ShieldCheck } from 'lucide-react';
import { POSTGIS_SQL_SCRIPT, SCHEMA_TABLES, SchemaTable } from '../data/sqlSchemaData';

export const DatabaseSchemaView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tables' | 'sql-editor'>('tables');

  const categories = [
    { id: 'ALL', label: 'Todas as Tabelas' },
    { id: 'GIS & Core', label: 'GIS & PostGIS' },
    { id: 'Precificação', label: 'Matriz de Precificação' },
    { id: 'Field Service (OS)', label: 'Ordens de Serviço' },
    { id: 'Calda & Clima', label: 'Calda & Clima' },
    { id: 'Telemetria', label: 'Telemetria DJI/XAG' },
    { id: 'Financeiro & Comissões', label: 'Financeiro & Comissões' },
    { id: 'White Label', label: 'White Label' },
  ];

  const filteredTables = SCHEMA_TABLES.filter(t => {
    const matchesCategory = selectedCategory === 'ALL' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopySQL = () => {
    navigator.clipboard.writeText(POSTGIS_SQL_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-6">
          <Database className="w-80 h-80" />
        </div>
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              PostgreSQL 15+ & PostGIS 3.3+
            </span>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Offline-First Ready
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Modelagem de Dados & Arquitetura Geoespacial
          </h2>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Estrutura relacional normalizada com polígonos nativos PostGIS (<code className="bg-slate-800 px-1 py-0.5 rounded text-emerald-300 text-xs font-mono">GEOMETRY(Polygon, 4326)</code>), 
            matriz de precificação com multiplicadores de relevo, rastreabilidade de calda com receituário agronômico e apuração automática de comissões.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-slate-950" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Código SQL Copiado!' : 'Copiar Script SQL Completo (PostGIS)'}
            </button>
            <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700 text-xs">
              <button
                onClick={() => setActiveTab('tables')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'tables' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Tabelas & Dicionário ({SCHEMA_TABLES.length})
              </button>
              <button
                onClick={() => setActiveTab('sql-editor')}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${activeTab === 'sql-editor' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'}`}
              >
                Visualizar DDL Completo
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'tables' ? (
        <>
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar tabela, coluna ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                    selectedCategory === c.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-750'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredTables.map((table) => (
              <div
                key={table.name}
                className="bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/50">
                      {table.category}
                    </span>
                    <h3 className="font-mono text-base font-bold text-slate-900 dark:text-white mt-1.5">
                      {table.name}
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-slate-400 font-mono">
                    {table.columns.length} colunas
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                  {table.description}
                </p>

                {/* Columns Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/80 mb-3">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3">Coluna</th>
                        <th className="py-2 px-3">Tipo</th>
                        <th className="py-2 px-3">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {table.columns.map((col) => (
                        <tr key={col.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/30">
                          <td className="py-2 px-3 font-mono font-medium text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                            {col.name}
                            {col.isPrimary && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                PK
                              </span>
                            )}
                            {col.isForeign && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300" title={`Ref: ${col.references}`}>
                                FK
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                            {col.type}
                          </td>
                          <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                            {col.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Indices */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                    <Layers className="w-3 h-3 text-slate-400" />
                    Índices de Performance & Espaciais:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {table.indices.map((idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 rounded-md border border-slate-200 dark:border-slate-700"
                      >
                        {idx}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* Full SQL Code View */
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-200 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span className="font-mono font-bold text-slate-200">schema_postgis_agrosys_v1.sql</span>
            </div>
            <button
              onClick={handleCopySQL}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar DDL'}
            </button>
          </div>
          <pre className="p-4 sm:p-6 text-xs font-mono overflow-x-auto leading-relaxed max-h-[600px] text-emerald-300/90 selection:bg-emerald-900 selection:text-white">
            {POSTGIS_SQL_SCRIPT}
          </pre>
        </div>
      )}

      {/* Offline-First & API-First Architectural Notes */}
      <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
          <Radio className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Estratégia Offline-First & Sincronização em Campo
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">1. SQLite / WatermelonDB no App Mobile</h4>
            <p>O tablet/smartphone do piloto espelha as tabelas <code className="font-mono text-emerald-600 dark:text-emerald-400">service_orders</code>, <code className="font-mono text-emerald-600 dark:text-emerald-400">weather_checks</code> e <code className="font-mono text-emerald-600 dark:text-emerald-400">farm_plots</code>. Os polígonos GeoJSON são cacheados localmente com tiles vetoriais offline.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">2. Fila de Sincronização Baseada em CRDT/Timestamps</h4>
            <p>Alterações de status e apontamentos de calda recebem UUIDs determinísticos e são empilhados em fila indexedDB/SQLite com retry exponencial assim que o piloto retorna à cobertura 4G/Wi-Fi da sede.</p>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 mb-1">3. Resolução Anti-Conflito Server-Side</h4>
            <p>O servidor PostgreSQL possui triggers de auditoria com <code className="font-mono text-emerald-600 dark:text-emerald-400">updated_at</code> e lock de faturamento: uma vez faturada (<code className="font-mono text-emerald-600 dark:text-emerald-400">service_order_invoices</code>), os hectares e valores tornam-se imutáveis.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
