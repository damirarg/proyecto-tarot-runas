// --- DATOS Y CONFIGURACIÓN DE RUNAS VIKINGAS (FUTHARK ANTIGUO) ---

export const mazoRunas = [
    { id: "fehu", nombre: "Fehu", simbolo: "ᚠ" },
    { id: "uruz", nombre: "Uruz", simbolo: "ᚢ" },
    { id: "thurisaz", nombre: "Thurisaz", simbolo: "ᚦ" },
    { id: "ansuz", nombre: "Ansuz", simbolo: "ᚨ" },
    { id: "raidho", nombre: "Raidho", simbolo: "ᚱ" },
    { id: "kenaz", nombre: "Kenaz", simbolo: "ᚲ" },
    { id: "gebo", nombre: "Gebo", simbolo: "ᛂ" },
    { id: "wunjo", nombre: "Wunjo", simbolo: "ᛟ" },
    { id: "hagalaz", nombre: "Hagalaz", simbolo: "ᚺ" },
    { id: "nauthiz", nombre: "Nauthiz", simbolo: "ᚾ" },
    { id: "isa", nombre: "Isa", simbolo: "ᛁ" },
    { id: "jera", nombre: "Jera", simbolo: "ᛃ" },
    { id: "eihwaz", nombre: "Eihwaz", simbolo: "ᛇ" },
    { id: "perthro", nombre: "Perthro", simbolo: "ᛈ" },
    { id: "algiz", nombre: "Algiz", simbolo: "ᛉ" },
    { id: "sowilo", nombre: "Sowilo", simbolo: "ᛋ" },
    { id: "tiwaz", nombre: "Tiwaz", simbolo: "ᛏ" },
    { id: "berkano", nombre: "Berkano", simbolo: "ᛒ" },
    { id: "ehwaz", nombre: "Ehwaz", simbolo: "ᛖ" },
    { id: "mannaz", nombre: "Mannaz", simbolo: "ᛗ" },
    { id: "laguz", nombre: "Laguz", simbolo: "ᛚ" },
    { id: "ingwas", nombre: "Ingwaz", simbolo: "ᛝ" },
    { id: "dagaz", nombre: "Dagaz", simbolo: "ᛞ" },
    { id: "othala", nombre: "Othala", simbolo: "ᛟ" }
];

export const catalogoTiradasRunas = [
    { id: "runa_1", nombre: "Runa de Odin (1)", desc: "Consejo directo del oráculo" },
    { id: "runa_3", nombre: "Las Tres Nornas (3)", desc: "Urd (Pasado), Verdandi (Presente) y Skuld (Futuro)" },
    { id: "runa_5", nombre: "La Cruz de Thor (5)", desc: "Situación, reto, ayuda, camino y desenlace" }
];

export function mezclarRunas(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}