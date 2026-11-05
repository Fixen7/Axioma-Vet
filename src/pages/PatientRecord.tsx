import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Scissors, Syringe, TestTube, FileText, Pill, Edit, Dog, Cat, Bird, HeartPulse, AlertTriangle, Trash2, TrendingUp, UserCheck, Sparkles, SlidersHorizontal, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import { TopAppBar } from '../components/layout/TopAppBar';
import { Button } from '../components/ui/Button';
import { useVetContext } from '../context/VetContext';

import { ActivityTimeline } from '../components/patient/ActivityTimeline';
import { ClinicalHistoryTab } from '../components/patient/ClinicalHistoryTab';
import { VaccinesTab } from '../components/patient/VaccinesTab';
import { LabResultsTab } from '../components/patient/LabResultsTab';
import { SurgeriesTab } from '../components/patient/SurgeriesTab';
import { PrescriptionsTab } from '../components/patient/PrescriptionsTab';
import { GroomingTab } from '../components/patient/GroomingTab';
import { WeightHistoryModal } from '../components/patient/WeightHistoryModal';
import { TutorSummaryModal } from '../components/patient/TutorSummaryModal';
import { SimilarCasesModal } from '../components/patient/SimilarCasesModal';
import { AnatomicalBodyMap } from '../components/patient/AnatomicalBodyMap';
import { calculateAge } from '../utils/date';
import { ClinicalMemoryCard } from '../components/patient/ClinicalMemoryCard';
import { buildClinicalMemory, type ClinicalMemoryAnalysis } from '../utils/clinicalMemory';
import type { Consultation, Prescription, WeightRecord, Surgery } from '../services/types';

type Tab = 'activity' | 'history' | 'vaccines' | 'surgeries' | 'labs' | 'prescriptions' | 'grooming';

export default function PatientRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, updatePatientStatus, deletePatient } = useVetContext();
  
  const [activeTab, setActiveTab] = useState<Tab>('activity');

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWeightHistoryModal, setShowWeightHistoryModal] = useState(false);
  const [showTutorSummaryModal, setShowTutorSummaryModal] = useState(false);
  const [showSimilarCasesModal, setShowSimilarCasesModal] = useState(false);
  const [showExtraActions, setShowExtraActions] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [memoryVersion, setMemoryVersion] = useState(0);

  const [cachedConsultations, setCachedConsultations] = useState<Consultation[]>([]);
  const [cachedPrescriptions, setCachedPrescriptions] = useState<Prescription[]>([]);
  const [cachedWeights, setCachedWeights] = useState<WeightRecord[]>([]);
  const [cachedSurgeries, setCachedSurgeries] = useState<Surgery[]>([]);

  const [statusForm, setStatusForm] = useState<{ status: string, behaviorObservation: string }>({
    status: 'NORMAL',
    behaviorObservation: ''
  });

  const patient = patients.find(p => p.id === id);

  const { getConsultations, getPrescriptions, getWeightRecords, getSurgeries, updatePatient, saveWeightRecord } = useVetContext();
  const [clinicalMemory, setClinicalMemory] = useState<ClinicalMemoryAnalysis>({
    weightDelta: null,
    pendingControl: null,
    lastTreatment: null,
    importantObservations: []
  });
  const [isLoadingMemory, setIsLoadingMemory] = useState(true);

  const refreshMemory = () => {
    setMemoryVersion(v => v + 1);
  };

  // Carga asíncrona segura con protección contra race conditions por cambio de paciente
  useEffect(() => {
    if (!id || !patient) return;

    let isMounted = true;
    setIsLoadingMemory(true);

    const loadMemoryData = async () => {
      try {
        const [consultationsData, prescriptionsData, weightsData, surgeriesData] = await Promise.all([
          getConsultations(id),
          getPrescriptions(id),
          getWeightRecords(id),
          getSurgeries(id)
        ]);

        if (!isMounted) return;

        setCachedConsultations(consultationsData);
        setCachedPrescriptions(prescriptionsData);
        setCachedWeights(weightsData);
        setCachedSurgeries(surgeriesData);

        const memory = buildClinicalMemory(patient, consultationsData, prescriptionsData, weightsData);
        setClinicalMemory(memory);
      } catch (err) {
        console.error('Error al cargar memoria clínica del paciente:', err);
      } finally {
        if (isMounted) {
          setIsLoadingMemory(false);
        }
      }
    };

    loadMemoryData();

    return () => {
      isMounted = false;
    };
  }, [id, patient?.id, patient?.weight, patient?.behaviorObservation, memoryVersion]);

  if (!patient) {
    return (
      <div className="min-h-screen bg-background text-on-background flex flex-col items-center justify-center p-4">
        <h2 className="font-headline-lg mb-4">Paciente no encontrado</h2>
        <Button onClick={() => navigate('/patient/search')}>Volver a la búsqueda</Button>
      </div>
    );
  }

  const isDeceased = patient.status === 'DECEASED';

  const handleOpenStatusModal = () => {
    setStatusForm({
      status: patient.status,
      behaviorObservation: patient.behaviorObservation || ''
    });
    setShowStatusModal(true);
  };

  const handleSaveStatus = async () => {
    await updatePatientStatus(patient.id, statusForm.status as any, statusForm.behaviorObservation);
    setShowStatusModal(false);
    refreshMemory();
  };

  const handleSaveWeight = async () => {
    if (!newWeight) return;
    try {
      await updatePatient(patient.id, { weight: newWeight });
      await saveWeightRecord({
        patientId: patient.id,
        weightKg: parseFloat(newWeight) || 0,
        date: new Date().toISOString(),
        notes: 'Actualización de peso manual'
      });
      setShowWeightModal(false);
      setNewWeight('');
      refreshMemory();
    } catch (error: any) {
      alert("Error al actualizar peso: " + error.message);
    }
  };

  const handleDeletePatient = async () => {
    const isConfirmed = window.confirm(
      "⚠️ ADVERTENCIA SEVERA ⚠️\n\n¿Estás completamente seguro de que deseas eliminar a este paciente?\n\nEsta acción borrará PERMANENTEMENTE toda su historia clínica, consultas, vacunas y recetas registradas. NO se puede deshacer."
    );
    if (isConfirmed) {
      try {
        await deletePatient(patient.id);
        navigate('/patient/search');
      } catch (error: any) {
        alert("Error al eliminar: " + error.message);
      }
    }
  };

  const getSpeciesIcon = (species: string) => {
    const s = species.toLowerCase();
    if (s.includes('perro')) return <Dog className="w-8 h-8" />;
    if (s.includes('gato')) return <Cat className="w-8 h-8" />;
    if (s.includes('ave') || s.includes('loro')) return <Bird className="w-8 h-8" />;
    return <HeartPulse className="w-8 h-8" />;
  };

  const getStatusDisplay = () => {
    if (patient.status === 'PRECAUTION') return { label: 'PRECAUCIÓN', color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800' };
    if (patient.status === 'HIGH_RISK') return { label: 'ALTO RIESGO', color: 'text-red-800 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-950/40', border: 'border-red-300 dark:border-red-800' };
    if (patient.status === 'DECEASED') return { label: 'FALLECIDO', color: 'text-outline', bg: 'bg-surface-variant', border: 'border-outline-variant' };
    return { label: 'AL DÍA', color: 'text-emerald-800 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800' };
  };

  const statusInfo = getStatusDisplay();

  const renderTabButton = (tab: Tab, label: string, Icon: any) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl md:rounded-full font-black text-xs md:text-sm transition-all duration-200 relative cursor-pointer select-none ${
        activeTab === tab
          ? 'bg-primary text-white shadow-md shadow-primary/20 scale-[1.02]'
          : 'bg-white text-[#131b2e] hover:bg-slate-100 hover:text-black border-2 border-slate-200 shadow-2xs'
      } ${tab === 'grooming' ? 'col-span-2 sm:col-span-1 md:col-span-auto' : ''}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{label}</span>
      {activeTab === tab && (
        <span className="hidden md:block absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white" />
      )}
    </button>
  );

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col antialiased relative overflow-x-hidden print:bg-white print:min-h-0">
      
      {/* Luces difusas / Mesh glowing orbs idénticos a Home.tsx */}
      <div className="absolute top-[-5%] left-[-5%] w-[45vw] h-[45vw] bg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute top-[25%] right-[-5%] w-[35vw] h-[35vw] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      <TopAppBar title={patient.name} subtitle={patient.species} />

      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-5 print:p-0 print:max-w-none">
        
        {/* Banner de Fallecido */}
        {isDeceased && (
          <div className="w-full bg-surface-container-high/80 border border-outline-variant p-4 rounded-2xl flex items-center gap-3 text-outline print:hidden">
            <AlertTriangle className="w-6 h-6 text-outline" />
            <div>
              <h4 className="font-headline-sm m-0 text-on-surface">Paciente Fallecido</h4>
              <p className="font-body-sm m-0 text-outline">
                El historial clínico y registros se encuentran archivados en modo de solo lectura.
              </p>
            </div>
          </div>
        )}

        {/* ========================================================
            BENTO CARD 1: PERFIL PRINCIPAL Y ESTADO CLÍNICO
            ======================================================== */}
        <section className={`group relative overflow-hidden rounded-[32px] bg-surface-container-lowest/85 backdrop-blur-xl border border-surface-container-high p-6 md:p-8 shadow-sm flex flex-col gap-6 print:hidden ${isDeceased ? 'opacity-90' : ''}`}>
          
          {/* Marca de agua sutil en esquina igual a Home.tsx */}
          <div className="absolute right-[-2%] bottom-[-15%] opacity-5 group-hover:opacity-10 group-hover:scale-105 transition-all duration-700 pointer-events-none text-primary">
            {getSpeciesIcon(patient.species)}
          </div>

          {/* Fila Superior: Identidad + Barra Retráctil de Acciones */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative w-16 h-16 md:w-20 md:h-20 shrink-0">
                <div className="w-full h-full rounded-2xl bg-surface-container flex items-center justify-center text-primary shadow-sm border border-surface-container-high">
                  {getSpeciesIcon(patient.species)}
                </div>
                {!isDeceased && (
                  <div className="absolute -bottom-1 -right-1 bg-surface-container-lowest p-1 rounded-full border border-surface-container-high shadow-xs">
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                  </div>
                )}
              </div>

              <div>
                <h1 className="font-display text-3xl md:text-4xl text-on-surface m-0 font-bold tracking-tight">
                  {patient.name}
                </h1>
                <p className="text-sm md:text-base text-on-surface-variant m-0 font-medium capitalize mt-0.5">
                  {patient.species} {patient.breed ? `· ${patient.breed}` : '· Sin raza registrada'}
                </p>
              </div>
            </div>

            {/* Barra Retráctil Minimalista: Menos es más */}
            {!isDeceased && (
              <div className="flex items-center gap-2 self-end md:self-center">
                {/* Botón Principal siempre a mano */}
                <button
                  type="button"
                  onClick={() => setShowTutorSummaryModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-primary text-on-primary font-medium text-xs hover:opacity-90 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Generar resumen claro para el propietario"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Resumen Tutor</span>
                </button>

                {/* Botón conmutador retráctil de opciones */}
                <button
                  type="button"
                  onClick={() => setShowExtraActions(prev => !prev)}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                    showExtraActions 
                      ? 'bg-surface-container-high border-outline-variant text-on-surface' 
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/50 text-on-surface-variant'
                  }`}
                  aria-label="Más opciones"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-outline" />
                  <span>{showExtraActions ? 'Menos' : 'Acciones'}</span>
                  {showExtraActions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            )}
          </div>

          {/* Menú Retráctil Desplegable (se muestra solo cuando el doctor lo requiere) */}
          {showExtraActions && !isDeceased && (
            <div className="relative z-10 pt-2 border-t border-surface-container-high flex flex-wrap gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <Button 
                variant="outline" 
                onClick={() => navigate(`/patient/edit/${patient.id}`)}
                className="h-9 px-3 text-xs rounded-xl"
              >
                <Edit className="w-3.5 h-3.5 mr-1.5" />
                Editar Perfil
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowSimilarCasesModal(true)}
                className="h-9 px-3 text-xs rounded-xl border-primary/30 text-primary hover:bg-primary/5"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Casos Similares en la Clínica
              </Button>
              <Button 
                variant="ghost" 
                onClick={handleDeletePatient} 
                className="h-9 px-3 text-xs rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 border border-red-200/80"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Eliminar Paciente
              </Button>
            </div>
          )}

          {/* Fila de Datos Vitales en Compartimentos Bento */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 relative z-10">
            <div className="bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Tutor</span>
              <span className="text-xs md:text-sm font-semibold text-on-surface truncate mt-1">
                {patient.ownerName || 'Sin registrar'}
              </span>
            </div>
            <div className="bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Contacto</span>
              <span className="text-xs md:text-sm font-semibold text-on-surface truncate mt-1">
                {patient.ownerPhone || 'Sin registrar'}
              </span>
            </div>
            <div className="bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Edad</span>
              <span className="text-xs md:text-sm font-semibold text-on-surface truncate mt-1">
                {calculateAge(patient.birthDate)}
              </span>
            </div>
            <div className="bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Especie</span>
              <span className="text-xs md:text-sm font-semibold text-on-surface truncate capitalize mt-1">
                {patient.species}
              </span>
            </div>
            <div className="bg-surface-container-low/70 p-3 rounded-2xl border border-outline-variant/30 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">Esterilizado</span>
              <span className="text-xs md:text-sm font-semibold text-on-surface truncate mt-1">
                {patient.isSterilized ? 'Sí' : 'No'}
              </span>
            </div>
          </div>

          {/* Fila de Insignias Interactivas (Estado, Peso & Observaciones) */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-container-high/60 relative z-10">
            <div className="flex flex-wrap items-center gap-2">
              {/* Badge de Estado Clínico (Clickable) */}
              <button 
                onClick={handleOpenStatusModal}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold uppercase tracking-wider hover:opacity-85 transition-opacity cursor-pointer shadow-2xs ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                title={patient.behaviorObservation || 'Clic para cambiar estado clínico'}
              >
                <Activity className="w-3.5 h-3.5" />
                {statusInfo.label}
                <Edit className="w-3 h-3 ml-0.5 opacity-50" />
              </button>

              {/* Botón de Peso & Gráfica (Clickable) */}
              <div className="flex bg-surface-container-low/80 rounded-xl border border-outline-variant/50 overflow-hidden shadow-2xs">
                <button 
                  onClick={() => { setNewWeight(patient.weight || ''); setShowWeightModal(true); }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-on-surface font-semibold text-xs hover:bg-surface-container transition-colors cursor-pointer"
                  title="Editar peso actual"
                >
                  <span className="text-[11px] text-outline uppercase font-bold">Peso:</span>
                  <span>{patient.weight ? (patient.weight.toLowerCase().includes('kg') ? patient.weight : `${patient.weight} kg`) : 'Sin peso'}</span>
                  <Edit className="w-3 h-3 ml-0.5 opacity-40" />
                </button>
                <button 
                  onClick={() => setShowWeightHistoryModal(true)}
                  className="inline-flex items-center justify-center px-2.5 py-1.5 border-l border-outline-variant/50 hover:bg-surface-container transition-colors text-primary bg-primary/5"
                  title="Ver, editar o eliminar historial completo de peso"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Observación de Manejo / Alerta si existe */}
            {patient.behaviorObservation && (
              <div className="text-xs text-on-surface-variant bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate max-w-xs md:max-w-md">{patient.behaviorObservation}</span>
              </div>
            )}
          </div>

        </section>

        {/* ========================================================
            BARRA DE NAVEGACIÓN DE PESTAÑAS (ANTES DE LA PARTE INFORMATIVA):
            - Desktop (md+): En línea recta horizontal continua
            - Móvil (<md): Cuadrícula minimalista limpia
            ======================================================== */}
        <nav className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:items-center md:flex-nowrap gap-2 py-1 print:hidden w-full">
          {renderTabButton('activity', 'Actividad', Activity)}
          {renderTabButton('history', 'Historia Clínica', FileText)}
          {renderTabButton('vaccines', 'Vacunas', Syringe)}
          {renderTabButton('surgeries', 'Cirugías', Scissors)}
          {renderTabButton('labs', 'Laboratorio', TestTube)}
          {renderTabButton('prescriptions', 'Recetas', Pill)}
          {renderTabButton('grooming', 'Peluquería', Scissors)}
        </nav>

        {/* ========================================================
            BENTO CARD 2: MAPA ANATÓMICO Y MEMORIA CLÍNICA INTEGRADA
            ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 print:hidden">
          
          {/* Mapa Anatómico de Dolencias (7 Columnas en Desktop) */}
          <div className="lg:col-span-7 flex flex-col">
            <AnatomicalBodyMap 
              patient={patient} 
              consultations={cachedConsultations} 
              surgeries={cachedSurgeries}
            />
          </div>

          {/* Memoria Clínica Determinista (5 Columnas en Desktop) */}
          <div className="lg:col-span-5 flex flex-col">
            <ClinicalMemoryCard 
              memory={clinicalMemory} 
              isLoading={isLoadingMemory} 
              onOpenSimilarCases={() => setShowSimilarCasesModal(true)}
            />
          </div>

        </div>

        {/* ========================================================
            BENTO CARD 3: CONTENIDO DE PESTAÑAS CLÍNICAS
            ======================================================== */}
        <section className="rounded-[32px] bg-surface-container-lowest/85 backdrop-blur-xl border border-surface-container-high p-6 md:p-8 min-h-[420px] shadow-sm print:p-0 print:border-none print:shadow-none print:bg-white print:w-full">
          {activeTab === 'activity' && (
             <ActivityTimeline patientId={patient.id} />
          )}
          {activeTab === 'history' && (
             <ClinicalHistoryTab patientId={patient.id} isDeceased={isDeceased} />
          )}
          {activeTab === 'vaccines' && (
             <VaccinesTab patientId={patient.id} isDeceased={isDeceased} />
          )}
          {activeTab === 'surgeries' && (
             <SurgeriesTab patientId={patient.id} isDeceased={isDeceased} />
          )}
          {activeTab === 'labs' && (
             <LabResultsTab patientId={patient.id} isDeceased={isDeceased} />
          )}
          {activeTab === 'prescriptions' && (
             <PrescriptionsTab patientId={patient.id} isDeceased={isDeceased} />
          )}
          {activeTab === 'grooming' && (
             <GroomingTab patientId={patient.id} isDeceased={isDeceased} />
          )}
        </section>
      </main>

      {/* Modales */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-surface-container-lowest text-on-surface rounded-[28px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-5 border border-outline-variant/40 animate-in fade-in zoom-in duration-300">
            <div>
              <h2 className="font-display text-2xl text-on-surface mb-1 font-bold">Estado del Paciente</h2>
              <p className="text-xs text-on-surface-variant m-0">
                Actualiza el estado de manejo y precauciones para este paciente.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">Estado Clínico</label>
                <select 
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm text-on-surface font-medium"
                >
                  <option value="NORMAL">Al Día / Normal (Verde)</option>
                  <option value="PRECAUTION">Precaución (Amarillo)</option>
                  <option value="HIGH_RISK">Alto Riesgo (Rojo)</option>
                  <option value="DECEASED">Fallecido (Gris)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-outline">Observaciones de Manejo</label>
                <textarea 
                  value={statusForm.behaviorObservation}
                  onChange={(e) => setStatusForm({ ...statusForm, behaviorObservation: e.target.value })}
                  placeholder="Ej. Agresivo al tacto, alergia severa..."
                  rows={3}
                  className="w-full p-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none text-sm text-on-surface"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-surface-container-high">
              <Button variant="ghost" onClick={() => setShowStatusModal(false)} className="text-xs">Cancelar</Button>
              <Button variant="primary" onClick={handleSaveStatus} className="text-xs font-semibold">Actualizar Estado</Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Peso */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-surface-container-lowest text-on-surface rounded-[28px] p-6 md:p-8 w-full max-w-sm shadow-2xl flex flex-col gap-5 border border-outline-variant/40 animate-in fade-in zoom-in duration-300">
            <div>
              <h2 className="font-display text-2xl text-on-surface mb-1 font-bold">Actualizar Peso</h2>
              <p className="text-xs text-on-surface-variant m-0">
                Ingresa la nueva medición de peso del paciente.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-outline">Peso (kg)</label>
              <input 
                type="text" 
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none text-sm font-semibold text-on-surface"
                placeholder="Ej. 12.5"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-surface-container-high">
              <Button variant="ghost" onClick={() => setShowWeightModal(false)} className="text-xs">Cancelar</Button>
              <Button variant="primary" onClick={handleSaveWeight} className="text-xs font-semibold">Guardar Peso</Button>
            </div>
          </div>
        </div>
      )}

      {showWeightHistoryModal && (
        <WeightHistoryModal 
          patientId={patient.id} 
          onClose={() => setShowWeightHistoryModal(false)}
          onWeightChanged={refreshMemory}
        />
      )}

      {showTutorSummaryModal && (
        <TutorSummaryModal
          patient={patient}
          consultations={cachedConsultations}
          prescriptions={cachedPrescriptions}
          weights={cachedWeights}
          onClose={() => setShowTutorSummaryModal(false)}
        />
      )}

      {showSimilarCasesModal && (
        <SimilarCasesModal
          currentPatient={patient}
          initialDiagnosis={cachedConsultations.length > 0 ? cachedConsultations[0].diagnosis : ''}
          onClose={() => setShowSimilarCasesModal(false)}
        />
      )}
    </div>
  );
}
