import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Database,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { useVetContext } from '../../context/VetContext';
import { useTranslation } from '../../i18n';
import { 
  exportFullBackupToExcel, 
  exportPatientsListToExcel, 
  downloadMigrationTemplate, 
  parseAndValidateMigrationFile,
  type MigrationAnalysisResult
} from '../../utils/excelService';

interface ExcelMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'export' | 'import';
}

export function ExcelMigrationModal({ isOpen, onClose, defaultTab = 'export' }: ExcelMigrationModalProps) {
  const { t } = useTranslation();
  const { 
    patients, 
    settings, 
    savePatient, 
    loadPatients,
    getAllConsultations,
    getAllPrescriptions,
    getAllVaccines,
    getAllSurgeries,
    getAllLabs,
    getAllGroomings,
    getAllWeightRecords
  } = useVetContext();

  const [activeTab, setActiveTab] = useState<'export' | 'import'>(defaultTab);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Import State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MigrationAnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null);
  const [importSuccessResult, setImportSuccessResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [previewTab, setPreviewTab] = useState<'valid' | 'incongruent'>('valid');

  if (!isOpen) return null;

  // HANDLER: Export Full Backup
  const handleExportFull = async () => {
    setIsExporting(true);
    setExportSuccessMessage(null);
    try {
      const [consultations, prescriptions, vaccines, surgeries, labs, groomings, weights] = await Promise.all([
        getAllConsultations(),
        getAllPrescriptions(),
        getAllVaccines(),
        getAllSurgeries(),
        getAllLabs(),
        getAllGroomings(),
        getAllWeightRecords(),
      ]);

      const filename = await exportFullBackupToExcel({
        clinicName: settings?.clinicName || 'AxiomaVet',
        patients,
        consultations,
        prescriptions,
        vaccines,
        surgeries,
        labs,
        groomings,
        weights,
      });

      setExportSuccessMessage(filename);
    } catch (err: any) {
      alert(t('Error al generar respaldo Excel: ', 'Error generating Excel backup: ') + (err.message || 'Error'));
    } finally {
      setIsExporting(false);
    }
  };

  // HANDLER: Export Only Patients List
  const handleExportPatientsOnly = () => {
    try {
      const filename = exportPatientsListToExcel(patients, settings?.clinicName || 'AxiomaVet');
      setExportSuccessMessage(filename);
    } catch (err: any) {
      alert(t('Error al exportar pacientes: ', 'Error exporting patients: ') + (err.message || 'Error'));
    }
  };

  // HANDLER: File Upload & Analysis
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setImportSuccessResult(null);

    try {
      const result = await parseAndValidateMigrationFile(file);
      setAnalysisResult(result);
      if (result.readyCount === 0 && result.skippedCount > 0) {
        setPreviewTab('incongruent');
      } else {
        setPreviewTab('valid');
      }
    } catch (err: any) {
      setAnalysisError(err.message || t('No se pudo leer el archivo Excel.', 'Could not read Excel file.'));
    } finally {
      setIsAnalyzing(false);
      // Reset input value to allow re-uploading the same file
      e.target.value = '';
    }
  };

  // HANDLER: Execute Migration of Valid Rows
  const handleExecuteMigration = async () => {
    if (!analysisResult || analysisResult.readyCount === 0) return;

    const confirmMsg = t(
      `¿Confirmas la importación de ${analysisResult.readyCount} paciente(s)? Solo se migrarán los registros válidos.`,
      `Confirm import of ${analysisResult.readyCount} patient(s)? Only valid records will be migrated.`
    );
    if (!window.confirm(confirmMsg)) return;

    setIsImporting(true);
    setImportProgress({ current: 0, total: analysisResult.readyCount });

    let importedCount = 0;
    try {
      for (let i = 0; i < analysisResult.validRows.length; i++) {
        const item = analysisResult.validRows[i];
        await savePatient(item.data);
        importedCount++;
        setImportProgress({ current: importedCount, total: analysisResult.readyCount });
      }

      await loadPatients();
      setImportSuccessResult({
        imported: importedCount,
        skipped: analysisResult.skippedCount,
      });
      setAnalysisResult(null);
    } catch (err: any) {
      alert(t('Error durante la migración: ', 'Error during migration: ') + (err.message || 'Error'));
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/50 via-teal-50/30 to-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {t('Centro de Datos y Excel', 'Data & Excel Center')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                {t('Respaldo oficial, exportación libre y migración desde hojas de cálculo', 'Official backup, free export, and migration from spreadsheets')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label={t('Cerrar', 'Close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 px-6 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('export')}
            className={`px-5 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'export'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>{t('Exportar y Respaldo Excel', 'Export & Backup Excel')}</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-5 py-2.5 rounded-t-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all border-b-2 ${
              activeTab === 'import'
                ? 'bg-white text-emerald-700 border-emerald-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 border-transparent'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>{t('Migrar desde Excel', 'Migrate from Excel')}</span>
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Trust Callout */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-emerald-950">
                  <p className="font-bold text-emerald-900 mb-0.5">
                    {t('Tus datos te pertenecen al 100% — Cero ataduras', 'Your data is 100% yours — Zero lock-in')}
                  </p>
                  <p className="text-emerald-800/90 leading-relaxed">
                    {t(
                      'En Axioma Vet nunca retendremos tu información clínica. Puedes descargar un libro completo en formato Microsoft Excel (.xlsx) con todos tus pacientes, consultas, recetas, vacunas, cirugías y evolución en 1 solo clic.',
                      'At Axioma Vet we will never lock your clinical data. You can download a complete Microsoft Excel (.xlsx) workbook with all your patients, visits, prescriptions, vaccines, and surgeries in 1 single click.'
                    )}
                  </p>
                </div>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-2xl font-black text-slate-900">{patients.length}</span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    {t('Pacientes', 'Patients')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-2xl font-black text-emerald-600">8</span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    {t('Módulos Clínicos', 'Clinical Modules')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-2xl font-black text-indigo-600">.xlsx</span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    {t('Formato Oficial', 'Official Format')}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-2xl font-black text-emerald-600">100%</span>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
                    {t('Libre y Seguro', 'Free & Secure')}
                  </p>
                </div>
              </div>

              {/* Export Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Backup */}
                <div className="p-5 rounded-2xl border-2 border-emerald-500/40 bg-gradient-to-br from-white to-emerald-50/40 flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm mb-1">
                      <Database className="w-4 h-4" />
                      <span>{t('Respaldo Clínico Completo', 'Full Clinical Backup')}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'Genera un archivo Excel multidivisión con 8 hojas separadas: Pacientes, Consultas, Recetas Médicas, Vacunas, Cirugías, Laboratorios, Peluquería y Control de Peso.',
                        'Generates a multi-sheet Excel file with 8 distinct sheets: Patients, Visits, Prescriptions, Vaccines, Surgeries, Labs, Grooming, and Weight History.'
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleExportFull}
                    disabled={isExporting}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isExporting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{t('Compilando datos clínicos...', 'Compiling clinical data...')}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        <span>{t('Descargar Respaldo Completo (.xlsx)', 'Download Full Backup (.xlsx)')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Patients Only */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-1">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>{t('Lista de Pacientes y Contactos', 'Patients & Contacts List')}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {t(
                        'Descarga rápida de la nómina de mascotas con datos de contacto de tutores (teléfonos, emails, cédulas) ideal para campañas de vacunación o reportes contables.',
                        'Quick export of all pets with owner contact details (phones, emails, IDs) ideal for vaccination campaigns or administrative reports.'
                      )}
                    </p>
                  </div>
                  <button
                    onClick={handleExportPatientsOnly}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>{t('Descargar Lista de Pacientes (.xlsx)', 'Download Patients List (.xlsx)')}</span>
                  </button>
                </div>
              </div>

              {/* Success Notification */}
              {exportSuccessMessage && (
                <div className="p-4 rounded-2xl bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-xs sm:text-sm flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">{t('¡Archivo generado con éxito!', 'File generated successfully!')}</p>
                    <p className="text-xs text-emerald-800">{exportSuccessMessage}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT / MIGRATION */}
          {activeTab === 'import' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Mandatory Policy / Integrity Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-amber-900">
                    {t('Regla de Migración Segura e Integridad Clínica', 'Safe Migration & Clinical Integrity Rule')}
                  </p>
                  <p className="text-amber-900/90 leading-relaxed">
                    {t(
                      'Esta herramienta migra únicamente archivos digitales en formato Excel (.xlsx, .xls o .csv). Para proteger tu historial y evitar datos corruptos, solo se importarán las filas con datos válidos y congruentes. Las filas vacías o sin nombre de paciente serán omitidas automáticamente.',
                      'This tool only imports digital spreadsheet files (.xlsx, .xls, or .csv). To protect your records and prevent corrupted data, only valid and coherent rows will be migrated. Incomplete or blank rows will be automatically omitted.'
                    )}
                  </p>
                </div>
              </div>

              {/* Step 1: Download Template */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    {t('Paso 1: Recomendado', 'Step 1: Recommended')}
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {t('Descarga la Plantilla Oficial de Migración', 'Download the Official Migration Template')}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-lg">
                    {t(
                      'Incluye las columnas exactas, ejemplos precargados e instrucciones para pegar tus datos desde otros programas.',
                      'Includes exact columns, sample rows, and tips to paste your data from other software.'
                    )}
                  </p>
                </div>
                <button
                  onClick={downloadMigrationTemplate}
                  className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs flex items-center gap-2 shrink-0 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>{t('Descargar Plantilla (.xlsx)', 'Download Template (.xlsx)')}</span>
                </button>
              </div>

              {/* Step 2: Upload File Area */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
                  {t('Paso 2: Subir Archivo', 'Step 2: Upload File')}
                </span>

                <label className="block border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-3xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isAnalyzing || isImporting}
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-14 h-14 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      {isAnalyzing ? (
                        <RefreshCw className="w-7 h-7 animate-spin" />
                      ) : (
                        <Upload className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base text-slate-800">
                        {isAnalyzing
                          ? t('Analizando y validando estructura...', 'Analyzing & validating structure...')
                          : t('Haz clic o arrastra tu archivo Excel aquí', 'Click or drag your Excel file here')}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {t('Formatos admitidos: .xlsx, .xls o .csv (máximo 5 MB)', 'Supported formats: .xlsx, .xls or .csv (max 5 MB)')}
                      </p>
                    </div>
                  </div>
                </label>
              </div>

              {/* Error Alert */}
              {analysisError && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs sm:text-sm flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                  <p>{analysisError}</p>
                </div>
              )}

              {/* Migration Success Confirmation */}
              {importSuccessResult && (
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center gap-2 font-bold text-emerald-900">
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                    <span className="text-base">{t('¡Migración completada con éxito!', 'Migration completed successfully!')}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-800">
                    {t(
                      `Se registraron ${importSuccessResult.imported} pacientes en tu clínica. ${importSuccessResult.skipped > 0 ? `Se omitieron ${importSuccessResult.skipped} fila(s) por estar vacías o incompletas.` : ''} Ya puedes buscarlos y abrir sus expedientes.`,
                      `${importSuccessResult.imported} patients were registered. ${importSuccessResult.skipped > 0 ? `${importSuccessResult.skipped} row(s) were omitted due to incomplete or missing data.` : ''} You can now search and open their records.`
                    )}
                  </p>
                </div>
              )}

              {/* Step 3: Analysis Results & Preview */}
              {analysisResult && (
                <div className="space-y-4 pt-2 border-t border-slate-200 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        {t('Resultado del Análisis de Datos', 'Data Analysis Result')}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {t(
                          `Se leyeron ${analysisResult.totalRows} filas en total.`,
                          `${analysisResult.totalRows} total rows were scanned.`
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {analysisResult.readyCount} {t('Válidos', 'Valid')}
                      </span>
                      {analysisResult.skippedCount > 0 && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {analysisResult.skippedCount} {t('Omitidos', 'Omitted')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sub-tabs for Preview */}
                  <div className="flex gap-2 border-b border-slate-200 pb-2">
                    <button
                      onClick={() => setPreviewTab('valid')}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                        previewTab === 'valid'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {t(`Listos para migrar (${analysisResult.readyCount})`, `Ready to migrate (${analysisResult.readyCount})`)}
                    </button>
                    {analysisResult.skippedCount > 0 && (
                      <button
                        onClick={() => setPreviewTab('incongruent')}
                        className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                          previewTab === 'incongruent'
                            ? 'bg-amber-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t(`Filas Omitidas (${analysisResult.skippedCount})`, `Omitted Rows (${analysisResult.skippedCount})`)}
                      </button>
                    )}
                  </div>

                  {/* PREVIEW: Valid Rows */}
                  {previewTab === 'valid' && (
                    <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Fila</th>
                            <th className="py-2.5 px-3">Mascota</th>
                            <th className="py-2.5 px-3">Especie</th>
                            <th className="py-2.5 px-3">Sexo</th>
                            <th className="py-2.5 px-3">Tutor</th>
                            <th className="py-2.5 px-3">Teléfono</th>
                            <th className="py-2.5 px-3">Observaciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {analysisResult.validRows.map(item => (
                            <tr key={item.rowNumber} className="hover:bg-slate-50">
                              <td className="py-2 px-3 font-mono text-slate-400">#{item.rowNumber}</td>
                              <td className="py-2 px-3 font-bold text-slate-900">{item.data.name}</td>
                              <td className="py-2 px-3">{item.data.species}</td>
                              <td className="py-2 px-3">{item.data.gender}</td>
                              <td className="py-2 px-3">{item.data.ownerName}</td>
                              <td className="py-2 px-3 font-mono">{item.data.ownerPhone}</td>
                              <td className="py-2 px-3">
                                {item.warnings.length > 0 ? (
                                  <span className="text-amber-700 text-[11px] font-medium" title={item.warnings.join('; ')}>
                                    ⚠️ {item.warnings[0]}
                                  </span>
                                ) : (
                                  <span className="text-emerald-700 text-[11px]">✓ Completo</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* PREVIEW: Incongruent / Skipped Rows */}
                  {previewTab === 'incongruent' && (
                    <div className="border border-amber-200 rounded-2xl overflow-hidden max-h-60 overflow-y-auto bg-amber-50/20">
                      <table className="w-full text-left text-xs text-slate-600">
                        <thead className="bg-amber-100 text-amber-900 font-bold sticky top-0">
                          <tr>
                            <th className="py-2.5 px-3">Fila Excel</th>
                            <th className="py-2.5 px-3">Motivo de Omisión</th>
                            <th className="py-2.5 px-3">Datos Detectados</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-amber-100">
                          {analysisResult.incongruentRows.map(row => (
                            <tr key={row.rowNumber}>
                              <td className="py-2 px-3 font-mono text-amber-900 font-bold">#{row.rowNumber}</td>
                              <td className="py-2 px-3 text-red-700 font-medium">{row.reason}</td>
                              <td className="py-2 px-3 text-slate-400 font-mono text-[10px] truncate max-w-xs">
                                {JSON.stringify(row.raw)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Execution Action Button */}
                  <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs text-slate-500">
                      {analysisResult.readyCount > 0
                        ? t(
                            `Se importarán ${analysisResult.readyCount} paciente(s) a tu base de datos clínica.`,
                            `${analysisResult.readyCount} patient(s) will be added to your clinic database.`
                          )
                        : t('No se encontraron filas válidas para migrar.', 'No valid rows found to migrate.')}
                    </p>

                    <button
                      onClick={handleExecuteMigration}
                      disabled={isImporting || analysisResult.readyCount === 0}
                      className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {isImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>
                            {importProgress
                              ? t(`Importando (${importProgress.current}/${importProgress.total})...`, `Importing (${importProgress.current}/${importProgress.total})...`)
                              : t('Procesando...', 'Processing...')}
                          </span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          <span>{t(`Confirmar e Importar ${analysisResult.readyCount} Pacientes`, `Confirm & Import ${analysisResult.readyCount} Patients`)}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t('Aislamiento seguro de datos por clínica', 'Secure multi-tenant data isolation per clinic')}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-200/60 font-semibold transition-colors cursor-pointer"
          >
            {t('Cerrar', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
}
