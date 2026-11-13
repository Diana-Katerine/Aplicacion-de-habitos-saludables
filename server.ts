import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

interface WeekdayHistoryInput {
  dayLabel: string;
  dayOfWeek: number;
  baselineRate: number;
  completedCount: number;
  scheduledCount: number;
}

interface HabitSummaryInput {
  id: string;
  title: string;
  categoryName: string;
  currentReminderTime?: string;
  scheduledDaysCount: number;
  completionRate30d: number;
  currentStreak: number;
  bestStreak: number;
}

interface ForecastRequestBody {
  timezone?: string;
  weekdayHistory?: WeekdayHistoryInput[];
  habits?: HabitSummaryInput[];
}

function formatGeminiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes('api_key_invalid') || lower.includes('permission_denied') || lower.includes('403') || lower.includes('api key')) {
    return {
      status: 403,
      message: 'No se pudo autenticar con Gemini API. Verifica tu clave en Settings > Secrets.',
    };
  }
  if (lower.includes('resource_exhausted') || lower.includes('429') || lower.includes('quota')) {
    return {
      status: 429,
      message: 'Se alcanzó el límite temporal de solicitudes a Gemini API. Intenta nuevamente en unos segundos.',
    };
  }
  if (lower.includes('not_found') || lower.includes('404')) {
    return {
      status: 502,
      message: 'El modelo de pronóstico solicitado no está disponible en este momento.',
    };
  }
  return {
    status: 502,
    message: raw || 'Error inesperado al generar el pronóstico con Gemini.',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.post('/api/forecast/momentum', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'No hay una clave GEMINI_API_KEY configurada en el servidor (revisa Settings > Secrets).',
      });
      return;
    }

    const body = (req.body || {}) as ForecastRequestBody;
    const weekdayHistory = Array.isArray(body.weekdayHistory) ? body.weekdayHistory : [];
    const habits = Array.isArray(body.habits) ? body.habits : [];
    const timezone = typeof body.timezone === 'string' && body.timezone ? body.timezone : 'UTC';

    if (weekdayHistory.length !== 7) {
      res.status(400).json({
        error: 'Se requiere el historial de los 7 días de la semana (Lun-Dom) para generar el pronóstico.',
      });
      return;
    }

    if (habits.length === 0) {
      res.status(400).json({
        error: 'Necesitas al menos un hábito activo para generar predicciones de horarios óptimos.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const promptPayload = {
      timezone,
      weekdayHistory,
      habits: habits.slice(0, 12),
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analiza estos datos históricos de cumplimiento de hábitos y genera el pronóstico semanal de zonas de impulso y recomendaciones de horarios óptimos:\n${JSON.stringify(promptPayload)}`,
        config: {
          systemInstruction:
            'Eres un analista de cronobiología conductual y adherencia a hábitos para la app "Impulso Diario". ' +
            'Responde siempre en español natural, directo y accionable. ' +
            'Debes devolver exactamente 7 elementos en weeklyForecast ordenados de lunes a domingo (dayOfWeek 1 al 7, dayLabel: "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"). ' +
            'Conserva el baselineRate numérico recibido para cada día (0-100) y calcula un predictedScore realista (0-100) aplicando mejoras de horario y patrones semanales. ' +
            'Clasifica cada día con zoneType: "peak" (los 2-3 días de mayor impulso o mejor ventana), "steady" (días estables), o "risk" (días con caída histórica que requieren ventana de recuperación). ' +
            'Usa formato 24h "HH:MM-HH:MM" para optimalWindow (ej. "07:30-09:30") y "HH:MM" para suggestedOptimalTime (ej. "08:00"). ' +
            'En habitTimeRecommendations incluye hasta 4 hábitos clave usando exactamente su habitId original y explicando en una frase corta por qué ese horario maximiza la probabilidad de completarlo.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: 'Resumen breve en español (1-2 frases) sobre la trayectoria semanal proyectada y el mejor bloque horario.',
              },
              peakMomentumWindow: {
                type: Type.STRING,
                description: 'Ventana horaria pico principal del usuario, ej. "07:30 - 09:30".',
              },
              secondaryMomentumWindow: {
                type: Type.STRING,
                description: 'Segunda ventana favorable del día, ej. "17:30 - 19:00".',
              },
              weeklyForecast: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    dayLabel: { type: Type.STRING },
                    dayOfWeek: { type: Type.INTEGER },
                    predictedScore: { type: Type.INTEGER },
                    baselineRate: { type: Type.INTEGER },
                    zoneType: { type: Type.STRING },
                    momentumZone: { type: Type.STRING },
                    optimalWindow: { type: Type.STRING },
                    focusTip: { type: Type.STRING },
                  },
                  required: [
                    'dayLabel',
                    'dayOfWeek',
                    'predictedScore',
                    'baselineRate',
                    'zoneType',
                    'momentumZone',
                    'optimalWindow',
                    'focusTip',
                  ],
                },
              },
              habitTimeRecommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    habitId: { type: Type.STRING },
                    habitTitle: { type: Type.STRING },
                    currentReminderTime: { type: Type.STRING },
                    suggestedOptimalTime: { type: Type.STRING },
                    expectedLiftPercent: { type: Type.INTEGER },
                    rationale: { type: Type.STRING },
                  },
                  required: [
                    'habitId',
                    'habitTitle',
                    'currentReminderTime',
                    'suggestedOptimalTime',
                    'expectedLiftPercent',
                    'rationale',
                  ],
                },
              },
            },
            required: [
              'headline',
              'peakMomentumWindow',
              'secondaryMomentumWindow',
              'weeklyForecast',
              'habitTimeRecommendations',
            ],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'La respuesta del modelo estuvo vacía. Intenta recalcular el pronóstico.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        headline: string;
        peakMomentumWindow: string;
        secondaryMomentumWindow: string;
        weeklyForecast: Array<{
          dayLabel: string;
          dayOfWeek: number;
          predictedScore: number;
          baselineRate: number;
          zoneType: string;
          momentumZone: string;
          optimalWindow: string;
          focusTip: string;
        }>;
        habitTimeRecommendations: Array<{
          habitId: string;
          habitTitle: string;
          currentReminderTime: string;
          suggestedOptimalTime: string;
          expectedLiftPercent: number;
          rationale: string;
        }>;
      };

      const clampPct = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
      const normalizeZoneType = (z: string): 'peak' | 'steady' | 'risk' => {
        if (z === 'peak' || z === 'risk') return z;
        return 'steady';
      };
      const normalizeTime = (t: string): string => {
        const match = /(\d{1,2}):(\d{2})/.exec(t || '');
        if (!match) return '08:30';
        const hh = Math.max(0, Math.min(23, Number(match[1]))).toString().padStart(2, '0');
        const mm = Math.max(0, Math.min(59, Number(match[2]))).toString().padStart(2, '0');
        return `${hh}:${mm}`;
      };

      const validHabitIds = new Set(habits.map((h) => h.id));
      const habitTitleById = new Map(habits.map((h) => [h.id, h.title]));

      const normalizedForecast = weekdayHistory.map((baseDay, idx) => {
        const aiDay =
          parsed.weeklyForecast?.find((d) => d.dayOfWeek === baseDay.dayOfWeek) ||
          parsed.weeklyForecast?.[idx];
        return {
          dayLabel: baseDay.dayLabel,
          dayOfWeek: baseDay.dayOfWeek,
          predictedScore: clampPct(aiDay?.predictedScore ?? baseDay.baselineRate),
          baselineRate: clampPct(baseDay.baselineRate),
          zoneType: normalizeZoneType(aiDay?.zoneType || 'steady'),
          momentumZone: aiDay?.momentumZone || 'Zona Estable',
          optimalWindow: aiDay?.optimalWindow || '08:00-10:00',
          focusTip: aiDay?.focusTip || 'Mantén tu bloque habitual de ejecución sin distracciones.',
        };
      });

      const normalizedRecs = (parsed.habitTimeRecommendations || [])
        .filter((rec) => validHabitIds.has(rec.habitId))
        .slice(0, 5)
        .map((rec) => ({
          habitId: rec.habitId,
          habitTitle: habitTitleById.get(rec.habitId) || rec.habitTitle,
          currentReminderTime: rec.currentReminderTime || 'Sin definir',
          suggestedOptimalTime: normalizeTime(rec.suggestedOptimalTime),
          expectedLiftPercent: Math.max(2, Math.min(40, Math.round(Number(rec.expectedLiftPercent) || 8))),
          rationale: rec.rationale,
        }));

      res.json({
        headline: parsed.headline,
        peakMomentumWindow: parsed.peakMomentumWindow || '07:30 - 09:30',
        secondaryMomentumWindow: parsed.secondaryMomentumWindow || '17:30 - 19:00',
        weeklyForecast: normalizedForecast,
        habitTimeRecommendations: normalizedRecs,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Gemini forecast error:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.use((_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Impulso Diario server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
