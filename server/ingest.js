import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ ERRO: VITE_GEMINI_API_KEY não encontrada no .env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "embedding-001" });

// Estrutura hierárquica de livros
const BOOKS = [
    // CAMADA 1: Base Universal (Core)
    {
        file: "core/Questionamento_Socrático_para_Terapeutas_Aprenda_a_Pensar_e_a_Intervir.pdf",
        title: "Questionamento Socrático",
        id: "socratico",
        type: "core",
        disorder: null
    },
    {
        file: "core/Psicoeducacao.pdf",
        title: "Psicoeducação",
        id: "psicoeducacao",
        type: "core",
        disorder: null
    },
    {
        file: "core/TerapiaCognitivacomportamental3°EdiçãoJudithS.BECK.pdf",
        title: "TCC Beck 3ª Edição",
        id: "beck",
        type: "core",
        disorder: null
    }

    // CAMADA 2: Protocolos virão aqui no futuro
    // {
    //     file: "protocols/panic/clark_panic.pdf",
    //     type: "protocol",
    //     disorder: "panic"
    // }
];

const CHUNK_SIZE = 1000;
const DOCS_DIR = path.join(__dirname, '../docs');
const DB_FILE = path.join(__dirname, 'knowledge_base.json');

async function getEmbedding(text, retries = 3) {
    try {
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (e) {
        if (retries > 0) {
            await new Promise(r => setTimeout(r, 2000));
            return getEmbedding(text, retries - 1);
        }
        console.error("Erro ao gerar embedding:", e.message);
        return null;
    }
}

async function processBooks() {
    console.log("🚀 Iniciando processamento da Base de Conhecimento Hierárquica...\n");
    let knowledgeBase = [];

    // Limpar base antiga
    if (fs.existsSync(DB_FILE)) {
        console.log("🗑️  Limpando base antiga...");
        fs.unlinkSync(DB_FILE);
    }

    for (const book of BOOKS) {
        const filePath = path.join(DOCS_DIR, book.file);

        if (!fs.existsSync(filePath)) {
            console.error(`❌ Arquivo não encontrado: ${book.file}`);
            continue;
        }

        const layerLabel = book.type === "core" ? "📚 CORE" : `🎯 PROTOCOL (${book.disorder})`;
        console.log(`\n${layerLabel}: ${book.title}`);
        console.log("─".repeat(50));

        const dataBuffer = fs.readFileSync(filePath);

        try {
            const data = await pdf(dataBuffer);
            const text = data.text.replace(/\s+/g, ' ').trim();

            console.log(`   📝 Total caracteres: ${text.length.toLocaleString()}`);

            let chunks = [];
            for (let i = 0; i < text.length; i += CHUNK_SIZE) {
                chunks.push(text.slice(i, i + CHUNK_SIZE));
            }

            console.log(`   🧩 Gerando embeddings para ${chunks.length} trechos...`);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                if (chunk.length < 100) continue;

                const embedding = await getEmbedding(chunk);

                if (embedding) {
                    knowledgeBase.push({
                        id: `${book.id}_${i}`,
                        bookId: book.id,
                        bookTitle: book.title,
                        text: chunk,
                        embedding: embedding,
                        metadata: {
                            type: book.type,           // "core" ou "protocol"
                            disorder: book.disorder    // null ou "panic", "depression", etc
                        }
                    });
                }

                if (i % 10 === 0) process.stdout.write(`.`);
            }

            console.log(`\n   ✅ Concluído: ${book.title} (${chunks.length} trechos)`);

            // Salvar parcial
            fs.writeFileSync(DB_FILE, JSON.stringify(knowledgeBase, null, 2));

        } catch (error) {
            console.error(`❌ Erro ao processar ${book.file}:`, error.message);
        }
    }

    console.log(`\n${"═".repeat(50)}`);
    console.log(`🏁 Base de Conhecimento Hierárquica Completa!`);
    console.log(`   📊 Total de trechos: ${knowledgeBase.length}`);
    console.log(`   📚 Core: ${knowledgeBase.filter(k => k.metadata.type === 'core').length}`);
    console.log(`   🎯 Protocols: ${knowledgeBase.filter(k => k.metadata.type === 'protocol').length}`);
    console.log(`   💾 Salvo em: ${DB_FILE}`);
    console.log(`${"═".repeat(50)}\n`);
}

processBooks().catch(console.error);
