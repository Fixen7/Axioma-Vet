import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Activity, Scissors, Syringe, TestTube, FileText, Pill, Edit, Dog, Cat, Bird, HeartPulse, AlertTriangle, Trash2, TrendingUp } from 'lucide-react';
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
import { calculateAge } from '../utils/date';

type Tab = 'activity' | 'history' | 'vaccines' | 'surgeries' | 'labs' | 'prescriptions' | 'grooming';

export default function PatientRecord() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { patients, updatePatientStatus, deletePatient } = useVetContext();
  
  const [activeTab, setActiveTab] = useState<Tab>('activity');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [showWeightHistoryModal, setShowWeightHistoryModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [statusForm, setStatusForm] = useState<{ status: string, behaviorObservation: string }>({
    status: 'NORMAL',
    behaviorObservation: ''
  });

  const patient = patients.find(p => p.id === id);

  if (!patient) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
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
  };

  const { updatePatient, saveWeightRecord } = useVetContext();

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
    if (patient.status === 'PRECAUTION') return { label: 'PRECAUCIÓN', color: 'text-yellow-600', bg: 'bg-yellow-100', border: 'border-yellow-200' };
    if (patient.status === 'HIGH_RISK') return { label: 'ALTO RIESGO', color: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200' };
    if (patient.status === 'DECEASED') return { label: 'FALLECIDO', color: 'text-outline', bg: 'bg-surface-variant', border: 'border-outline-variant' };
    return { label: 'AL DÍA', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200' };
  };

  const statusInfo = getStatusDisplay();

  const renderTabButton = (tab: Tab, label: string, Icon: React.ElementType) => {
    const isActive = activeTab === tab;
    return (
      <button 
        onClick={() => setActiveTab(tab)}
        className={`h-12 md:h-16 px-4 md:px-6 rounded-xl md:rounded-2xl border transition-colors flex items-center justify-center gap-2 md:gap-3 font-body-sm md:font-body-md shadow-sm flex-grow md:flex-grow-0 ${
          isActive 
            ? 'bg-primary-container/20 border-primary/30 text-primary font-bold' 
            : 'bg-surface border-outline-variant text-on-surface-variant hover:bg-surface-container'
        }`}
      >
        <Icon className={`w-4 h-4 md:w-5 md:h-5 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`} />
        <span className="whitespace-nowrap">{label}</span>
      </button>
    );
  };

  return (
    <div className={`min-h-screen bg-surface text-on-surface antialiased selection:bg-primary-container selection:text-on-primary-container flex flex-col items-center ${isDeceased ? 'grayscale' : ''}`}>
      <TopAppBar 
        title={patient.name} 
        subtitle={`${patient.species}, ${patient.gender === 'M' ? 'Macho' : patient.gender === 'F' ? 'Hembra' : 'Desconocido'}`} 
      />

      {isDeceased && (
        <div className="w-full bg-surface-variant border-b border-outline-variant py-3 px-4 flex items-center justify-center gap-3">
          <AlertTriangle className="w-5 h-5 text-outline" />
          <span className="font-label-md text-outline font-medium tracking-wide">EXPEDIENTE CERRADO POR FALLECIMIENTO (No admite ediciones)</span>
        </div>
      )}

      <main className="w-full max-w-5xl px-4 md:px-container-padding py-8 md:py-12 flex flex-col gap-8 print:p-0 print:m-0">
        
        <section className={`level-1-surface rounded-[24px] p-6 md:p-stack-padding flex flex-col md:flex-row gap-8 items-start relative overflow-hidden group print:hidden ${isDeceased ? 'opacity-90' : ''}`}>
          {!isDeceased && (
            <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary-container opacity-[0.1] rounded-full blur-[80px] group-hover:opacity-[0.15] transition-opacity duration-700"></div>
          )}
          
          <div className="relative w-24 h-24 md:w-32 md:h-32 shrink-0">
            <div className="w-full h-full rounded-2xl border-2 border-surface-container-high shadow-lg bg-surface-variant flex items-center justify-center text-outline">
              {getSpeciesIcon(patient.species)}
            </div>
            {!isDeceased && (
              <div className="absolute -bottom-2 -right-2 bg-surface p-1 rounded-full border border-surface-container-high">
                <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 flex-grow z-10 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="font-display text-4xl text-on-surface m-0">{patient.name}</h2>
                <p className="font-body-lg text-on-surface-variant m-0">{patient.breed || 'Sin raza registrada'}</p>
              </div>
              <div className="flex gap-2 flex-wrap items-center">
                <button 
                  onClick={handleOpenStatusModal}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border font-label-caps text-label-caps tracking-widest uppercase hover:opacity-80 transition-opacity cursor-pointer ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}
                  title={patient.behaviorObservation || 'Clic para cambiar estado'}
                >
                  <Activity className="w-4 h-4" />
                  {statusInfo.label}
                  <Edit className="w-3 h-3 ml-1 opacity-50" />
                </button>
                <div className="flex bg-surface-container rounded-xl border border-outline-variant overflow-hidden shadow-sm hover:shadow transition-shadow">
                  <button 
                    onClick={() => { setNewWeight(patient.weight || ''); setShowWeightModal(true); }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-on-surface font-label-caps text-label-caps tracking-widest uppercase hover:bg-surface-container-high transition-colors cursor-pointer"
                    title="Editar Peso"
                  >
                    {patient.weight ? (patient.weight.toLowerCase().includes('kg') ? patient.weight : `${patient.weight} kg`) : 'SIN PESO'}
                    <Edit className="w-3 h-3 ml-1 opacity-50" />
                  </button>
                  {patient.weight && (
                    <button 
                      onClick={() => setShowWeightHistoryModal(true)}
                      className="inline-flex items-center justify-center px-3 py-2 border-l border-outline-variant hover:bg-surface-container-high transition-colors text-primary bg-surface-container-low"
                      title="Ver Historial de Peso"
                    >
                      <TrendingUp className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 mb-4 bg-surface-container-lowest p-4 rounded-xl border border-surface-container-high">
              <div className="flex flex-col">
                <span className="font-label-sm text-outline uppercase tracking-wider">Tutor</span>
                <span className="font-body-md text-on-surface">{patient.ownerName}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-outline uppercase tracking-wider">Contacto</span>
                <span className="font-body-md text-on-surface">{patient.ownerPhone}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-outline uppercase tracking-wider">Edad</span>
                <span className="font-body-md text-on-surface">{calculateAge(patient.birthDate)}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-outline uppercase tracking-wider">Especie</span>
                <span className="font-body-md text-on-surface capitalize">{patient.species}</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-outline uppercase tracking-wider">Esterilizado</span>
                <span className="font-body-md text-on-surface">{patient.isSterilized ? 'Sí' : 'No'}</span>
              </div>
            </div>

            {!isDeceased && (
              <div className="flex gap-4 print:hidden">
                <Button variant="outline" onClick={() => navigate(`/patient/edit/${patient.id}`)}>
                  <Edit className="w-5 h-5" />
                  Editar Perfil
                </Button>
                <Button variant="ghost" onClick={handleDeletePatient} className="text-red-500 hover:bg-red-50 hover:text-red-600 border border-red-200">
                  <Trash2 className="w-5 h-5" />
                  Eliminar Paciente
                </Button>
              </div>
            )}
          </div>
        </section>

        <nav className="flex flex-wrap gap-2 md:gap-4 pb-4 print:hidden w-full">
          {renderTabButton('activity', 'Actividad', Activity)}
          {renderTabButton('history', 'Historia Clínica', FileText)}
          {renderTabButton('vaccines', 'Vacunas', Syringe)}
          {renderTabButton('surgeries', 'Cirugías', Scissors)}
          {renderTabButton('labs', 'Laboratorio', TestTube)}
          {renderTabButton('prescriptions', 'Recetas', Pill)}
          {renderTabButton('grooming', 'Peluquería', Scissors)}
        </nav>

        <section className="level-1-surface rounded-[24px] p-6 md:p-stack-padding min-h-[400px] print:p-0 print:border-none print:shadow-none print:bg-white print:w-full">
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

      {/* Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-surface-container rounded-[24px] p-6 md:p-8 w-full max-w-md shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
            <div>
              <h2 className="font-display text-2xl text-on-surface mb-2">Estado Clínico</h2>
              <p className="font-body-md text-on-surface-variant">
                Actualiza el estado de manejo y precauciones para este paciente.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Estado</label>
                <select 
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                >
                  <option value="NORMAL">Normal (Verde)</option>
                  <option value="PRECAUTION">Precaución (Amarillo)</option>
                  <option value="HIGH_RISK">Alto Riesgo (Rojo)</option>
                  <option value="DECEASED">Fallecido (Gris)</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Observaciones de Manejo</label>
                <textarea 
                  value={statusForm.behaviorObservation}
                  onChange={(e) => setStatusForm({ ...statusForm, behaviorObservation: e.target.value })}
                  placeholder="Ej. Agresivo al tacto, alergia severa..."
                  rows={3}
                  className="w-full p-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-2">
              <Button variant="ghost" onClick={() => setShowStatusModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveStatus}>Actualizar Estado</Button>
            </div>
          </div>
        </div>
      )}

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-surface-container rounded-[24px] p-6 md:p-8 w-full max-w-sm shadow-2xl flex flex-col gap-6 animate-in fade-in zoom-in duration-300">
            <div>
              <h2 className="font-display text-2xl text-on-surface mb-2">Actualizar Peso</h2>
              <p className="font-body-md text-on-surface-variant">
                Ingresa el nuevo peso del paciente.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant">Peso (kg)</label>
              <input 
                type="text" 
                value={newWeight}
                onChange={(e) => setNewWeight(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-surface-container-low border border-outline-variant focus:border-primary outline-none"
                placeholder="Ej. 12.5"
                autoFocus
              />
            </div>

            <div className="flex justify-end gap-4 mt-2">
              <Button variant="ghost" onClick={() => setShowWeightModal(false)}>Cancelar</Button>
              <Button variant="primary" onClick={handleSaveWeight}>Guardar Peso</Button>
            </div>
          </div>
        </div>
      )}

      {showWeightHistoryModal && (
        <WeightHistoryModal 
          patientId={patient.id} 
          onClose={() => setShowWeightHistoryModal(false)} 
        />
      )}
    </div>
  );
}
