import { useEffect, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Loader2, Plus, Trash2, X } from 'lucide-react';
import {
  companyApi,
  getApiErrorMessage,
  type QuestionType,
  type QuizUpsertPayload,
} from '../../lib/companyApi';

interface EditableOption {
  key: string;
  text: string;
  is_correct: boolean;
}

interface EditableQuestion {
  key: string;
  prompt: string;
  question_type: QuestionType;
  points: string;
  explanation: string;
  options: EditableOption[];
}

interface QuizSettings {
  title: string;
  description: string;
  passing_score: string;
  max_attempts: string;
  time_limit_minutes: string;
  show_answers_after_submit: boolean;
  is_published: boolean;
}

const uid = () => Math.random().toString(36).slice(2);

const newOption = (isCorrect = false): EditableOption => ({
  key: uid(),
  text: '',
  is_correct: isCorrect,
});

const trueFalseOptions = (): EditableOption[] => [
  { key: uid(), text: 'Verdadero', is_correct: true },
  { key: uid(), text: 'Falso', is_correct: false },
];

const newQuestion = (): EditableQuestion => ({
  key: uid(),
  prompt: '',
  question_type: 'single_choice',
  points: '1',
  explanation: '',
  options: [newOption(true), newOption(false)],
});

const defaultSettings = (title: string): QuizSettings => ({
  title,
  description: '',
  passing_score: '70',
  max_attempts: '3',
  time_limit_minutes: '15',
  show_answers_after_submit: true,
  is_published: true,
});

interface QuizEditorModalProps {
  open: boolean;
  onClose: () => void;
  classId: string;
  classTitle: string;
  onSaved: () => void;
}

export function QuizEditorModal({
  open,
  onClose,
  classId,
  classTitle,
  onSaved,
}: QuizEditorModalProps) {
  const [settings, setSettings] = useState<QuizSettings>(defaultSettings(classTitle));
  const [questions, setQuestions] = useState<EditableQuestion[]>([newQuestion()]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError('');
    setSettings(defaultSettings(classTitle));
    setQuestions([newQuestion()]);

    companyApi
      .getClassQuiz(classId)
      .then((quiz) => {
        if (!active) return;
        setSettings({
          title: quiz.title,
          description: quiz.description || '',
          passing_score: String(quiz.passing_score),
          max_attempts: quiz.max_attempts ? String(quiz.max_attempts) : '',
          time_limit_minutes: quiz.time_limit_minutes
            ? String(quiz.time_limit_minutes)
            : '',
          show_answers_after_submit: quiz.show_answers_after_submit,
          is_published: quiz.is_published,
        });
        setQuestions(
          quiz.questions.map((question) => ({
            key: uid(),
            prompt: question.prompt,
            question_type: question.question_type,
            points: String(question.points),
            explanation: question.explanation || '',
            options: question.options.map((option) => ({
              key: uid(),
              text: option.text,
              is_correct: option.is_correct,
            })),
          })),
        );
      })
      .catch((err) => {
        if (!active) return;
        if (axios.isAxiosError(err) && err.response?.status === 404) {
          return;
        }
        setError(getApiErrorMessage(err, 'No se pudo cargar el quiz.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, classId, classTitle]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const updateQuestion = (index: number, patch: Partial<EditableQuestion>) => {
    setQuestions((previous) =>
      previous.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  };

  const changeType = (index: number, type: QuestionType) => {
    setQuestions((previous) =>
      previous.map((question, questionIndex) => {
        if (questionIndex !== index) return question;

        if (type === 'true_false') {
          return { ...question, question_type: type, options: trueFalseOptions() };
        }

        let options = question.options;
        if (type === 'single_choice') {
          const firstCorrect = options.findIndex((option) => option.is_correct);
          const correctIndex = firstCorrect >= 0 ? firstCorrect : 0;
          options = options.map((option, optionIndex) => ({
            ...option,
            is_correct: optionIndex === correctIndex,
          }));
        }
        return { ...question, question_type: type, options };
      }),
    );
  };

  const toggleCorrect = (questionIndex: number, optionIndex: number) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex) return question;
        const multiple = question.question_type === 'multiple_choice';
        return {
          ...question,
          options: question.options.map((option, indexOption) => ({
            ...option,
            is_correct: multiple
              ? indexOption === optionIndex
                ? !option.is_correct
                : option.is_correct
              : indexOption === optionIndex,
          })),
        };
      }),
    );
  };

  const addOption = (questionIndex: number) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? { ...question, options: [...question.options, newOption(false)] }
          : question,
      ),
    );
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    setQuestions((previous) =>
      previous.map((question, index) => {
        if (index !== questionIndex || question.options.length <= 2) return question;
        const options = question.options.filter((_, i) => i !== optionIndex);
        if (!options.some((option) => option.is_correct)) {
          options[0] = { ...options[0], is_correct: true };
        }
        return { ...question, options };
      }),
    );
  };

  const updateOptionText = (
    questionIndex: number,
    optionIndex: number,
    text: string,
  ) => {
    setQuestions((previous) =>
      previous.map((question, index) =>
        index === questionIndex
          ? {
              ...question,
              options: question.options.map((option, i) =>
                i === optionIndex ? { ...option, text } : option,
              ),
            }
          : question,
      ),
    );
  };

  const removeQuestion = (index: number) => {
    setQuestions((previous) =>
      previous.length <= 1
        ? previous
        : previous.filter((_, questionIndex) => questionIndex !== index),
    );
  };

  const validate = (): string => {
    if (!settings.title.trim()) return 'El título del quiz es obligatorio.';

    const passing = Number(settings.passing_score);
    if (!Number.isFinite(passing) || passing < 1 || passing > 100) {
      return 'La nota mínima debe estar entre 1 y 100.';
    }

    if (settings.is_published && questions.length === 0) {
      return 'Agrega al menos una pregunta antes de publicar.';
    }

    for (const [index, question] of questions.entries()) {
      if (!question.prompt.trim()) {
        return `La pregunta ${index + 1} necesita un enunciado.`;
      }
      if (!Number.isInteger(Number(question.points)) || Number(question.points) < 1) {
        return `Los puntos de la pregunta ${index + 1} deben ser un entero mayor a cero.`;
      }
      if (question.options.length < 2) {
        return `La pregunta ${index + 1} necesita al menos dos opciones.`;
      }
      if (question.options.some((option) => !option.text.trim())) {
        return `Completa el texto de todas las opciones de la pregunta ${index + 1}.`;
      }
      const correctCount = question.options.filter((option) => option.is_correct).length;
      if (question.question_type === 'multiple_choice') {
        if (correctCount < 1) {
          return `La pregunta ${index + 1} necesita al menos una opción correcta.`;
        }
      } else if (correctCount !== 1) {
        return `La pregunta ${index + 1} debe tener exactamente una opción correcta.`;
      }
    }

    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: QuizUpsertPayload = {
      title: settings.title.trim(),
      description: settings.description.trim() || null,
      passing_score: Number(settings.passing_score),
      max_attempts: settings.max_attempts ? Number(settings.max_attempts) : null,
      time_limit_minutes: settings.time_limit_minutes
        ? Number(settings.time_limit_minutes)
        : null,
      show_answers_after_submit: settings.show_answers_after_submit,
      is_published: settings.is_published,
      questions: questions.map((question, questionIndex) => ({
        prompt: question.prompt.trim(),
        question_type: question.question_type,
        points: Number(question.points),
        explanation: question.explanation.trim() || null,
        position: questionIndex + 1,
        options: question.options.map((option) => ({
          text: option.text.trim(),
          is_correct: option.is_correct,
        })),
      })),
    };

    setSaving(true);
    setError('');
    try {
      await companyApi.upsertClassQuiz(classId, payload);
      onSaved();
      onClose();
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo guardar el quiz.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="absolute inset-0 bg-[#0D2B4D]/60 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quiz-editor-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-4xl flex-col rounded-xl border border-[#E2E8F0] bg-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-6 py-5">
          <div>
            <h2 id="quiz-editor-title" className="text-lg font-bold text-[#0D2B4D]">
              Configurar quiz
            </h2>
            <p className="text-sm text-[#6E7882] mt-1">{classTitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[#6E7882] hover:bg-[#F1F5F9]"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-[#6E7882]">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Cargando quiz...
            </div>
          ) : (
            <>
              <section className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                    Título del quiz *
                  </label>
                  <input
                    value={settings.title}
                    onChange={(event) =>
                      setSettings({ ...settings, title: event.target.value })
                    }
                    className="company-input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                    Descripción
                  </label>
                  <textarea
                    value={settings.description}
                    onChange={(event) =>
                      setSettings({ ...settings, description: event.target.value })
                    }
                    className="company-input min-h-16 resize-y"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Nota mínima (%)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={settings.passing_score}
                      onChange={(event) =>
                        setSettings({ ...settings, passing_score: event.target.value })
                      }
                      className="company-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Intentos máximos
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={settings.max_attempts}
                      onChange={(event) =>
                        setSettings({ ...settings, max_attempts: event.target.value })
                      }
                      className="company-input"
                      placeholder="Ilimitados"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#0D2B4D] mb-1.5">
                      Tiempo límite (min)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={settings.time_limit_minutes}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          time_limit_minutes: event.target.value,
                        })
                      }
                      className="company-input"
                      placeholder="Sin límite"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-5 text-sm text-[#475569]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.show_answers_after_submit}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          show_answers_after_submit: event.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#1E5AA8]"
                    />
                    Mostrar respuestas al enviar
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={settings.is_published}
                      onChange={(event) =>
                        setSettings({
                          ...settings,
                          is_published: event.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-[#CBD5E1] text-[#1E5AA8]"
                    />
                    Publicar quiz
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#0D2B4D]">
                    Preguntas ({questions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setQuestions([...questions, newQuestion()])}
                    className="company-btn-outline !py-2 !px-3 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar pregunta
                  </button>
                </div>

                {questions.map((question, questionIndex) => (
                  <article
                    key={question.key}
                    className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-xs font-bold uppercase tracking-wide text-[#6E7882]">
                        Pregunta {questionIndex + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeQuestion(questionIndex)}
                        className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-40"
                        disabled={questions.length <= 1}
                        aria-label="Eliminar pregunta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px_90px] gap-3 mb-3">
                      <select
                        value={question.question_type}
                        onChange={(event) =>
                          changeType(questionIndex, event.target.value as QuestionType)
                        }
                        className="company-input"
                      >
                        <option value="single_choice">Selección única</option>
                        <option value="multiple_choice">Selección múltiple</option>
                        <option value="true_false">Verdadero / Falso</option>
                      </select>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={question.points}
                          onChange={(event) =>
                            updateQuestion(questionIndex, { points: event.target.value })
                          }
                          className="company-input"
                          placeholder="Puntos"
                          aria-label="Puntos"
                        />
                      </div>
                      <div className="text-xs text-[#6E7882] self-center">
                        {question.question_type === 'multiple_choice'
                          ? 'Varias correctas'
                          : 'Una correcta'}
                      </div>
                    </div>

                    <textarea
                      value={question.prompt}
                      onChange={(event) =>
                        updateQuestion(questionIndex, { prompt: event.target.value })
                      }
                      className="company-input min-h-16 resize-y mb-3"
                      placeholder="Escribe el enunciado de la pregunta"
                    />

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={option.key} className="flex items-center gap-2">
                          <input
                            type={
                              question.question_type === 'multiple_choice'
                                ? 'checkbox'
                                : 'radio'
                            }
                            name={`correct-${question.key}`}
                            checked={option.is_correct}
                            onChange={() => toggleCorrect(questionIndex, optionIndex)}
                            className="w-4 h-4 flex-shrink-0 rounded border-[#CBD5E1] text-[#1E5AA8]"
                            aria-label={`Marcar opción ${optionIndex + 1} como correcta`}
                          />
                          <input
                            value={option.text}
                            onChange={(event) =>
                              updateOptionText(
                                questionIndex,
                                optionIndex,
                                event.target.value,
                              )
                            }
                            className="company-input"
                            placeholder={`Opción ${optionIndex + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(questionIndex, optionIndex)}
                            className="p-1.5 rounded-lg text-[#6E7882] hover:bg-white disabled:opacity-30"
                            disabled={
                              question.options.length <= 2 ||
                              question.question_type === 'true_false'
                            }
                            aria-label="Eliminar opción"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {question.question_type !== 'true_false' && (
                      <button
                        type="button"
                        onClick={() => addOption(questionIndex)}
                        className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5AA8] hover:text-[#0D2B4D]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Agregar opción
                      </button>
                    )}

                    <div className="mt-3">
                      <input
                        value={question.explanation}
                        onChange={(event) =>
                          updateQuestion(questionIndex, {
                            explanation: event.target.value,
                          })
                        }
                        className="company-input"
                        placeholder="Explicación opcional que verá el alumno"
                      />
                    </div>
                  </article>
                ))}
              </section>
            </>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[#E2E8F0] px-6 py-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-[#6E7882]">
            <CheckCircle2 className="w-4 h-4 text-[#1E5AA8]" />
            Calificación automática en el servidor
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="company-btn-outline"
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="company-btn-primary"
              disabled={saving || loading}
            >
              {saving ? 'Guardando...' : 'Guardar quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
