'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as Tone from 'tone';
import { PIANO_SAMPLES } from '@/config/piano';

interface AudioContextType {
  isAudioInitialized: boolean;
  initializeAudio: () => Promise<void>;
  sampler: Tone.Sampler | null;
}

const AudioCtx = createContext<AudioContextType | undefined>(undefined);

let sampler: Tone.Sampler | null = null;

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  useEffect(() => {
    const setupAudio = async () => {
      if (!sampler) {
        try {
          sampler = new Tone.Sampler({
            urls: PIANO_SAMPLES.urls,
            volume: -5, // Volumen predeterminado optimizado
            attack: PIANO_SAMPLES.envelope.attack,
            release: PIANO_SAMPLES.envelope.release,
            onload: () => {
              console.log('Piano samples loaded successfully');
            }
          }).toDestination();

          // Esperar a que las muestras se carguen
          await new Promise<void>((resolve) => {
            const checkLoaded = () => {
              if (sampler?.loaded) {
                resolve();
              } else {
                setTimeout(checkLoaded, 100);
              }
            };
            checkLoaded();
          });

          // Una vez que las muestras están cargadas, inicializamos el contexto de audio
          await Tone.start();
          setIsAudioInitialized(true);
          console.log('Audio system initialized');
        } catch (error) {
          console.error('Error initializing audio:', error);
          setIsAudioInitialized(false);
        }
      }
    };

    setupAudio();

    return () => {
      if (sampler) {
        sampler.dispose();
        sampler = null;
        setIsAudioInitialized(false);
      }
    };
  }, []);

  const initializeAudio = async () => {
    try {
      if (!isAudioInitialized) {
        await Tone.start();
        setIsAudioInitialized(true);
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
      setIsAudioInitialized(false);
    }
  };

  return (
    <AudioCtx.Provider
      value={{
        isAudioInitialized,
        initializeAudio,
        sampler
      }}
    >
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudio() {
  const context = useContext(AudioCtx);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
}
