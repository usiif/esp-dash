// src/lib/flashcards.js
// Maps each Level to both the public "Share" link and the student's deck dashboard link.

export const LevelFlashcards = {
    'Level 1': {
      share: 'https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-1',
      deck: 'https://www.brainscape.com/l/dashboard/level-1-spanish-from-zero-23382761/decks'
    },
    'Level 2': {
      share: 'https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-2',
      deck: 'https://www.brainscape.com/l/dashboard/level-2-spanish-from-zero-23382829/decks'
    },
    'Level 3': {
      share: 'https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-3',
      deck: 'https://www.brainscape.com/l/dashboard/level-3-beyond-the-basics-23382371/decks'
    },
    'Level 4': {
      share: 'https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-4',
      deck: 'https://www.brainscape.com/l/dashboard/nivel-4-conversation-basics-23382456/decks'
    },
    'Level 5': {
      share: 'https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-5',
      deck: 'https://www.brainscape.com/l/dashboard/nivel-5-conversation-foundations-21802963/decks'
    },
    'Level 6': {
      share: 'https://calendar.expatspanishlessons.com/activate-brainscape-cards/level-6',
      deck: 'https://www.brainscape.com/l/dashboard/nivel-6-conversation-momentum-22182549/decks'
    }
  };
  
  
  export function getFlashcardLinks(rawLevel) {
    if (!rawLevel) return { share: null, deck: null };
  
    const str = String(rawLevel).trim();
    const match = str.match(/(\d+)/);
    if (!match) return { share: null, deck: null };
  
    const key = `Level ${match[1]}`;
    return LevelFlashcards[key] ?? { share: null, deck: null };
  }
  