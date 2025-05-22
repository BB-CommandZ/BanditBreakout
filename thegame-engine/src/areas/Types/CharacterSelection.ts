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
}