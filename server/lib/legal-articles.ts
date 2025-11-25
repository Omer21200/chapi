import { readFileSync, existsSync, writeFileSync } from "fs";
import { join } from "path";

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
  textoBusqueda: string;
}

class LegalArticlesManager {
  private articulos: ArticuloCompleto[] = [];
  private basePath = join(process.cwd(), "articulos");
  private stopWords = new Set([
    "el","la","de","que","y","a","en","un","ser","se","no","por",
    "con","su","para","como","estar","tener","lo","pero","mas",
    "muy","sin","me","yo","tu","mi","los","las","del","al"
  ]);

  constructor() {
    this.cargarArticulos();
  }

  // ---------------- NORMALIZACIÓN --------------------
  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  private generarTextoBusqueda(a: ArticuloCompleto): string {
    return this.normalizar(`${a.titulo} ${a.contenido.slice(0, 500)}`);
  }

  private esStopWord(p: string) {
    return this.stopWords.has(p);
  }

  // ---------------- CARGAR ARTÍCULOS --------------------
  private cargarArticulos() {
    const carpetas = ["Coip", "COIPTR", "LOTAIP"];

    for (const carpeta of carpetas) {
      const rutaCarpeta = join(this.basePath, carpeta);
      const indicePath = join(rutaCarpeta, "indice.json");

      if (!existsSync(indicePath)) continue;

      try {
        const indice: IndiceLey = JSON.parse(readFileSync(indicePath, "utf-8"));

        for (const art of indice.articulos) {
          const archivoPath = join(rutaCarpeta, art.archivo);
          if (!existsSync(archivoPath)) continue;

          const contenido = readFileSync(archivoPath, "utf-8").trim();

          const articulo: ArticuloCompleto = {
            ley: indice.nombreLey,
            numero: art.numero,
            titulo: art.titulo,
            contenido,
            textoBusqueda: ""
          };

          articulo.textoBusqueda = this.generarTextoBusqueda(articulo);
          this.articulos.push(articulo);
        }
      } catch {}
    }

    console.log(`📚 Se cargaron ${this.articulos.length} artículos`);
  }

  // ---------------- BUSCAR PALABRAS CLAVE --------------------
  private buscarKeywords(pregunta: string) {
    const normal = this.normalizar(pregunta);
    const palabras = normal
      .split(" ")
      .filter(p => p.length > 2 && !this.esStopWord(p));

    const sinonimos: Record<string, string[]> = {
      velocidad: ["velocidad", "rapidez"],
      vehiculo: ["vehiculo", "auto", "carro"],
      transito: ["transito", "trafico"],
      multa: ["multa", "sancion"],
      infraccion: ["infraccion", "violacion"]
    };

    return this.articulos.map(a => {
      let score = 0;
      const texto = a.textoBusqueda;

      for (const p of palabras) {
        if (a.titulo.includes(p)) score += 15;
        if (texto.includes(p)) score += 2;
      }

      for (const clave in sinonimos) {
        if (normal.includes(clave)) {
          for (const s of sinonimos[clave]) {
            if (texto.includes(s)) score += 8;
          }
        }
      }

      const match = normal.match(/articulo\s*(\d+)/);
      if (match && a.numero === Number(match[1])) score += 100;

      return { articulo: a, score };
    });
  }

  // ---------------- BÚSQUEDA PÚBLICA --------------------
  async buscarArticulosRelevantes(pregunta: string, limite = 5) {
    const results = this.buscarKeywords(pregunta)
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limite);

    return results.map(r => r.articulo);
  }

  obtenerArticulo(ley: string, numero: number) {
    return this.articulos.find(
      a => a.ley.toLowerCase() === ley.toLowerCase() && a.numero === numero
    );
  }
}

export const legalArticlesManager = new LegalArticlesManager();
