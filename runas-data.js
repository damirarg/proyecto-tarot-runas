// --- DATOS Y CONFIGURACIÓN DE RUNAS VIKINGAS (FUTHARK ANTIGUO) ---

export const mazoRunas = [
    { id: "fehu", nombre: "Fehu (ᚠ)", significado: "Riqueza, abundancia, nuevos comienzos y prosperidad." },
    { id: "uruz", nombre: "Uruz (ᚢ)", significado: "Fuerza vital, salud, determinación y coraje." },
    { id: "thurisaz", nombre: "Thurisaz (ᚦ)", significado: "Protección, puerta de cambio, fuerzas reactivas." },
    { id: "ansuz", nombre: "Ansuz (ᚨ)", significado: "Sabiduría, comunicación, señales e inspiración divina." },
    { id: "raidho", nombre: "Raidho (ᚱ)", significado: "Viaje, evolución, ritmo personal y dirección." },
    { id: "kenaz", nombre: "Kenaz (ᚲ)", significado: "Luz, antorcha, revelación y creatividad." },
    { id: "gebo", nombre: "Gebo (ᛂ)", significado: "Regalo, alianza, intercambio justo y unión." },
    { id: "wunjo", nombre: "Wunjo (ᛟ)", significado: "Alegría, armonía, realización y bienestar." },
    { id: "hagalaz", nombre: "Hagalaz (ᚺ)", significado: "Granizo, transformación abrupta, prueba necesaria." },
    { id: "nauthiz", nombre: "Nauthiz (ᚾ)", significado: "Necesidad, paciencia, lección del obstáculo." },
    { id: "isa", nombre: "Isa (ᛁ)", significado: "H hielo, pausa, quietud y concentración de energía." },
    { id: "jera", nombre: "Jera (ᛃ)", significado: "Cosecha, recompensa al esfuerzo, ciclos naturales." },
    { id: "eihwaz", nombre: "Eihwaz (ᛇ)", significado: "Tejo, transformación profunda, resistencia espiritual." },
    { id: "perthro", nombre: "Perthro (ᛈ)", significado: "Misterio, destino, secretos revelados y azar." },
    { id: "algiz", nombre: "Algiz (ᛉ)", significado: "Protección divina, escudo, intuición despierta." },
    { id: "sowilo", nombre: "Sowilo (ᛋ)", significado: "Sol, victoria, éxito, energía plena y claridad." },
    { id: "tiwaz", nombre: "Tiwaz (ᛏ)", significado: "Honor, justicia, sacrificio por un bien mayor." },
    { id: "berkano", nombre: "Berkano (ᛒ)", significado: "Renacimiento, crecimiento, fertilidad y nuevos proyectos." },
    { id: "ehwaz", nombre: "Ehwaz (ᛖ)", significado: "Caballo, avance armónico, confianza y trabajo en equipo." },
    { id: "mannaz", nombre: "Mannaz (ᛗ)", significado: "La humanidad, autoconocimiento, integración social." },
    { id: "laguz", nombre: "Laguz (ᛚ)", significado: "Agua, emociones, intuición y fluidez." },
    { id: "ingwaz", nombre: "Ingwaz (ᛝ)", significado: "Semilla, potencial guardado, descanso reparador." },
    { id: "dagaz", nombre: "Dagaz (ᛞ)", significado: "Amanecer, despertar, gran avance y claridad." },
    { id: "othala", nombre: "Othala (ᛟ)", significado: "Herencia, hogar, raíces y prosperidad ancestral." }
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