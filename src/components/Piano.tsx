import { useEffect, useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { useAudio } from '@/contexts/AudioContext';
import { PIANO_SAMPLES } from '@/config/piano';

interface PianoProps {
  octave: number;
}

interface ActiveNote {
  key: string;
  note: string;
}

const Piano: React.FC<PianoProps> = ({ octave }) => {
  const { isAudioInitialized, initializeAudio, sampler: globalSampler } = useAudio();
  const [isLoading, setIsLoading] = useState(true);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
  const loadingRef = useRef<HTMLDivElement>(null);

  // Definición de teclas con posiciones específicas
  const whiteKeys = [
    { note: 'C', key: 'A', label: 'A', position: 0 },
    { note: 'D', key: 'S', label: 'S', position: 1 },
    { note: 'E', key: 'D', label: 'D', position: 2 },
    { note: 'F', key: 'F', label: 'F', position: 3 },
    { note: 'G', key: 'G', label: 'G', position: 4 },
    { note: 'A', key: 'H', label: 'H', position: 5 },
    { note: 'B', key: 'J', label: 'J', position: 6 },
    { note: 'C', key: 'K', label: 'K', position: 7, octaveOffset: 1 },
    { note: 'D', key: 'L', label: 'L', position: 8, octaveOffset: 1 },
    { note: 'E', key: 'ñ', label: 'Ñ', position: 9, octaveOffset: 1 },
  ];

  const blackKeys = [
    { note: 'C#', key: 'W', label: 'W', position: 1 },    // Entre A y S
    { note: 'D#', key: 'E', label: 'E', position: 2 },    // Entre S y D
    { note: 'F#', key: 'T', label: 'T', position: 4 },    // Entre F y G
    { note: 'G#', key: 'Y', label: 'Y', position: 5 },    // Entre G y H
    { note: 'A#', key: 'U', label: 'U', position: 6 },    // Entre H y J
    { note: 'C#', key: 'O', label: 'O', position: 8, octaveOffset: 1 },  // Entre K y L
    { note: 'D#', key: 'P', label: 'P', position: 9, octaveOffset: 1 },  // Entre L y Ñ
  ];

  const keyMap = {
    ...Object.fromEntries(
      whiteKeys.map(k => [k.key.toLowerCase(), { note: k.note, octaveOffset: k.octaveOffset || 0 }])
    ),
    ...Object.fromEntries(
      blackKeys.map(k => [k.key.toLowerCase(), { note: k.note, octaveOffset: k.octaveOffset || 0 }])
    ),
  };

  useEffect(() => {
    // Inicializar el audio cuando se monte el componente
    const initAudio = async () => {
      try {
        await initializeAudio();
      } catch (error) {
        console.error('Error initializing audio:', error);
      }
    };
    initAudio();
  }, [initializeAudio]);

  useEffect(() => {
    // Actualizar estado de carga cuando el sampler esté listo
    if (globalSampler?.loaded && isAudioInitialized) {
      setIsLoading(false);
    }
  }, [globalSampler?.loaded, isAudioInitialized]);

  const getNearestSample = useCallback((note: string, octave: number): string => {
    const fullNote = `${note}${octave}`;
    if (PIANO_SAMPLES.urls.hasOwnProperty(fullNote)) {
      return fullNote;
    }

    // Buscar la nota más cercana disponible
    const octaves = [4, 3, 5, 2, 6, 1, 7]; // Prioridad de octavas
    const notes = ['C', 'D#', 'F#', 'A']; // Notas disponibles en las muestras

    // Primero intentar en la misma octava
    for (const n of notes) {
      if (PIANO_SAMPLES.urls.hasOwnProperty(`${n}${octave}`)) {
        return `${n}${octave}`;
      }
    }

    // Si no se encuentra, buscar en otras octavas
    for (const o of octaves) {
      for (const n of notes) {
        if (PIANO_SAMPLES.urls.hasOwnProperty(`${n}${o}`)) {
          return `${n}${o}`;
        }
      }
    }

    return 'C4'; // Nota por defecto si no se encuentra ninguna más cercana
  }, []);

  const calculateVelocity = useCallback((note: string, octave: number): number => {
    // Ajustar la velocidad basada en la octava para un sonido más natural
    const baseVelocity = 0.7;
    const randomFactor = Math.random() * 0.2;
    const octaveAdjustment = Math.max(0, 1 - Math.abs(octave - 4) * 0.1);
    
    return Math.min(1, baseVelocity * octaveAdjustment + randomFactor);
  }, []);

  const handleNoteStart = useCallback((note: string, octaveOffset: number = 0) => {
    if (!globalSampler?.loaded || !isAudioInitialized) return;

    const fullNote = `${note}${octave + (octaveOffset || 0)}`;
    
    // Evitar duplicar la misma nota
    if (!activeNotes.some(an => an.note === fullNote)) {
      const velocity = 0.7 + Math.random() * 0.3; // Añade variación natural al velocity
      globalSampler.triggerAttack(fullNote, Tone.now(), velocity);
      setActiveNotes(prev => [...prev, { key: note, note: fullNote }]);
    }
  }, [activeNotes, globalSampler, isAudioInitialized, octave]);

  const handleNoteEnd = useCallback((note: string, octaveOffset: number = 0) => {
    if (!globalSampler?.loaded || !isAudioInitialized) return;

    const fullNote = `${note}${octave + (octaveOffset || 0)}`;
    globalSampler.triggerRelease(fullNote, Tone.now());
    setActiveNotes(prev => prev.filter(an => an.note !== fullNote));
  }, [globalSampler, isAudioInitialized, octave]);

  // Manejo de eventos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      let key = event.key.toLowerCase();
      
      // Manejo especial para la tecla 'ñ'
      if (event.code === 'Semicolon' && event.location === 0) {
        key = 'ñ';
      }
      
      if (keyMap[key] && !event.repeat) {
        const { note, octaveOffset } = keyMap[key];
        handleNoteStart(note, octaveOffset);
        setActiveKeys(prev => new Set([...prev, key]));
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      let key = event.key.toLowerCase();
      
      // Manejo especial para la tecla 'ñ'
      if (event.code === 'Semicolon' && event.location === 0) {
        key = 'ñ';
      }
      
      if (keyMap[key]) {
        const { note, octaveOffset } = keyMap[key];
        handleNoteEnd(note, octaveOffset);
        setActiveKeys(prev => {
          const newSet = new Set(prev);
          newSet.delete(key);
          return newSet;
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNoteStart, handleNoteEnd, keyMap]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-8">
      {isLoading && (
        <div 
          ref={loadingRef}
          className="fixed top-4 left-1/2 transform -translate-x-1/2 text-gray-600 text-sm"
        >
          Cargando sonidos de piano...
        </div>
      )}
      <div className="relative inline-flex">
        {/* Teclas blancas */}
        <div className="relative flex">
          {whiteKeys.map((key) => {
            const isActive = activeKeys.has(key.key.toLowerCase());
            return (
              <button
                key={key.key}
                className={`
                  relative w-16 h-60
                  border border-gray-300
                  ${isActive ? 'bg-blue-300' : 'bg-white'}
                  hover:bg-gray-50
                  active:bg-blue-300
                  transition-colors duration-75
                  focus:outline-none
                  first:rounded-l-md last:rounded-r-md
                `}
                onMouseDown={() => handleNoteStart(key.note, key.octaveOffset)}
                onMouseUp={() => handleNoteEnd(key.note, key.octaveOffset)}
                onMouseLeave={() => {
                  if (activeKeys.has(key.key.toLowerCase())) {
                    handleNoteEnd(key.note, key.octaveOffset);
                  }
                }}
                disabled={isLoading}
              >
                <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-black font-medium text-sm">
                  {key.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Teclas negras */}
        <div className="absolute top-0 left-0 flex">
          {blackKeys.map((key) => {
            const isActive = activeKeys.has(key.key.toLowerCase());
            const leftPosition = `${(key.position * 4) - 1}rem`;
            return (
              <button
                key={key.key}
                style={{ left: leftPosition }}
                className={`
                  absolute w-8 h-36
                  ${isActive ? 'bg-blue-300' : 'bg-gray-800'}
                  hover:bg-gray-700
                  active:bg-blue-300
                  transition-colors duration-75
                  focus:outline-none
                  rounded-b-md
                `}
                onMouseDown={() => handleNoteStart(key.note, key.octaveOffset)}
                onMouseUp={() => handleNoteEnd(key.note, key.octaveOffset)}
                onMouseLeave={() => {
                  if (activeKeys.has(key.key.toLowerCase())) {
                    handleNoteEnd(key.note, key.octaveOffset);
                  }
                }}
                disabled={isLoading}
              >
                <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white font-medium text-sm">
                  {key.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-gray-600">
        <p className="text-center">Octava actual: {octave}</p>
        <p className="text-sm text-center">Usa Z/X para cambiar de octava</p>
      </div>
    </div>
  );
};

export default Piano;
