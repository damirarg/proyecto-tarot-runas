// --- DATOS Y CONFIGURACIÓN DE RUNAS VIKINGAS (FUTHARK ANTIGUO) ---

export const mazoRunas = [
    { id: "fehu", nombre: "Fehu", simbolo: "ᚠ", significado: "Riqueza, abundancia, nuevos comienzos y prosperidad." },
    { id: "uruz", nombre: "Uruz", simbolo: "ᚢ", significado: "Fuerza vital, salud, determinación y coraje." },
    { id: "thurisaz", nombre: "Thurisaz", simbolo: "ᚦ", significado: "Protección, puerta de cambio, fuerzas reactivas." },
    { id: "ansuz", nombre: "Ansuz", simbolo: "ᚨ", significado: "Sabiduría, comunicación, señales e inspiración divina." },
    { id: "raidho", nombre: "Raidho", simbolo: "ᚱ", significado: "Viaje, evolución, ritmo personal y dirección." },
    { id: "kenaz", nombre: "Kenaz", simbolo: "ᚲ", significado: "Luz, antorcha, revelación y creatividad." },
    { id: "gebo", nombre: "Gebo", simbolo: "ᛂ", significado: "Regalo, alianza, intercambio justo y unión." },
    { id: "wunjo", nombre: "Wunjo", simbolo: "ᛟ", significado: "Alegría, armonía, realización y bienestar." },
    { id: "hagalaz", nombre: "Hagalaz", simbolo: "ᚺ", significado: "Granizo, transformación abrupta, prueba necesaria." },
    { id: "nauthiz", nombre: "Nauthiz", simbolo: "ᚾ", significado: "Necesidad, paciencia, lección del obstáculo." },
    { id: "isa", nombre: "Isa", simbolo: "ᛁ", significado: "Hielo, pausa, quietud y concentración de energía." },
    { id: "jera", nombre: "Jera", simbolo: "ᛃ", significado: "Cosecha, recompensa al esfuerzo, ciclos naturales." },
    { id: "eihwaz", nombre: "Eihwaz", simbolo: "ᛇ", significado: "Tejo, transformación profunda, resistencia espiritual." },
    { id: "perthro", nombre: "Perthro", simbolo: "ᛈ", significado: "Misterio, destino, secretos revelados y azar." },
    { id: "algiz", nombre: "Algiz", simbolo: "ᛉ", significado: "Protección divina, escudo, intuición despierta." },
    { id: "sowilo", nombre: "Sowilo", simbolo: "ᛋ", significado: "Sol, victoria, éxito, energía plena y claridad." },
    { id: "tiwaz", nombre: "Tiwaz", simbolo: "ᛏ", significado: "Honor, justicia, sacrificio por un bien mayor." },
    { id: "berkano", nombre: "Berkano", simbolo: "ᛒ", significado: "Renacimiento, crecimiento, fertilidad y nuevos proyectos." },
    { id: "ehwaz", nombre: "Ehwaz", simbolo: "ᛖ", significado: "Caballo, avance armónico, confianza y trabajo en equipo." },
    { id: "mannaz", nombre: "Mannaz", simbolo: "ᛗ", significado: "La humanidad, autoconocimiento, integración social." },
    { id: "laguz", nombre: "Laguz", simbolo: "ᛚ", significado: "Agua, emociones, intuición y fluidez." },
    { id: "ingwaz", nombre: "Ingwaz", simbolo: "ᛝ", significado: "Semilla, potencial guardado, descanso reparador." },
    { id: "dagaz", nombre: "Dagaz", simbolo: "ᛞ", significado: "Amanecer, despertar, gran avance y claridad." },
    { id: "othala", nombre: "Othala", simbolo: "ᛟ", significado: "Herencia, hogar, raíces y prosperidad ancestral." }
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