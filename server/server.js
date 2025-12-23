import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
    console.error("❌ ERRO: VITE_GEMINI_API_KEY não encontrada");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "embedding-001" });

// Carregar Knowledge Base
const DB_FILE = path.join(__dirname, 'knowledge_base.json');
let knowledgeBase = [];

function loadKnowledgeBase() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf-8');
            knowledgeBase = JSON.parse(data);
            console.log(`📚 Base de conhecimento carregada: ${knowledgeBase.length} trechos`);
        } catch (e) {
            console.error("Erro ao carregar knowledge base:", e);
        }
    } else {
        console.warn("⚠️ knowledge_base.json não encontrado. Execute 'npm run ingest' primeiro.");
    }
}

loadKnowledgeBase();

// Função Cosseno Similaridade
function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Endpoint de Busca HIERÁRQUICA
app.post('/api/search-technique', async (req, res) => {
    try {
        const { query, patientDisorder, limit = 3 } = req.body;

        if (!query) {
            return res.status(400).json({ error: 'Query required' });
        }

        if (knowledgeBase.length === 0) {
            return res.json({
                techniques: [],
                message: "Base vazia. Execute 'npm run ingest' primeiro.",
                hierarchy_used: []
            });
        }

        // 1. Embedding da query
        const result = await model.embedContent(query);
        const queryEmbedding = result.embedding.values;

        let finalResults = [];
        let hierarchyUsed = [];

        // 2. HIERARQUIA DE BUSCA

        // Prioridade 1: Protocolos específicos (se fornecido diagnóstico)
        if (patientDisorder) {
            const protocolResults = knowledgeBase
                .filter(item => item.metadata.type === 'protocol' && item.metadata.disorder === patientDisorder)
                .map(item => ({
                    ...item,
                    score: cosineSimilarity(queryEmbedding, item.embedding),
                    source_type: 'protocol'
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 2); // Top 2 do protocolo específico

            if (protocolResults.length > 0) {
                finalResults = protocolResults;
                hierarchyUsed.push(`Protocol: ${patientDisorder} (${protocolResults.length} results)`);
            }
        }

        // Prioridade 2: Biblioteca Core (complementar ou substituir se não houver protocolo)
        const remainingSlots = limit - finalResults.length;
        if (remainingSlots > 0) {
            const coreResults = knowledgeBase
                .filter(item => item.metadata.type === 'core')
                .map(item => ({
                    ...item,
                    score: cosineSimilarity(queryEmbedding, item.embedding),
                    source_type: 'core'
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, remainingSlots);

            finalResults = [...finalResults, ...coreResults];
            hierarchyUsed.push(`Core Library (${coreResults.length} results)`);
        }

        // 3. Retorno limpo
        const techniques = finalResults.map(r => ({
            text: r.text,
            source: r.bookTitle,
            source_type: r.source_type, // 'protocol' ou 'core'
            relevance: r.score,
            disorder: r.metadata.disorder
        }));

        res.json({
            techniques,
            hierarchy_used: hierarchyUsed,
            total_results: techniques.length
        });

    } catch (error) {
        console.error("Erro na busca:", error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/refresh-db', (req, res) => {
    loadKnowledgeBase();
    res.json({ message: "Base recarregada", count: knowledgeBase.length });
});

app.listen(PORT, () => {
    console.log(`🚀 RAG Server rodando na porta ${PORT}`);
});
