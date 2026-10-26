import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Loader2,
  PlayCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import {
  getApiErrorMessage,
  learningApi,
  type ClassContent,
  type QuizAttemptResult,
  type QuizAttemptStart,
  type StudentQuizState,
} from '../../lib/learningApi';

interface ClassQuizPanelProps {
  courseId: string;
  classItem: ClassContent;
  onCompleted: () => void;
}

const formatTime = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

export function ClassQuizPanel({
  courseId,
  classItem,
  onCompleted,
}: ClassQuizPanelProps) {
  const [state, setState] = useState<StudentQuizState | null>(null);
  const [attempt, setAttempt] = useState<QuizAttemptStart | null>(null);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [result, setResult] = useState<QuizAttemptResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const autoSubmittedRef = useRef(false);

  const loadState = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await learningApi.getQuizState(courseId, classItem.id);
      setState(data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cargar la evaluación.'));
    } finally {
      setLoading(false);
    }
  }, [courseId, classItem.id]);

  useEffect(() => {
    setAttempt(null);
    setResult(null);
    setAnswers({});
    setTimeLeft(null);
    autoSubmittedRef.current = false;
    void loadState();
  }, [loadState]);

  const handleSubmit = useCallback(async () => {
    if (!attempt || submitting || result) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = attempt.questions.map((question) => ({
        question_id: question.id,
        selected_option_ids: answers[question.id] || [],
      }));
      const submitted = await learningApi.submitQuiz(attempt.attempt_id, payload);
      setResult(submitted);
      setAttempt(null);
      await loadState();
      if (submitted.passed) onCompleted();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo enviar la evaluación.'));
    } finally {
      setSubmitting(false);
    }
  }, [attempt, submitting, result, answers, loadState, onCompleted]);

  useEffect(() => {
    if (!attempt?.expires_at || result) {
      setTimeLeft(null);
      return;
    }

    const expiresAt = new Date(attempt.expires_at).getTime();
    autoSubmittedRef.current = false;

    const tick = () => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining === 0 && !autoSubmittedRef.current) {
        autoSubmittedRef.current = true;
        void handleSubmit();
      }
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [attempt, result, handleSubmit]);

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const started = await learningApi.startQuiz(courseId, classItem.id);
      setAttempt(started);
      setResult(null);
      setAnswers({});
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo iniciar la evaluación.'));
    } finally {
      setStarting(false);
    }
  };

  const selectOption = (
    questionId: string,
    optionId: string,
    multiple: boolean,
  ) => {
    setAnswers((previous) => {
      const current = previous[questionId] || [];
      if (!multiple) {
        return { ...previous, [questionId]: [optionId] };
      }
      return {
        ...previous,
        [questionId]: current.includes(optionId)
          ? current.filter((id) => id !== optionId)
          : [...current, optionId],
      };
    });
  };

  const answeredCount = attempt
    ? attempt.questions.filter((question) => (answers[question.id] || []).length > 0)
        .length
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] py-20 text-[#6E7882]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Cargando evaluación...
      </div>
    );
  }

  if (error && !state) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!state) {
    return (
      <div className="rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] p-6 text-sm text-[#6E7882]">
        Esta clase todavía no tiene una evaluación publicada.
      </div>
    );
  }

  if (result) {
    return (
      <div className="space-y-4">
        <section
          className={`rounded-2xl border p-6 ${
            result.passed
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-amber-200 bg-amber-50'
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                result.passed ? 'bg-emerald-100' : 'bg-amber-100'
              }`}
            >
              {result.passed ? (
                <Award className="w-6 h-6 text-emerald-700" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-amber-700" />
              )}
            </span>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#0D2B4D]">
                {result.passed ? '¡Evaluación aprobada!' : 'Aún no apruebas'}
              </h3>
              <p className="text-sm text-[#475569] mt-1">
                Obtuviste <strong>{result.score}%</strong> y necesitas al menos{' '}
                <strong>{result.passing_score}%</strong>.
              </p>
              {result.passed && (
                <p className="text-sm text-emerald-700 mt-2">
                  La clase quedó completada y tu progreso fue actualizado.
                </p>
              )}
            </div>
          </div>
        </section>

        {result.show_answers && (
          <section className="rounded-2xl border border-[var(--palette-border)] bg-white p-5">
            <h4 className="text-sm font-bold text-[#0D2B4D] mb-3">
              Revisión de respuestas
            </h4>
            <div className="space-y-3">
              {result.results.map((item, index) => (
                <div
                  key={item.question_id}
                  className={`rounded-xl border p-3 ${
                    item.is_correct
                      ? 'border-emerald-200 bg-emerald-50/60'
                      : 'border-red-200 bg-red-50/60'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {item.is_correct ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0D2B4D]">
                        {index + 1}. {item.prompt}
                      </p>
                      <p className="text-xs text-[#6E7882] mt-1">
                        {item.points_awarded} / {item.points_possible} puntos
                        {item.explanation ? ` · ${item.explanation}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleStart}
            className="company-btn-outline"
            disabled={
              starting ||
              (state.attempts_remaining !== null && state.attempts_remaining <= 0)
            }
          >
            <RotateCcw className="w-4 h-4" />
            {state.attempts_remaining === null || state.attempts_remaining > 0
              ? 'Volver a intentar'
              : 'Sin intentos restantes'}
          </button>
          <button type="button" onClick={onCompleted} className="company-btn-primary">
            <CheckCircle2 className="w-4 h-4" />
            {result.passed ? 'Continuar con el curso' : 'Actualizar progreso'}
          </button>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>
    );
  }

  if (attempt) {
    return (
      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--palette-border)] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-[#0D2B4D]">{state.title}</h3>
              <p className="text-sm text-[#6E7882] mt-1">
                {answeredCount} de {attempt.questions.length} preguntas respondidas
              </p>
            </div>
            {timeLeft !== null && (
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
                  timeLeft <= 60
                    ? 'bg-red-100 text-red-700'
                    : 'bg-[#1E5AA8]/10 text-[#1E5AA8]'
                }`}
              >
                <Clock3 className="w-4 h-4" />
                {formatTime(timeLeft)}
              </span>
            )}
          </div>
          <div className="mt-4 h-2 rounded-full bg-[#E2E8F0] overflow-hidden">
            <div
              className="h-full rounded-full bg-[#55C7E8] transition-all"
              style={{
                width: `${(answeredCount * 100) / attempt.questions.length}%`,
              }}
            />
          </div>
        </section>

        {attempt.questions.map((question, index) => (
          <section
            key={question.id}
            className="rounded-2xl border border-[var(--palette-border)] bg-white p-5"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm font-bold text-[#0D2B4D]">
                {index + 1}. {question.prompt}
              </p>
              <span className="text-xs text-[#6E7882] whitespace-nowrap">
                {question.points} {question.points === 1 ? 'punto' : 'puntos'}
              </span>
            </div>
            <div className="space-y-2">
              {question.options.map((option) => {
                const selected = (answers[question.id] || []).includes(option.id);
                return (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm cursor-pointer transition-colors ${
                      selected
                        ? 'border-[#1E5AA8] bg-[#1E5AA8]/5 text-[#0D2B4D]'
                        : 'border-[#E2E8F0] text-[#475569] hover:border-[#1E5AA8]/50'
                    }`}
                  >
                    <input
                      type={
                        question.question_type === 'multiple_choice'
                          ? 'checkbox'
                          : 'radio'
                      }
                      name={`quiz-${question.id}`}
                      checked={selected}
                      onChange={() =>
                        selectOption(
                          question.id,
                          option.id,
                          question.question_type === 'multiple_choice',
                        )
                      }
                      className="w-4 h-4 flex-shrink-0 rounded border-[#CBD5E1] text-[#1E5AA8]"
                    />
                    {option.text}
                  </label>
                );
              })}
            </div>
          </section>
        ))}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[#6E7882]">
            Intento {state.attempts_used + 1}
            {state.max_attempts ? ` de ${state.max_attempts}` : ''}
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            className="company-btn-primary"
            disabled={submitting || answeredCount < attempt.questions.length}
          >
            {submitting ? 'Enviando...' : 'Enviar evaluación'}
          </button>
        </div>
      </div>
    );
  }

  const hasAttempts =
    state.attempts_remaining === null || state.attempts_remaining > 0;

  return (
    <section className="rounded-2xl border border-[var(--palette-border)] bg-[var(--palette-surface)] p-6">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-6 h-6 text-amber-700" />
        </span>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#0D2B4D]">{state.title}</h3>
          <p className="text-sm text-[#6E7882] mt-1">
            {state.description ||
              'Responde la evaluación para completar esta clase.'}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="company-badge bg-white text-[#475569] border border-[#E2E8F0]">
              {state.question_count} preguntas
            </span>
            <span className="company-badge bg-white text-[#475569] border border-[#E2E8F0]">
              Nota mínima {state.passing_score}%
            </span>
            <span className="company-badge bg-white text-[#475569] border border-[#E2E8F0]">
              {state.max_attempts
                ? `${state.attempts_used}/${state.max_attempts} intentos`
                : `${state.attempts_used} intentos`}
            </span>
            {state.time_limit_minutes && (
              <span className="company-badge bg-white text-[#475569] border border-[#E2E8F0]">
                {state.time_limit_minutes} min
              </span>
            )}
            {state.best_score !== null && (
              <span
                className={`company-badge ${
                  state.passed
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-[#1E5AA8]/10 text-[#1E5AA8]'
                }`}
              >
                Mejor nota {state.best_score}%
              </span>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleStart}
              className="company-btn-primary"
              disabled={starting || !hasAttempts}
            >
              {starting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <PlayCircle className="w-4 h-4" />
                  {state.in_progress_attempt_id
                    ? 'Continuar intento'
                    : state.passed
                      ? 'Repetir evaluación'
                      : 'Comenzar evaluación'}
                </>
              )}
            </button>
            {!hasAttempts && !state.passed && (
              <span className="text-xs text-amber-700">
                No quedan intentos disponibles. Contacta a tu administrador.
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
