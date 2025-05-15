import { ICharacter, Characters } from './Character';

export class CharacterSelection {
    private selectedCharacterIds: number[] = [];

    public getAvailableCharacters(): ICharacter[] {
        return Characters.filter(char => !this.selectedCharacterIds.includes(char.id));
    }

    public selectCharacter(charId: number): boolean {
        if (!this.selectedCharacterIds.includes(charId)) {
            this.selectedCharacterIds.push(charId);
            return true; // success
        }
        return false; // already taken
    }

    public resetSelection() {
        this.selectedCharacterIds = [];
    }

    public getCharacterAssetPath(characterId: number): string {
        const characterMap: { [key: number]: string } = {
            1: 'character_asset/solsticeFront.svg',
            2: 'character_asset/buckshotFront.svg',
            3: 'character_asset/serpyFront.svg',
            4: 'character_asset/gritFront.svg',
            5: 'character_asset/scoutFront.svg'
            // Add other character mappings here
        };
        return characterMap[characterId] || 'character_asset/solsticeFront.svg'; // Default to Solstice if ID not found
    }
}
