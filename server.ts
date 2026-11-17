import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import authRoutes from './server/routes/auth';
import categoriesRoutes from './server/routes/categories';
import habitsRoutes from './server/routes/habits';
import logsRoutes from './server/routes/logs';

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

interface EncouragementRequestBody {
  trigger?: 'daily_brief' | 'habit_completed' | 'journal_saved' | 'manual_boost';
  userName?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  completedToday?: number;
  totalToday?: number;
  topStreak?: number;
  weeklyRate?: number;
  habitTitle?: string;
  habitStreak?: number;
  energyLevel?: number;
  moodTag?: string;
  dailyFocus?: string;
  pendingHabitTitle?: string;
  requestSeed?: number;
}

interface CategoryInterestInput {
  id: number;
  name: string;
  habitCount: number;
  activeStreaksSum: number;
  recentCompletions: number;
  existingTitles?: string[];
}

interface HabitSuggestionsRequestBody {
  userName?: string;
  categories?: CategoryInterestInput[];
  selectedCategoryIds?: number[];
  existingHabitTitles?: string[];
  interestNote?: string;
  requestSeed?: number;
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

  // Rutas RESTful de Sprint 2
  app.use('/api/auth', authRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/habits', habitsRoutes);
  app.use('/api/logs', logsRoutes);

  // Endpoint de documentación OpenAPI
  app.get('/api/docs/openapi.yaml', (_req: Request, res: Response) => {
    const openapiPath = path.resolve(__dirname, 'server/docs/openapi.yaml');
    if (fs.existsSync(openapiPath)) {
      res.setHeader('Content-Type', 'text/yaml; charset=utf-8');
      res.sendFile(openapiPath);
    } else {
      res.status(404).json({ error: 'Especificación OpenAPI no encontrada.' });
    }
  });

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

  app.post('/api/coach/encouragement', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'No hay una clave GEMINI_API_KEY configurada en el servidor (revisa Settings > Secrets).',
      });
      return;
    }

    const body = (req.body || {}) as EncouragementRequestBody;
    const trigger = body.trigger || 'daily_brief';
    const userName = typeof body.userName === 'string' && body.userName.trim() ? body.userName.trim() : 'amigo';
    const timeOfDay = body.timeOfDay || 'morning';
    const completedToday = Math.max(0, Number(body.completedToday) || 0);
    const totalToday = Math.max(0, Number(body.totalToday) || 0);

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const contextPayload = {
      trigger,
      userName,
      timeOfDay,
      completedToday,
      totalToday,
      topStreak: Math.max(0, Number(body.topStreak) || 0),
      weeklyRate: Math.max(0, Math.min(100, Number(body.weeklyRate) || 0)),
      habitTitle: body.habitTitle || null,
      habitStreak: typeof body.habitStreak === 'number' ? body.habitStreak : null,
      energyLevel: typeof body.energyLevel === 'number' ? body.energyLevel : null,
      moodTag: body.moodTag || null,
      dailyFocus: body.dailyFocus || null,
      pendingHabitTitle: body.pendingHabitTitle || null,
      variationSeed: body.requestSeed || Date.now(),
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Genera un mensaje breve, humano y personalizado de ánimo y acompañamiento para este usuario:\n${JSON.stringify(contextPayload)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres el guía cercano y empático de hábitos de "Impulso diario". ' +
            'Tu rol es dar mensajes de ánimo auténticos en español, sin exageraciones ni clichés vacíos. ' +
            'Adapta el saludo y tono a la jornada del día (timeOfDay): si es "morning" saluda con ánimo matutino ("buenos días"), si es "afternoon" habla acorde a la tarde ("buenas tardes") y si es "evening" acorde a la noche ("buenas noches"). ' +
            'Dirígete al usuario por su nombre (userName) de forma natural, nunca lo llames "Usuario". ' +
            'Adapta tu mensaje al contexto real: ' +
            '- Si trigger es "journal_saved" y energyLevel <= 2 o moodTag es "tired" o "stressed", valida su esfuerzo con calidez y recuérdale que sostener un hábito en días difíciles vale el doble (usa tone: "resilience" o "calm"). ' +
            '- Si completó todos los hábitos de hoy (completedToday >= totalToday && totalToday > 0) o trigger es "habit_completed", celebra su constancia de forma genuina (tone: "celebration" o "momentum"). ' +
            '- Si aún tiene hábitos pendientes (pendingHabitTitle), anímalo a dar el siguiente pequeño paso sin presión. ' +
            'Reglas de longitud estrictas: headline de 3 a 6 palabras; message de 1 a 2 frases breves y cálidas (máximo 185 caracteres); microAction de 1 frase práctica y corta (máximo 95 caracteres). ' +
            'El campo tone debe ser exactamente uno de: "celebration", "momentum", "resilience", "calm".',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              headline: {
                type: Type.STRING,
                description: 'Título corto y cercano de 3 a 6 palabras en español.',
              },
              message: {
                type: Type.STRING,
                description: 'Mensaje de ánimo cálido y personalizado de 1 a 2 frases.',
              },
              microAction: {
                type: Type.STRING,
                description: 'Siguiente pequeño paso práctico o recordatorio amable.',
              },
              tone: {
                type: Type.STRING,
                description: 'Uno de: celebration, momentum, resilience, calm.',
              },
            },
            required: ['headline', 'message', 'microAction', 'tone'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'No se recibió respuesta del modelo de acompañamiento. Intenta nuevamente.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        headline?: string;
        message?: string;
        microAction?: string;
        tone?: string;
      };

      const validTones = new Set(['celebration', 'momentum', 'resilience', 'calm']);
      const normalizedTone = parsed.tone && validTones.has(parsed.tone) ? parsed.tone : 'momentum';

      res.json({
        headline: (parsed.headline || `Sigue adelante, ${userName}`).trim(),
        message: (parsed.message || 'Cada pequeño paso cuenta para construir tu mejor rutina.').trim(),
        microAction: (parsed.microAction || 'Elige un solo hábito breve para mantener el ritmo hoy.').trim(),
        tone: normalizedTone,
        trigger,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Gemini encouragement error:', err);
      const formatted = formatGeminiError(err);
      res.status(formatted.status).json({ error: formatted.message });
    }
  });

  app.post('/api/habits/suggestions', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      res.status(500).json({
        error: 'No hay una clave GEMINI_API_KEY configurada en el servidor (revisa Settings > Secrets).',
      });
      return;
    }

    const body = (req.body || {}) as HabitSuggestionsRequestBody;
    const rawCategories = Array.isArray(body.categories) ? body.categories : [];
    if (rawCategories.length === 0) {
      res.status(400).json({
        error: 'Se requiere al menos una categoría existente para generar recomendaciones.',
      });
      return;
    }

    const selectedIdsSet = new Set(
      Array.isArray(body.selectedCategoryIds)
        ? body.selectedCategoryIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
        : []
    );
    const targetCategories =
      selectedIdsSet.size > 0
        ? rawCategories.filter((c) => selectedIdsSet.has(c.id))
        : rawCategories;
    const effectiveCategories = targetCategories.length > 0 ? targetCategories : rawCategories;

    const existingHabitTitles = Array.isArray(body.existingHabitTitles)
      ? body.existingHabitTitles.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      : [];
    const existingLowerSet = new Set(existingHabitTitles.map((t) => t.trim().toLowerCase()));
    const interestNote =
      typeof body.interestNote === 'string' ? body.interestNote.trim().slice(0, 160) : '';
    const userName =
      typeof body.userName === 'string' && body.userName.trim() ? body.userName.trim() : 'usuario';

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const payload = {
      userName,
      focusCategories: effectiveCategories.slice(0, 12),
      allExistingCategories: rawCategories.map((c) => ({ id: c.id, name: c.name })),
      existingHabitTitles: existingHabitTitles.slice(0, 30),
      userInterestNote: interestNote || null,
      variationSeed: body.requestSeed || Date.now(),
    };

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Analiza las categorías existentes del usuario, sus hábitos actuales y su perfil de interés, y sugiere 5 hábitos nuevos y populares adaptados a él:\n${JSON.stringify(payload)}`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          systemInstruction:
            'Eres el curador de hábitos de la app "Impulso diario". ' +
            'Tu tarea es generar una lista personalizada de 5 hábitos populares, realistas y de alto impacto en español, adaptada a las categorías existentes del usuario y a sus intereses actuales (reflejados en habitCount, activeStreaksSum, recentCompletions, existingTitles y userInterestNote). ' +
            'Reglas estrictas: ' +
            '1) Usa ÚNICAMENTE los categoryId presentes en focusCategories (asigna el id numérico exacto de esa categoría). ' +
            '2) NO repitas ni reformules exactamente ninguno de los títulos en existingHabitTitles; sugiere hábitos nuevos, frescos y complementarios. ' +
            '3) Prioriza hábitos populares y sostenibles (entre 2 y 30 minutos o metas diarias claras). ' +
            '4) Responde siempre en español natural y directo. ' +
            '5) En interestSummary escribe 1 frase corta (máx. 150 caracteres) explicando cómo la lista se adapta a sus categorías e intereses actuales. ' +
            '6) Para cada sugerencia: title (3-7 palabras), description (1 frase clara, máx. 125 caracteres), whyItFits (1 frase corta conectando con su interés actual, máx. 110 caracteres), targetValue (entero >= 1), unitLabel (ej. "minutos", "páginas", "vasos", "vez", "sesión", "porciones"), scheduledDays (arreglo de enteros del 1 al 7, donde 1=Lun y 7=Dom), recommendedTimeOfDay ("morning", "afternoon", "evening" o "anytime"), reminderTime ("HH:MM" 24h), popularityTag (etiqueta breve de popularidad de 2-4 palabras, ej. "Tendencia · 10 min", "Top en Foco").',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              interestSummary: {
                type: Type.STRING,
                description: 'Resumen breve de cómo la lista se adapta a las categorías e intereses del usuario.',
              },
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    categoryId: { type: Type.INTEGER },
                    title: { type: Type.STRING },
                    description: { type: Type.STRING },
                    whyItFits: { type: Type.STRING },
                    targetValue: { type: Type.INTEGER },
                    unitLabel: { type: Type.STRING },
                    scheduledDays: {
                      type: Type.ARRAY,
                      items: { type: Type.INTEGER },
                    },
                    recommendedTimeOfDay: { type: Type.STRING },
                    reminderTime: { type: Type.STRING },
                    popularityTag: { type: Type.STRING },
                  },
                  required: [
                    'categoryId',
                    'title',
                    'description',
                    'whyItFits',
                    'targetValue',
                    'unitLabel',
                    'scheduledDays',
                    'recommendedTimeOfDay',
                    'reminderTime',
                    'popularityTag',
                  ],
                },
              },
            },
            required: ['interestSummary', 'suggestions'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'No se recibió respuesta del generador de sugerencias. Intenta nuevamente.',
        });
        return;
      }

      const parsed = JSON.parse(rawText) as {
        interestSummary?: string;
        suggestions?: Array<{
          categoryId?: number;
          title?: string;
          description?: string;
          whyItFits?: string;
          targetValue?: number;
          unitLabel?: string;
          scheduledDays?: number[];
          recommendedTimeOfDay?: string;
          reminderTime?: string;
          popularityTag?: string;
        }>;
      };

      const categoryById = new Map(effectiveCategories.map((c) => [c.id, c]));
      const fallbackCategory =
        [...effectiveCategories].sort(
          (a, b) =>
            b.activeStreaksSum + b.habitCount * 3 - (a.activeStreaksSum + a.habitCount * 3)
        )[0] || effectiveCategories[0];

      const validTimes = new Set(['morning', 'afternoon', 'evening', 'anytime']);
      const normalizeTime = (t?: string): string => {
        const match = /(\d{1,2}):(\d{2})/.exec(t || '');
        if (!match) return '09:00';
        const hh = Math.max(0, Math.min(23, Number(match[1]))).toString().padStart(2, '0');
        const mm = Math.max(0, Math.min(59, Number(match[2]))).toString().padStart(2, '0');
        return `${hh}:${mm}`;
      };

      const seenTitles = new Set(existingLowerSet);
      const normalizedSuggestions = (parsed.suggestions || [])
        .map((item, idx) => {
          const title = (item.title || '').trim();
          if (!title) return null;
          const lowerTitle = title.toLowerCase();
          if (seenTitles.has(lowerTitle)) return null;
          seenTitles.add(lowerTitle);

          const matchedCategory =
            typeof item.categoryId === 'number' && categoryById.has(item.categoryId)
              ? categoryById.get(item.categoryId)!
              : fallbackCategory;

          const cleanDays = Array.isArray(item.scheduledDays)
            ? Array.from(
                new Set(
                  item.scheduledDays
                    .map((d) => Number(d))
                    .filter((d) => Number.isInteger(d) && d >= 1 && d <= 7)
                )
              ).sort((a, b) => a - b)
            : [];

          const timeOfDay =
            item.recommendedTimeOfDay && validTimes.has(item.recommendedTimeOfDay)
              ? (item.recommendedTimeOfDay as 'morning' | 'afternoon' | 'evening' | 'anytime')
              : 'anytime';

          return {
            id: `ai-sug-${Date.now()}-${idx}`,
            categoryId: matchedCategory.id,
            categoryName: matchedCategory.name,
            title,
            description: (item.description || 'Hábito práctico para consolidar tu rutina diaria.').trim(),
            whyItFits: (item.whyItFits || `Complementa tu interés actual en ${matchedCategory.name}.`).trim(),
            targetValue: Math.max(1, Math.round(Number(item.targetValue) || 1)),
            unitLabel: (item.unitLabel || 'vez').trim(),
            scheduledDays: cleanDays.length > 0 ? cleanDays : [1, 2, 3, 4, 5, 6, 7],
            recommendedTimeOfDay: timeOfDay,
            reminderTime: normalizeTime(item.reminderTime),
            popularityTag: (item.popularityTag || 'Popular en comunidad').trim(),
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .slice(0, 6);

      if (normalizedSuggestions.length === 0) {
        res.status(502).json({
          error: 'No se pudieron generar sugerencias nuevas distintas a tus hábitos actuales. Intenta regenerar.',
        });
        return;
      }

      res.json({
        interestSummary: (
          parsed.interestSummary ||
          'Lista adaptada a tus categorías activas y al impulso de tus rachas actuales.'
        ).trim(),
        suggestions: normalizedSuggestions,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Gemini habit suggestions error:', err);
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
