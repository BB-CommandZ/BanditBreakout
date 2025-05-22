export interface ICharacter {
    id: number;
    name: string;
    description: string;
    goal: string;
}

export const Characters: ICharacter[] = [
    {
        id: 1,
        name: "Buckshot",
        description: "A lone guncat whose soul is rumoured to be traded to a desert spirit for vengeance. Hardened by the sun and driven by justice.",
        goal: "Bring Spindle to justice."
    },
    {
        id: 2,
        name: "Serpy",
        description: "The town’s cheerful cowboy, always ready for adventure and fun.",
        goal: "Be friends with Spindle."
    },
    {
        id: 3,
        name: "Grit",
        description: "The grumpy bartender who keeps the Wild Oasis Saloon running smoothly.",
        goal: "Reform Spindle."
    },
    {
        id: 4,
        name: "Scout",
        description: "The town's cheerful protector, always on patrol with a wagging tail.",
        goal: "Protect Buckshot and defeat Spindle."
    },
    {
        id: 5,
        name: "Solstice",
        description: "A mysterious thief who moves like a shadow, never caught and always elusive.",
        goal: "Collect the bounty on Spindle."
    }
];