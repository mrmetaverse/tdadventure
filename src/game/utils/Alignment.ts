import { Alignment, AlignmentAxis, MoralityAxis } from '@types/character';

export class AlignmentSystem {
  static getAlignmentFromValues(lawfulValue: number, goodValue: number): Alignment {
    const lawfulChaotic: AlignmentAxis = 
      lawfulValue < -33 ? 'lawful' : 
      lawfulValue > 33 ? 'chaotic' : 
      'neutral';
    
    const goodEvil: MoralityAxis = 
      goodValue < -33 ? 'good' : 
      goodValue > 33 ? 'evil' : 
      'neutral';

    return {
      lawfulChaotic,
      goodEvil,
      lawfulValue: Math.max(-100, Math.min(100, lawfulValue)),
      goodValue: Math.max(-100, Math.min(100, goodValue)),
    };
  }

  static getAlignmentName(alignment: Alignment): string {
    const lawfulChaoticName = 
      alignment.lawfulChaotic === 'lawful' ? 'Lawful' :
      alignment.lawfulChaotic === 'chaotic' ? 'Chaotic' :
      'Neutral';
    
    const goodEvilName = 
      alignment.goodEvil === 'good' ? 'Good' :
      alignment.goodEvil === 'evil' ? 'Evil' :
      'Neutral';

    if (lawfulChaoticName === 'Neutral' && goodEvilName === 'Neutral') {
      return 'True Neutral';
    }

    return `${lawfulChaoticName} ${goodEvilName}`;
  }

  static getStartingAlignment(
    lawfulChaotic: AlignmentAxis,
    goodEvil: MoralityAxis
  ): Alignment {
    const lawfulValue = 
      lawfulChaotic === 'lawful' ? -50 :
      lawfulChaotic === 'chaotic' ? 50 :
      0;
    
    const goodValue = 
      goodEvil === 'good' ? -50 :
      goodEvil === 'evil' ? 50 :
      0;

    return this.getAlignmentFromValues(lawfulValue, goodValue);
  }

  static adjustAlignment(
    currentAlignment: Alignment,
    lawfulChange: number,
    goodChange: number
  ): Alignment {
    const newLawfulValue = currentAlignment.lawfulValue + lawfulChange;
    const newGoodValue = currentAlignment.goodValue + goodChange;

    return this.getAlignmentFromValues(newLawfulValue, newGoodValue);
  }

  static getAlignmentPosition(alignment: Alignment): { x: number; y: number } {
    // Convert to 0-2 grid position
    const x = alignment.lawfulValue < -33 ? 0 : alignment.lawfulValue > 33 ? 2 : 1;
    const y = alignment.goodValue < -33 ? 0 : alignment.goodValue > 33 ? 2 : 1;
    return { x, y };
  }

  static getAlignmentFromPosition(x: number, y: number): Alignment {
    const lawfulValue = x === 0 ? -50 : x === 2 ? 50 : 0;
    const goodValue = y === 0 ? -50 : y === 2 ? 50 : 0;
    return this.getAlignmentFromValues(lawfulValue, goodValue);
  }

  static getAlignmentGrid(): Array<Array<{ lawful: AlignmentAxis; good: MoralityAxis; name: string }>> {
    return [
      [
        { lawful: 'lawful', good: 'good', name: 'Lawful Good' },
        { lawful: 'neutral', good: 'good', name: 'Neutral Good' },
        { lawful: 'chaotic', good: 'good', name: 'Chaotic Good' },
      ],
      [
        { lawful: 'lawful', good: 'neutral', name: 'Lawful Neutral' },
        { lawful: 'neutral', good: 'neutral', name: 'True Neutral' },
        { lawful: 'chaotic', good: 'neutral', name: 'Chaotic Neutral' },
      ],
      [
        { lawful: 'lawful', good: 'evil', name: 'Lawful Evil' },
        { lawful: 'neutral', good: 'evil', name: 'Neutral Evil' },
        { lawful: 'chaotic', good: 'evil', name: 'Chaotic Evil' },
      ],
    ];
  }
}

