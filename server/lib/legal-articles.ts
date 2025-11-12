import { readFileSync, readdirSync, existsSync, writeFileSync } from "fs";
import { join } from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface Articulo {
  numero: number;
  titulo: string;
  archivo: string;
}

interface IndiceLey {
  nombreLey: string;
  totalArticulos: number;
  articulos: Articulo[];
}

interface ArticuloCompleto {
  ley: string;
  numero: number;
  titulo: string;
  contenido: string;
  embedding?: number[];
  textoBusqueda?: string; // Texto normalizado para búsqueda
}

class LegalArticlesManager {
  private articulos: ArticuloCompleto[] = [];
  private basePath: string;
  private embeddingsCachePath: string;
  private embeddingsCache: Map<string, number[]> = new Map();
  private embeddingsGenerados: boolean = false;

  constructor() {
    // Ruta base relativa al directorio del servidor
    this.basePath = join(process.cwd(), "articulos");
    this.embeddingsCachePath = join(process.cwd(), ".embeddings-cache.json");
    this.cargarCacheEmbeddings();
    this.cargarArticulos();
    // Generar embeddings de forma asíncrona después de cargar
    this.generarEmbeddingsAsync();
  }

  /**
   * Carga el cache de embeddings desde disco si existe
   */
  private cargarCacheEmbeddings() {
    try {
      if (existsSync(this.embeddingsCachePath)) {
        const cacheContent = readFileSync(this.embeddingsCachePath, "utf-8");
        const cache = JSON.parse(cacheContent);
        this.embeddingsCache = new Map(Object.entries(cache));
        console.log(`✅ Cargados ${this.embeddingsCache.size} embeddings desde cache`);
      }
    } catch (error) {
      console.warn("No se pudo cargar cache de embeddings:", error);
    }
  }

  /**
   * Guarda el cache de embeddings en disco
   */
  private guardarCacheEmbeddings() {
    try {
      const cacheObj = Object.fromEntries(this.embeddingsCache);
      writeFileSync(this.embeddingsCachePath, JSON.stringify(cacheObj, null, 2));
    } catch (error) {
      console.warn("No se pudo guardar cache de embeddings:", error);
    }
  }

  /**
   * Normaliza texto para búsqueda: elimina acentos, convierte a minúsculas, etc.
   */
  private normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Eliminar acentos
      .replace(/[^\w\s]/g, " ") // Reemplazar puntuación con espacios
      .replace(/\s+/g, " ") // Múltiples espacios a uno
      .trim();
  }

  /**
   * Genera un texto de búsqueda optimizado para un artículo
   */
  private generarTextoBusqueda(articulo: ArticuloCompleto): string {
    const partes = [
      articulo.titulo,
      articulo.contenido.substring(0, 500), // Primeros 500 caracteres
    ];
    return partes.join(" ").trim();
  }

  private cargarArticulos() {
    try {
      const carpetas = ["Coip", "COIPTR", "LOTAIP"];

      for (const carpeta of carpetas) {
        const rutaCarpeta = join(this.basePath, carpeta);
        const rutaIndice = join(rutaCarpeta, "indice.json");

        try {
          const indiceContent = readFileSync(rutaIndice, "utf-8");
          const indice: IndiceLey = JSON.parse(indiceContent);

          for (const articulo of indice.articulos) {
            try {
              const rutaArticulo = join(rutaCarpeta, articulo.archivo);
              const contenido = readFileSync(rutaArticulo, "utf-8");

              const articuloCompleto: ArticuloCompleto = {
                ley: indice.nombreLey,
                numero: articulo.numero,
                titulo: articulo.titulo,
                contenido: contenido.trim(),
                textoBusqueda: undefined, // Se generará después
              };

              // Generar texto de búsqueda normalizado
              articuloCompleto.textoBusqueda = this.normalizarTexto(
                this.generarTextoBusqueda(articuloCompleto)
              );

              this.articulos.push(articuloCompleto);
            } catch (error) {
              console.warn(`No se pudo cargar artículo ${articulo.archivo} de ${carpeta}:`, error);
            }
          }
        } catch (error) {
          console.warn(`No se pudo cargar índice de ${carpeta}:`, error);
        }
      }

      console.log(`✅ Cargados ${this.articulos.length} artículos legales`);
    } catch (error) {
      console.error("Error al cargar artículos legales:", error);
    }
  }

  /**
   * Genera embeddings para todos los artículos de forma asíncrona
   * Nota: Gemini no tiene un modelo de embedding directo, así que por ahora
   * usamos solo búsqueda por palabras clave mejorada
   */
  private async generarEmbeddingsAsync() {
    // Por ahora, deshabilitamos embeddings ya que Gemini no tiene un modelo de embedding directo
    // El sistema funcionará perfectamente con búsqueda por palabras clave mejorada
    this.embeddingsGenerados = true;
    console.log("ℹ️  Búsqueda semántica deshabilitada (Gemini no tiene embeddings directos). Usando búsqueda por palabras clave mejorada.");
  }

  /**
   * Genera una clave única para un artículo
   */
  private getArticuloKey(articulo: ArticuloCompleto): string {
    return `${articulo.ley}-${articulo.numero}`;
  }

  /**
   * Calcula la similitud de coseno entre dos vectores
   */
  private similitudCoseno(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Obtiene el embedding de una pregunta
   * Nota: Por ahora retorna null ya que Gemini no tiene embeddings directos
   * El sistema funciona perfectamente con búsqueda por palabras clave mejorada
   */
  private async obtenerEmbeddingPregunta(pregunta: string): Promise<number[] | null> {
    // Gemini no tiene un modelo de embedding directo como OpenAI
    // El sistema usará búsqueda por palabras clave mejorada en su lugar
    return null;
  }

  /**
   * Búsqueda mejorada por palabras clave con mejor normalización
   */
  private buscarPorPalabrasClave(pregunta: string): Array<{ articulo: ArticuloCompleto; score: number }> {
    const preguntaNormalizada = this.normalizarTexto(pregunta);
    const palabrasClave = preguntaNormalizada
      .split(/\s+/)
      .filter(palabra => palabra.length > 2) // Incluir palabras de 3+ caracteres
      .filter(palabra => !this.esStopWord(palabra));

    if (palabrasClave.length === 0) {
      return [];
    }

    // Términos relacionados con tránsito (sinónimos y variantes)
    const terminosTransito: Record<string, string[]> = {
      "transito": ["transito", "transit", "trafico", "traffic"],
      "conducir": ["conducir", "conduc", "manejar", "manej"],
      "vehiculo": ["vehiculo", "vehicul", "auto", "carro", "coche"],
      "licencia": ["licencia", "licenci", "permiso", "permis"],
      "multa": ["multa", "mult", "sancion", "sancion", "pena"],
      "infraccion": ["infraccion", "infracc", "violacion", "violac"],
      "embriaguez": ["embriaguez", "embriag", "alcohol", "borrach"],
      "velocidad": ["velocidad", "velocid", "rapidez", "rapid"],
      "estacionar": ["estacionar", "estacion", "parquear", "parque"],
      "semaforo": ["semaforo", "semafor", "semáforo"],
      "peaton": ["peaton", "peat", "peatón"],
      "accidente": ["accidente", "accident", "choque", "choqu"],
      "puntos": ["puntos", "punt", "puntaje", "puntaj"],
    };

    return this.articulos.map(articulo => {
      const textoBusqueda = articulo.textoBusqueda || this.normalizarTexto(this.generarTextoBusqueda(articulo));
      let score = 0;

      // Coincidencias exactas de palabras clave
      palabrasClave.forEach(palabra => {
        const regex = new RegExp(`\\b${palabra}\\b`, "i");
        if (regex.test(articulo.titulo)) {
          score += 15; // Título tiene mucho peso
        }
        if (regex.test(textoBusqueda)) {
          score += 2; // Contenido tiene menos peso
        }
      });

      // Búsqueda por términos relacionados
      Object.entries(terminosTransito).forEach(([termino, variantes]) => {
        if (preguntaNormalizada.includes(termino)) {
          variantes.forEach(variante => {
            if (textoBusqueda.includes(variante)) {
              score += 8;
            }
          });
        }
      });

      // Búsqueda por número de artículo
      const numeroArticuloMatch = pregunta.match(/art[íi]culo\s*(\d+)/i);
      if (numeroArticuloMatch) {
        const numeroBuscado = parseInt(numeroArticuloMatch[1]);
        if (articulo.numero === numeroBuscado) {
          score += 100; // Muy alta relevancia
        }
      }

      return { articulo, score };
    });
  }

  /**
   * Lista de palabras comunes a ignorar (stop words en español)
   */
  private esStopWord(palabra: string): boolean {
    const stopWords = new Set([
      "el", "la", "de", "que", "y", "a", "en", "un", "ser", "se", "no", "haber",
      "por", "con", "su", "para", "como", "estar", "tener", "le", "lo", "todo",
      "pero", "más", "hacer", "o", "poder", "decir", "este", "ir", "otro", "ese",
      "la", "si", "me", "ya", "ver", "porque", "dar", "cuando", "él", "muy",
      "sin", "vez", "mucho", "saber", "qué", "sobre", "mi", "alguno", "mismo",
      "yo", "también", "hasta", "año", "dos", "querer", "entre", "así", "primero",
      "desde", "grande", "eso", "ni", "nos", "del", "uno", "les", "gente", "estos",
      "qué", "si", "tan", "poco", "él", "tres", "sí", "dijo", "sido", "gran",
      "parte", "tener", "mundo", "antes", "puede", "decir", "cada", "después"
    ]);
    return stopWords.has(palabra);
  }

  /**
   * Busca artículos relevantes usando búsqueda híbrida (semántica + palabras clave)
   */
  async buscarArticulosRelevantes(pregunta: string, limite: number = 5): Promise<ArticuloCompleto[]> {
    // Búsqueda por palabras clave (siempre disponible)
    const resultadosKeywords = this.buscarPorPalabrasClave(pregunta);

    // Búsqueda semántica (si hay embeddings disponibles)
    let resultadosSemanticos: Array<{ articulo: ArticuloCompleto; score: number }> = [];
    
    try {
      const embeddingPregunta = await this.obtenerEmbeddingPregunta(pregunta);
      
      if (embeddingPregunta) {
        // Calcular similitud semántica con todos los artículos que tienen embedding
        resultadosSemanticos = this.articulos
          .filter(a => a.embedding)
          .map(articulo => {
            const similitud = this.similitudCoseno(embeddingPregunta, articulo.embedding!);
            return { articulo, score: similitud * 100 }; // Escalar a 0-100
          })
          .filter(item => item.score > 0.3) // Filtrar similitudes muy bajas
          .sort((a, b) => b.score - a.score);
      }
    } catch (error) {
      console.warn("Error en búsqueda semántica, usando solo palabras clave:", error);
    }

    // Combinar resultados: usar búsqueda semántica como base y palabras clave como boost
    const articulosCombinados = new Map<ArticuloCompleto, number>();

    // Agregar resultados semánticos (peso 70%)
    resultadosSemanticos.forEach(({ articulo, score }) => {
      articulosCombinados.set(articulo, (articulosCombinados.get(articulo) || 0) + score * 0.7);
    });

    // Agregar resultados por palabras clave (peso 30%)
    resultadosKeywords.forEach(({ articulo, score }) => {
      articulosCombinados.set(articulo, (articulosCombinados.get(articulo) || 0) + score * 0.3);
    });

    // Si no hay resultados semánticos, usar solo palabras clave
    if (resultadosSemanticos.length === 0) {
      return resultadosKeywords
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limite)
        .map(item => item.articulo);
    }

    // Ordenar por score combinado y devolver los mejores
    return Array.from(articulosCombinados.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limite)
      .map(([articulo]) => articulo);
  }

  /**
   * Obtiene un artículo específico por ley y número
   */
  obtenerArticulo(ley: string, numero: number): ArticuloCompleto | undefined {
    return this.articulos.find(
      a => a.ley.toLowerCase() === ley.toLowerCase() && a.numero === numero
    );
  }

  /**
   * Formatea artículos para incluir en el contexto del prompt
   */
  formatearArticulosParaContexto(articulos: ArticuloCompleto[]): string {
    if (articulos.length === 0) {
      return "";
    }

    let contexto = "\n\nARTÍCULOS LEGALES RELEVANTES:\n";
    contexto += "=".repeat(50) + "\n\n";

    articulos.forEach((articulo, index) => {
      contexto += `[${articulo.ley} - Artículo ${articulo.numero}${articulo.titulo ? `: ${articulo.titulo}` : ""}]\n`;
      contexto += articulo.contenido;
      contexto += "\n\n" + "-".repeat(50) + "\n\n";
    });

    return contexto;
  }

  /**
   * Obtiene el total de artículos cargados
   */
  getTotalArticulos(): number {
    return this.articulos.length;
  }
}

// Instancia singleton
export const legalArticlesManager = new LegalArticlesManager();

