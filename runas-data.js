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
    { 
        id: "cruz_runica", 
        nombre: "Cruz Rúnica (4)", 
        desc: "Situación, obstáculo, reflexión y consejo." 
    },
    { 
        id: "nornas", 
        nombre: "Tríptico de las Nornas (3)", 
        desc: "Urdh (Pasado), Verdhandi (Presente) y Skuld (Futuro)." 
    },
    { 
        id: "tirada_5", 
        nombre: "Tirada de 5 Runas (5)", 
        desc: "Visión global, desafío, momento actual, acciones y futuro." 
    },
    { 
        id: "tirada_7", 
        nombre: "Tirada de 7 Runas / Mimir (7)", 
        desc: "Pares temporales (pasado, presente, futuro) y consejo final." 
    },
    { 
        id: "cruz_celta", 
        nombre: "Cruz Celta Rúnica (6)", 
        desc: "Pasado, presente, futuro, bases, naturaleza y resultado." 
    },
    { 
        id: "martillo_thor", 
        nombre: "El Martillo de Thor / Tirada en T (6)", 
        desc: "Pasado, presente, futuro, bases, retos e influencia." 
    },
    { 
        id: "yggdrasil", 
        nombre: "Yggdrasil (9)", 
        desc: "El árbol sagrado: situación, percepción, retos, fuerzas y guía." 
    }
];

export function mezclarRunas(array) {
    const copia = [...array];
    for (let i = copia.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia;
}