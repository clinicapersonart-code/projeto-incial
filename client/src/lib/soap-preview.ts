import { Patient } from '../types/patient';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Gera preview SOAP a partir do histórico de chat
 */
export async function generateSOAPPreview(messages: Array<{ role: string; text: string }>, patientContext?: Patient): Promise<any> {
    if (messages.length === 0) {
        return {
            queixa_principal: '',
            objetivo: '',
            avaliacao: '',
            plano: ''
        };
    }

    // Monta histórico formatado
    const chatHistory = messages
        .map(m => `${m.role === 'user' ? 'TERAPEUTA' : 'SUPERVISOR'}: ${m.text}`)
        .join('\n');

    const prompt = `Você é um assistente que gera SOAP (Subjetivo, Objetivo, Avaliação, Plano) a partir de notas de sessão.

HISTÓRICO DA SESSÃO (EM ANDAMENTO):
${chatHistory}

INSTRUÇÕES:
- Gere um SOAP PARCIAL baseado no que já foi discutido
- Se algo ainda não foi mencionado, deixe vazio ou escreva "A definir"
- Seja conciso e objetivo
- Use informações apenas do histórico fornecido

Retorne JSON válido neste formato:
{
  "queixa_principal": "string",
  "objetivo": "string", 
  "avaliacao": "string",
  "plano": "string"
}`;

    try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            console.error('API Key not found');
            return null;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash-exp",
            generationConfig: {
                temperature: 0.3,
                responseMimeType: "application/json"
            }
        });

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return JSON.parse(text);
    } catch (error) {
        console.error('Error generating SOAP preview:', error);
        return null;
    }
}
