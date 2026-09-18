import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { useVetContext } from '../context/VetContext';

type WizardStep = 1 | 2;

export default function NewPatient() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { savePatient, updatePatient, patients } = useVetContext();

  const isEditing = Boolean(id);
  
  const [step, setStep] = useState<WizardStep>(1);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isAgeFormat, setIsAgeFormat] = useState(false);
  const [ageData, setAgeData] = useState({ years: '', months: '', days: '' });
  
  const [formData, setFormData] = useState({
    species: '',
    name: '',
    breed: '',
    gender: '' as 'M' | 'F' | 'U' | '',
    birthDate: '',
    weight: '',
    color: '',
    isSterilized: false,
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerId: '',
    notes: ''
  });

  useEffect(() => {
    if (isEditing && id) {
      const patient = patients.find(p => p.id === id);
      if (patient) {
        setFormData({
          name: patient.name,
          species: patient.species,
          breed: patient.breed || '',
          gender: (patient.gender as 'M' | 'F' | 'U') || 'U',
          birthDate: patient.birthDate || '',
          weight: patient.weight || '',
          color: patient.color || '',
          isSterilized: patient.isSterilized || false,
          ownerName: patient.ownerName,
          ownerPhone: patient.ownerPhone,
          ownerEmail: patient.ownerEmail || '',
          ownerId: patient.ownerId || '',
          notes: ''
        });
        setStep(2);
      }
    }
  }, [isEditing, id, patients]);

  const speciesList = [
    { icon: '🐶', name: 'Perro' },
    { icon: '🐱', name: 'Gato' },
    { icon: '🐰', name: 'Conejo' },
    { icon: '🦜', name: 'Ave' },
    { icon: '🐹', name: 'Hámster' },
    { icon: '🦔', name: 'Erizo' },
    { icon: '🦝', name: 'Hurón' },
    { icon: '🐢', name: 'Tortuga' },
    { icon: '🐍', name: 'Reptil' },
    { icon: '🐎', name: 'Equino' },
    { icon: '🐄', name: 'Bovino' },
    { icon: '🐐', name: 'Caprino' },
    { icon: '🐑', name: 'Ovino' },
    { icon: '🐷', name: 'Porcino' },
    { icon: '🐠', name: 'Peces' },
  ];

  const handleBack = () => {
    if (step > 1 && !isEditing) setStep(1);
    else navigate(-1);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value === '' || /^\d+$/.test(value)) {
      setAgeData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async () => {
    let finalBirthDate = formData.birthDate;

    if (isAgeFormat) {
      if (!ageData.years) {
        alert("Por favor ingresa al menos los años de edad.");
        return;
      }
      const today = new Date();
      const years = parseInt(ageData.years) || 0;
      const months = parseInt(ageData.months) || 0;
      const days = parseInt(ageData.days) || 0;
      
      today.setFullYear(today.getFullYear() - years);
      today.setMonth(today.getMonth() - months);
      today.setDate(today.getDate() - days);
      
      finalBirthDate = today.toISOString().split('T')[0];
    }

    if (!formData.name || !formData.gender || !formData.ownerName || !formData.ownerPhone || !finalBirthDate || !formData.ownerId) {
      alert("Por favor completa los campos obligatorios: Nombre, Sexo, Nacimiento/Edad, Nombre del tutor, Teléfono e Identificación.");
      return;
    }
    
    setIsSaving(true);
    try {
      if (isEditing && id) {
        await updatePatient(id, {
          name: formData.name,
          species: formData.species,
          breed: formData.breed || undefined,
          gender: formData.gender as 'M' | 'F' | 'U',
          birthDate: finalBirthDate,
          weight: formData.weight || undefined,
          color: formData.color || undefined,
          isSterilized: formData.isSterilized,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          ownerEmail: formData.ownerEmail || undefined,
          ownerId: formData.ownerId || undefined,
        });
        navigate(`/patient/${id}`);
      } else {
        const patient = await savePatient({
          name: formData.name,
          species: formData.species,
          breed: formData.breed || undefined,
          gender: formData.gender as 'M' | 'F' | 'U',
          birthDate: finalBirthDate,
          weight: formData.weight || undefined,
          color: formData.color || undefined,
          isSterilized: formData.isSterilized,
          ownerName: formData.ownerName,
          ownerPhone: formData.ownerPhone,
          ownerEmail: formData.ownerEmail || undefined,
          ownerId: formData.ownerId || undefined,
          status: 'NORMAL'
        });
        navigate(`/patient/${patient.id}`);
      }
    } catch (error: any) {
      console.error("Error al guardar el paciente:", error);
      alert(`Error al guardar el paciente: ${error.message || error}`);
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-container-padding bg-background text-on-background">
      
      <header className="w-full max-w-7xl flex justify-between items-center mb-6 md:mb-md sticky top-0 bg-background/90 py-2 md:py-4 z-50 backdrop-blur-md">
        <button 
          onClick={handleBack}
          aria-label="Volver" 
          className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-surface-container-low text-on-surface hover:text-primary-container transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1 text-center">
          <h1 className="font-headline-lg-mobile md:font-headline-lg text-2xl md:text-headline-lg text-on-surface m-0">
            {step === 1 && '¿Qué especie es el nuevo paciente?'}
            {step === 2 && (isEditing ? 'Editar paciente' : 'Datos del paciente')}
          </h1>
        </div>
        <div className="w-12 h-12"></div>
      </header>

      <main className="w-full max-w-5xl flex-1 flex flex-col items-center gap-12 mt-4">
        
        {!isEditing && (
          <div className="w-full max-w-sm flex items-center justify-between px-4 mb-4">
            <div className={`h-2 flex-1 rounded-l-full bg-primary`}></div>
            <div className="w-1 h-2 bg-background"></div>
            <div className={`h-2 flex-1 rounded-r-full ${step >= 2 ? 'bg-primary' : 'bg-surface-variant'}`}></div>
          </div>
        )}

        {step === 1 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-[20px] w-full">
            {speciesList.map((s) => (
              <button 
                key={s.name}
                onClick={() => {
                  setFormData(prev => ({ ...prev, species: s.name }));
                  setStep(2);
                }}
                className="bg-surface-container-lowest border border-outline-variant shadow-sm rounded-[24px] p-md flex flex-col items-center justify-center gap-base aspect-square w-full hover:-translate-y-1 hover:bg-surface-container hover:border-primary hover:shadow-lg transition-all duration-200"
              >
                <span className="text-display font-display leading-none mb-2">{s.icon}</span>
                <span className="font-body-md text-body-md text-on-surface font-semibold">{s.name}</span>
              </button>
            ))}
            <button 
              onClick={() => {
                setFormData(prev => ({ ...prev, species: 'Otra' }));
                setStep(2);
              }}
              className="bg-surface-container-lowest border-2 border-dashed border-outline-variant rounded-[24px] p-md flex flex-col items-center justify-center gap-base aspect-square w-full hover:border-primary-container transition-all"
            >
              <div className="text-[48px] text-on-surface-variant mb-2 font-display leading-none">+</div>
              <span className="font-body-md text-body-md text-on-surface-variant font-semibold">Otra</span>
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="w-full max-w-3xl bg-surface-container-lowest border border-outline-variant rounded-[32px] p-8 shadow-sm flex flex-col gap-6">
            
            {formData.species && (
              <div className="flex items-center gap-3 bg-surface-container px-4 py-2 rounded-xl self-start">
                <span className="font-label-md text-primary font-semibold uppercase tracking-wider">
                  Especie: {formData.species}
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Nombre del Paciente *</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="Ej. Max"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Raza (Opcional)</label>
                <input 
                  type="text" 
                  name="breed"
                  value={formData.breed}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="Ej. Golden Retriever"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Sexo *</label>
                <select 
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface appearance-none cursor-pointer"
                >
                  <option value="" disabled>Selecciona...</option>
                  <option value="M">Macho</option>
                  <option value="F">Hembra</option>
                  <option value="U">Desconocido</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <label className="font-label-md text-on-surface-variant">
                    {isAgeFormat ? 'Edad Aproximada *' : 'Fecha de Nacimiento *'}
                  </label>
                  <button 
                    type="button" 
                    onClick={() => setIsAgeFormat(!isAgeFormat)}
                    className="text-primary text-xs hover:underline font-label-sm"
                  >
                    Usar {isAgeFormat ? 'Fecha Exacta' : 'Edad Aproximada'}
                  </button>
                </div>
                {!isAgeFormat ? (
                  <input 
                    type="date" 
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  />
                ) : (
                  <div className="flex gap-2 w-full">
                    <input 
                      type="text" 
                      name="years"
                      value={ageData.years}
                      onChange={handleAgeChange}
                      placeholder="Años *"
                      className="w-1/3 h-12 md:h-16 px-2 md:px-4 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant text-center"
                    />
                    <input 
                      type="text" 
                      name="months"
                      value={ageData.months}
                      onChange={handleAgeChange}
                      placeholder="Meses"
                      className="w-1/3 h-12 md:h-16 px-2 md:px-4 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant text-center"
                    />
                    <input 
                      type="text" 
                      name="days"
                      value={ageData.days}
                      onChange={handleAgeChange}
                      placeholder="Días"
                      className="w-1/3 h-12 md:h-16 px-2 md:px-4 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant text-center"
                    />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Peso (Opcional)</label>
                <input 
                  type="text" 
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="Ej. 12 kg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Color (Opcional)</label>
                <input 
                  type="text" 
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="Ej. Blanco con manchas negras"
                />
              </div>
              <div className="flex flex-col gap-2 justify-center mt-4 md:mt-0">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-surface-container-low border border-outline-variant hover:border-primary transition-all">
                  <input 
                    type="checkbox" 
                    name="isSterilized"
                    checked={formData.isSterilized}
                    onChange={handleChange}
                    className="w-6 h-6 rounded text-primary focus:ring-primary focus:ring-2 accent-primary cursor-pointer"
                  />
                  <span className="font-label-lg text-on-surface select-none">¿Está esterilizado/a?</span>
                </label>
              </div>
            </div>

            <div className="w-full h-px bg-surface-variant my-2"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Nombre del Tutor *</label>
                <input 
                  type="text" 
                  name="ownerName"
                  value={formData.ownerName}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="Nombre completo"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Teléfono *</label>
                <input 
                  type="tel" 
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="Ej. 099 123 4567"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Correo Electrónico (Opcional)</label>
                <input 
                  type="email" 
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="font-label-md text-on-surface-variant">Identificación *</label>
                <input 
                  type="text" 
                  name="ownerId"
                  value={formData.ownerId}
                  onChange={handleChange}
                  className="w-full h-12 md:h-16 px-4 md:px-6 rounded-2xl bg-surface-container-low border border-outline-variant focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-body-lg text-on-surface placeholder:text-outline-variant"
                  placeholder="DNI, Cédula..."
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-4">
              <Button variant="primary" onClick={handleSave} disabled={isSaving}>
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : (isEditing ? 'Actualizar Ficha' : 'Guardar y Ver Ficha')}
              </Button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
