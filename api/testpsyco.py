import spacy
import matplotlib.pyplot as plt
import networkx as nx
from collections import defaultdict

# Cargar modelo de lenguaje en español
nlp = spacy.load("es_core_news_md")

# Función para analizar las anotaciones del psicólogo
def analizar_anotaciones(anotaciones):
    perfil = defaultdict(set)

    # Categorías generales aplicables a cualquier paciente
    categorias = {
        "trauma": ["accidente", "trauma", "evento", "muerte", "perdida", "abuso", "violencia"],
        "sintomas": ["ansiedad", "fatiga", "insomnio", "depresion", "panico", "estres", "hipervigilancia", "dificultad para concentrarse"],
        "sentimientos": ["culpa", "frustracion", "tristeza", "ira", "miedo", "soledad", "vergüenza"],
        "interacciones_sociales": ["aislamiento", "amistades", "familia", "soledad", "interacciones", "relaciones"],
        "tratamiento": ["terapia", "medicamentos", "ejercicio", "rutina", "cognitivo-conductual", "psicoterapia"],
        "mejorias": ["mejora", "progreso", "avances", "recuperacion"]
    }

    for anotacion in anotaciones:
        doc = nlp(anotacion)

        # Clasificar las palabras clave bajo sus categorías
        for chunk in doc.noun_chunks:
            if len(chunk.text) > 3:
                for categoria, palabras_clave in categorias.items():
                    for palabra in palabras_clave:
                        if palabra in chunk.text.lower():
                            perfil[categoria].add(chunk.text)

        for token in doc:
            if token.pos_ in {"NOUN", "ADJ"} and len(token.text) > 3:
                for categoria, palabras_clave in categorias.items():
                    for palabra in palabras_clave:
                        if palabra in token.text.lower():
                            perfil[categoria].add(token.text)

    # Agrupar solo términos con significado relevante
    perfil_procesado = {k: list(v) for k, v in perfil.items() if len(v) > 0}
    
    return perfil_procesado

# Función para generar el mapa mental
def crear_mapa_mental(perfil_psicologico):
    G = nx.Graph()
    G.add_node("Perfil Psicológico")

    # Crear nodos para cada categoría y elemento dentro de cada categoría
    for categoria, items in perfil_psicologico.items():
        G.add_node(categoria.capitalize())
        G.add_edge("Perfil Psicológico", categoria.capitalize())

        for item in items:
            G.add_node(item)
            G.add_edge(categoria.capitalize(), item)

    # Configuración del gráfico
    pos = nx.spring_layout(G, seed=42, k=0.7)
    plt.figure(figsize=(12, 12))
    nx.draw(G, pos, with_labels=True, node_size=3000, node_color="lightblue", font_size=9, font_weight="bold", edge_color="gray")
    plt.title("Mapa Mental del Paciente")
    plt.show()

# Función para generar un resumen basado en las anotaciones
def generar_resumen(perfil_psicologico):
    resumen = "📝 **Resumen del Perfil Psicológico:**\n\n"
    for categoria, items in perfil_psicologico.items():
        resumen += f"**{categoria.capitalize()}**:\n"
        for item in items:
            resumen += f"- {item}\n"
        resumen += "\n"
    return resumen

# 📌 Ejemplo: Anotaciones de un paciente con ansiedad y estrés postraumático
anotaciones = [
    "El paciente experimenta pesadillas recurrentes vinculadas a un accidente automovilístico, lo que puede indicar un trauma no resuelto.",
    "Muestra una ansiedad significativa relacionada con la conducción y la presencia de tráfico, lo que podría estar exacerbando su aislamiento social y limitando su movilidad.",
    "Presenta insomnio crónico y fatiga constante, síntomas comunes en trastornos depresivos y de ansiedad. Es importante investigar posibles vínculos entre los patrones de sueño y los eventos traumáticos.",
    "Ha optado por retirarse de sus círculos sociales, lo que aumenta el riesgo de empeorar los síntomas de depresión y perpetuar el ciclo de soledad.",
    "Se siente culpable por no superar el trauma, lo cual podría estar contribuyendo a su depresión. Es crucial abordar estos sentimientos a través de la reestructuración cognitiva.",
    "Presenta una respuesta hipervigilante a estímulos externos, lo que indica la presencia de un trastorno de ansiedad, posiblemente relacionado con el trauma vivido.",
    "El paciente tiene pensamientos intrusivos sobre el accidente que interfieren con su capacidad de concentración en el trabajo, lo que puede estar afectando su desempeño laboral.",
    "Los episodios de pánico en situaciones de estrés alto pueden ser un signo de trastorno de ansiedad generalizada o trastorno de estrés postraumático (TEPT), lo cual debe ser explorado en terapia.",
    "El paciente ha identificado que el ejercicio y una rutina diaria le ayudan a reducir la ansiedad, lo que sugiere que la intervención en estilo de vida podría ser útil en el tratamiento.",
    "Aunque el paciente reporta una leve mejora desde que comenzó la terapia, la persistencia de los síntomas indica que podría ser necesario profundizar en intervenciones terapéuticas adicionales, como la terapia cognitivo-conductual (TCC)."
]

# 🔍 Procesar anotaciones
perfil_psicologico = analizar_anotaciones(anotaciones)

# 🧠 Generar y mostrar el mapa mental
crear_mapa_mental(perfil_psicologico)

# 📄 Generar el resumen basado en las anotaciones
resumen = generar_resumen(perfil_psicologico)
print(resumen)
