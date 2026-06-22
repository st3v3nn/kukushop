type ClickTone = 'soft' | 'bright';

let firstInteractionArmed = false;
let chickenAudio: HTMLAudioElement | null = null;
let lastChickenPlayAt = 0;

const CHICKEN_SOUND_SRC = '/assets/sounds/chicken.mp3';
const CHICKEN_SOUND_DEBOUNCE_MS = 160;

const getChickenAudio = () => {
  if (typeof window === 'undefined') return null;

  if (!chickenAudio) {
    chickenAudio = new Audio(CHICKEN_SOUND_SRC);
    chickenAudio.preload = 'auto';
  }

  return chickenAudio;
};

const playChickenSound = async (volume = 1) => {
  const audio = getChickenAudio();
  if (!audio) return;

  const now = Date.now();
  if (now - lastChickenPlayAt < CHICKEN_SOUND_DEBOUNCE_MS) return;
  lastChickenPlayAt = now;

  audio.pause();
  audio.currentTime = 0;
  audio.volume = volume;
  await audio.play();
};

export const playClickSound = (_tone: ClickTone = 'soft') => {
  // void playChickenSound(1).catch(() => undefined);
};

export const playNotificationTune = () => {
  // void playChickenSound(1).catch(() => undefined);
};

export const playCheckoutCompleteSound = () => {
  void playChickenSound(1).catch(() => undefined);
};

export const armSplashToneOnFirstInteraction = () => {
  if (firstInteractionArmed || typeof window === 'undefined') return;
  firstInteractionArmed = true;

  const playOnce = () => {
    void playChickenSound(1).catch(() => undefined);
  };

  window.addEventListener('pointerdown', playOnce, { once: true, passive: true });
  window.addEventListener('keydown', playOnce, { once: true });
};
