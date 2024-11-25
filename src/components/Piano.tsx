import { useEffect, useState, useCallback, useRef } from 'react';
import * as Tone from 'tone';
import { useAudio } from '@/contexts/AudioContext';
import { PIANO_SAMPLES } from '@/config/piano';

interface PianoProps {
  octave: number;
  volume?: number;
}

interface ActiveNote {
  key: string;
  note: string;
}

const Piano: React.FC<PianoProps> = ({ octave, volume = 0 }) => {
  const [sampler, setSampler] = useState<Tone.Sampler | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [activeNotes, setActiveNotes] = useState<ActiveNote[]>([]);
  const { isAudioInitialized } = useAudio();
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
    { note: 'E', key: 'Ñ', label: 'Ñ', position: 9, octaveOffset: 1 },
  ];

  const blackKeys = [
    { note: 'C#', key: 'W', label: 'W', position: 0 },
    { note: 'D#', key: 'E', label: 'E', position: 1 },
    { note: 'F#', key: 'T', label: 'T', position: 3 },
    { note: 'G#', key: 'Y', label: 'Y', position: 4 },
    { note: 'A#', key: 'U', label: 'U', position: 5 },
    { note: 'C#', key: 'O', label: 'O', position: 7, octaveOffset: 1 },
    { note: 'D#', key: 'P', label: 'P', position: 8, octaveOffset: 1 },
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
    if (isAudioInitialized) {
      setIsLoading(true);
      const newSampler = new Tone.Sampler({
        urls: PIANO_SAMPLES.urls,
        onload: () => {
          setIsLoading(false);
          console.log('Piano samples loaded successfully');
        },
        onerror: (error) => {
          console.error('Error loading piano samples:', error);
          setIsLoading(false);
        },
        volume: PIANO_SAMPLES.volume + volume,
        release: PIANO_SAMPLES.release,
        attack: 0.005
      }).connect(new Tone.Gain(0.8)).toDestination();

      setSampler(newSampler);

      return () => {
        newSampler.dispose();
      };
    }
  }, [isAudioInitialized, volume]);

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

  const playNote = useCallback((note: string, octaveOffset: number = 0, key: string) => {
    if (sampler && isAudioInitialized && !isLoading) {
      try {
        const targetOctave = octave + octaveOffset;
        const nearestNote = getNearestSample(note, targetOctave);
        const velocity = calculateVelocity(note, targetOctave);

        sampler.triggerAttack(nearestNote, Tone.now(), velocity);
        setActiveNotes(prev => [...prev, { key, note: nearestNote }]);
      } catch (error) {
        console.error('Error playing note:', error);
      }
    }
  }, [sampler, octave, isAudioInitialized, isLoading, getNearestSample, calculateVelocity]);

  const stopNote = useCallback((key: string) => {
    if (sampler && isAudioInitialized && !isLoading) {
      try {
        const noteToStop = activeNotes.find(n => n.key === key);
        if (noteToStop) {
          sampler.triggerRelease(noteToStop.note, Tone.now());
          setActiveNotes(prev => prev.filter(n => n.key !== key));
        }
      } catch (error) {
        console.error('Error stopping note:', error);
      }
    }
  }, [sampler, isAudioInitialized, isLoading, activeNotes]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (keyMap[key] && !activeKeys.has(key)) {
      setActiveKeys(prev => new Set(prev).add(key));
      playNote(keyMap[key].note, keyMap[key].octaveOffset, key);
    }
  }, [keyMap, activeKeys, playNote]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (keyMap[key]) {
      setActiveKeys(prev => {
        const newSet = new Set(prev);
        newSet.delete(key);
        return newSet;
      });
      stopNote(key);
    }
  }, [keyMap, stopNote]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

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
                  relative w-16 h-64
                  border-l border-gray-300
                  last:border-r
                  ${isActive ? 'bg-gray-200' : 'bg-white'}
                  hover:bg-gray-50
                  active:bg-gray-200
                  transition-colors
                  duration-75
                  focus:outline-none
                  rounded-b-md
                `}
                onMouseDown={() => {
                  if (isAudioInitialized && !isLoading) {
                    const keyLower = key.key.toLowerCase();
                    playNote(key.note, key.octaveOffset || 0, keyLower);
                    setActiveKeys(prev => new Set(prev).add(keyLower));
                  }
                }}
                onMouseUp={() => {
                  if (isAudioInitialized && !isLoading) {
                    const keyLower = key.key.toLowerCase();
                    setActiveKeys(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(keyLower);
                      return newSet;
                    });
                    stopNote(keyLower);
                  }
                }}
                onMouseLeave={() => {
                  if (isAudioInitialized && !isLoading) {
                    const keyLower = key.key.toLowerCase();
                    if (activeKeys.has(keyLower)) {
                      setActiveKeys(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(keyLower);
                        return newSet;
                      });
                      stopNote(keyLower);
                    }
                  }
                }}
              >
                <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-gray-900 font-medium text-sm">
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
            const leftPosition = `${key.position * 4}rem`;
            return (
              <button
                key={key.key}
                className={`
                  absolute w-10 h-40
                  ${isActive ? 'bg-gray-700' : 'bg-black'}
                  hover:bg-gray-800
                  active:bg-gray-700
                  transition-colors
                  duration-75
                  focus:outline-none
                  rounded-b-md
                  z-10
                `}
                style={{
                  left: `calc(${leftPosition} + 0.75rem)`,
                }}
                onMouseDown={() => {
                  if (isAudioInitialized && !isLoading) {
                    const keyLower = key.key.toLowerCase();
                    playNote(key.note, key.octaveOffset || 0, keyLower);
                    setActiveKeys(prev => new Set(prev).add(keyLower));
                  }
                }}
                onMouseUp={() => {
                  if (isAudioInitialized && !isLoading) {
                    const keyLower = key.key.toLowerCase();
                    setActiveKeys(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(keyLower);
                      return newSet;
                    });
                    stopNote(keyLower);
                  }
                }}
                onMouseLeave={() => {
                  if (isAudioInitialized && !isLoading) {
                    const keyLower = key.key.toLowerCase();
                    if (activeKeys.has(keyLower)) {
                      setActiveKeys(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(keyLower);
                        return newSet;
                      });
                      stopNote(keyLower);
                    }
                  }
                }}
              >
                <span className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm">
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
