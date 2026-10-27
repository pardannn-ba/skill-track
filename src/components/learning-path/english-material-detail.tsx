import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import {
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  GraduationCap,
  PenLine,
  XCircle,
} from "lucide-react-native";
import { colors, learningColors } from "@/constants/theme";
import {
  type EnglishChoiceExercise,
  type EnglishExercise,
  type EnglishMaterialContent,
  type EnglishFillExercise,
  type LearningMaterial,
} from "@/data/learning-path";
import ThemedText from "@/components/ui/themed-text";

/** Warna feedback jawaban salah (merah lembut, konsisten dark navy). */
const WRONG_COLOR = "#FF7A7A";
/** Surface kartu bagian dalam (lebih gelap dari kartu timeline). */
const SUB_CARD_BG = "#0A1B31";

export type EnglishMaterialDetailProps = {
  material: LearningMaterial;
  /** Materi sudah selesai = tombol Tandai Selesai nonaktif. */
  isCompleted: boolean;
  /** Tandai materi selesai (dihandle halaman Learning Path). */
  onComplete: () => void;
  /** Buka referensi eksternal di browser. */
  onOpenReference: (url: string) => void;
};

/** State satu latihan: jawaban terpilih, teks isian, dan hasil pemeriksaan. */
type ExerciseState = {
  /** Index opsi terpilih (latihan pilihan ganda). */
  selected: number | null;
  /** Teks isian pengguna (latihan melengkapi kalimat). */
  input: string;
  /** Sudah diperiksa setidaknya sekali. */
  checked: boolean;
  /** Hasil pemeriksaan terakhir. */
  correct: boolean;
};

const initialExerciseState: ExerciseState = {
  selected: null,
  input: "",
  checked: false,
  correct: false,
};

/** Normalisasi jawaban isian: huruf kecil, tanpa spasi ganda/tanda baca akhir. */
function normalizeAnswer(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.!?,;]+$/, "");
}

const isChoice = (
  exercise: EnglishExercise,
): exercise is EnglishChoiceExercise => exercise.type === "choice";

/**
 * Detail materi Bahasa Inggris (inline pada kartu timeline Learning Path):
 * penjelasan berbahasa Indonesia, contoh kalimat + terjemahan, vocabulary,
 * latihan interaktif dengan feedback, link referensi British Council
 * LearnEnglish, dan tombol Tandai Selesai bergaya SkillTrack.
 *
 * Latihan hanyalah latihan: menyelesaikannya TIDAK otomatis menandai
 * materi selesai — itu tetap lewat tombol Tandai Selesai.
 */
export default function EnglishMaterialDetail({
  material,
  isCompleted,
  onComplete,
  onOpenReference,
}: EnglishMaterialDetailProps) {
  const content: EnglishMaterialContent | undefined = material.english;

  /** State tiap latihan, direset saat komponen detail dibuka/ditutup. */
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>(() =>
    (content?.exercises ?? []).map(() => ({ ...initialExerciseState })),
  );

  const exercises = content?.exercises ?? [];

  /** Perbarui satu latihan tanpa menyentuh latihan lain. */
  const updateExercise = useCallback(
    (index: number, patch: Partial<ExerciseState>) => {
      setExerciseStates((prev) =>
        prev.map((state, i) => (i === index ? { ...state, ...patch } : state)),
      );
    },
    [],
  );

  /** Pilih opsi pilihan ganda; memilih ulang mereset hasil pemeriksaan. */
  const chooseOption = (index: number, optionIndex: number) => {
    updateExercise(index, {
      selected: optionIndex,
      checked: false,
      correct: false,
    });
  };

  /** Ketik jawaban melengkapi kalimat; mengetik ulang mereset pemeriksaan. */
  const typeAnswer = (index: number, value: string) => {
    updateExercise(index, { input: value, checked: false, correct: false });
  };

  /** Periksa jawaban satu latihan dan tampilkan feedback. */
  const checkExercise = (index: number, exercise: EnglishExercise) => {
    const state = exerciseStates[index];
    if (!state) {
      return;
    }
    if (isChoice(exercise)) {
      if (state.selected === null) {
        return;
      }
      updateExercise(index, {
        checked: true,
        correct: state.selected === exercise.correctIndex,
      });
      return;
    }
    if (normalizeAnswer(state.input).length === 0) {
      return;
    }
    updateExercise(index, {
      checked: true,
      correct: normalizeAnswer(state.input) === normalizeAnswer(exercise.answer),
    });
  };

  const hasAnswer = (exercise: EnglishExercise, index: number): boolean => {
    const state = exerciseStates[index];
    if (!state) {
      return false;
    }
    return isChoice(exercise)
      ? state.selected !== null
      : normalizeAnswer(state.input).length > 0;
  };

  if (!content) {
    return null;
  }

  return (
    <View style={styles.detail}>
      {/* 1. Penjelasan materi (bahasa Indonesia) */}
      <View style={styles.sectionCard}>
        <ThemedText variant="body" style={styles.explanationText}>
          {material.explanation}
        </ThemedText>
        {material.points.length > 0 ? (
          <View style={styles.pointsWrap}>
            {material.points.map((point, pointIndex) => (
              <View key={point} style={styles.pointRow}>
                <View style={styles.pointDot} />
                <ThemedText
                  variant="caption"
                  color={learningColors.textSecondary}
                  style={styles.pointText}
                >
                  {point}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* 2. Contoh kalimat + terjemahan */}
      {content.examples && content.examples.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={15} color={learningColors.primary} />
            <ThemedText style={styles.sectionTitle}>
              Contoh Kalimat
            </ThemedText>
          </View>
          <View style={styles.sectionCard}>
            {content.examples.map((example, exampleIndex) => (
              <View
                key={`${example.sentence}-${exampleIndex}`}
                style={[
                  styles.exampleRow,
                  exampleIndex < content.examples!.length - 1 &&
                    styles.exampleRowDivider,
                ]}
              >
                <ThemedText style={styles.exampleSentence}>
                  {example.sentence}
                </ThemedText>
                <ThemedText
                  variant="caption"
                  color={learningColors.textSecondary}
                  style={styles.exampleTranslation}
                >
                  {example.translation}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* 3. Vocabulary: kata + artinya */}
      {content.vocabulary && content.vocabulary.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <GraduationCap size={15} color={learningColors.primary} />
            <ThemedText style={styles.sectionTitle}>Vocabulary</ThemedText>
          </View>
          <View style={styles.sectionCard}>
            {content.vocabulary.map((entry, entryIndex) => (
              <View
                key={entry.word}
                style={[
                  styles.vocabRow,
                  entryIndex < content.vocabulary!.length - 1 &&
                    styles.exampleRowDivider,
                ]}
              >
                <ThemedText style={styles.vocabWord} numberOfLines={2}>
                  {entry.word}
                </ThemedText>
                <ThemedText
                  variant="body"
                  color={learningColors.textSecondary}
                  style={styles.vocabMeaning}
                  numberOfLines={2}
                >
                  {entry.meaning}
                </ThemedText>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      {/* 4. Latihan interaktif */}
      {exercises.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <PenLine size={15} color={learningColors.primary} />
            <ThemedText style={styles.sectionTitle}>Latihan</ThemedText>
          </View>
          {exercises.map((exercise, exerciseIndex) => {
            const state = exerciseStates[exerciseIndex] ?? initialExerciseState;
            return (
              <View
                key={`exercise-${exerciseIndex}`}
                style={styles.sectionCard}
              >
                <ThemedText style={styles.exerciseTitle}>
                  {exercise.question}
                </ThemedText>

                {isChoice(exercise) ? (
                  <View style={styles.optionsWrap}>
                    {exercise.options.map((option, optionIndex) => (
                      <Pressable
                        key={option}
                        onPress={() =>
                          chooseOption(exerciseIndex, optionIndex)
                        }
                        disabled={state.checked && state.correct}
                        style={({ pressed }) => [
                          styles.optionRow,
                          state.selected === optionIndex &&
                            styles.optionSelected,
                          (pressed || state.selected === optionIndex) &&
                            styles.optionPressed,
                          state.checked &&
                            optionIndex === exercise.correctIndex &&
                            styles.optionCorrect,
                          state.checked &&
                            state.selected === optionIndex &&
                            state.correct === false &&
                            styles.optionWrong,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Pilihan ${optionIndex + 1}: ${option}`}
                        accessibilityState={{
                          selected: state.selected === optionIndex,
                          disabled: state.checked && state.correct,
                        }}
                      >
                        <View style={styles.optionLetterBadge}>
                          <ThemedText style={styles.optionLetter}>
                            {String.fromCharCode(65 + optionIndex)}
                          </ThemedText>
                        </View>
                        <ThemedText style={styles.optionText} numberOfLines={2}>
                          {option}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    value={state.input}
                    onChangeText={(value) => typeAnswer(exerciseIndex, value)}
                    placeholder="Ketik jawabanmu di sini..."
                    placeholderTextColor={learningColors.lockedText}
                    style={styles.fillInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    multiline
                    accessibilityLabel="Isi jawaban latihan"
                  />
                )}

                <Pressable
                  onPress={() => checkExercise(exerciseIndex, exercise)}
                  disabled={!hasAnswer(exercise, exerciseIndex) || state.checked}
                  style={({ pressed }) => [
                    styles.checkButton,
                    (!hasAnswer(exercise, exerciseIndex) || state.checked) &&
                      styles.checkButtonDisabled,
                    pressed && styles.rowPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Periksa jawaban latihan ${exerciseIndex + 1}`}
                >
                  <ThemedText style={styles.checkButtonText}>
                    {state.checked ? "Jawaban Diperiksa" : "Periksa Jawaban"}
                  </ThemedText>
                </Pressable>

                {/* 5. Feedback jawaban */}
                {state.checked ? (
                  <View
                    style={[
                      styles.feedback,
                      state.correct ? styles.feedbackCorrect : styles.feedbackWrong,
                    ]}
                  >
                    {state.correct ? (
                      <CheckCircle2
                        size={16}
                        color={learningColors.success}
                      />
                    ) : (
                      <XCircle size={16} color={WRONG_COLOR} />
                    )}
                    <View style={styles.feedbackTextWrap}>
                      <ThemedText
                        style={[
                          styles.feedbackTitle,
                          { color: state.correct ? learningColors.success : WRONG_COLOR },
                        ]}
                      >
                        {state.correct ? "Benar!" : "Belum tepat, coba lagi!"}
                      </ThemedText>
                      <ThemedText
                        variant="caption"
                        color={learningColors.textSecondary}
                        style={styles.feedbackExplanation}
                      >
                        {exercise.explanation}
                      </ThemedText>
                      {!state.correct && !isChoice(exercise) ? (
                        <ThemedText
                          variant="caption"
                          style={styles.feedbackAnswerKey}
                        >
                          Jawaban: {(exercise as EnglishFillExercise).answer}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                ) : (
                  <ThemedText
                    variant="caption"
                    color={learningColors.textSecondary}
                    style={styles.exerciseHint}
                  >
                    Latihan tidak memengaruhi progress materi.
                  </ThemedText>
                )}
              </View>
            );
          })}
        </View>
      ) : null}

      {/* 6. Referensi eksternal: British Council LearnEnglish */}
      <Pressable
        onPress={() => onOpenReference(material.referenceUrl)}
        style={({ pressed }) => [styles.linkRow, pressed && styles.rowPressed]}
        accessibilityRole="link"
        accessibilityLabel="Pelajari lebih lanjut di British Council LearnEnglish"
      >
        <ExternalLink size={16} color={learningColors.primary} />
        <ThemedText style={styles.linkText}>Pelajari lebih lanjut</ThemedText>
        <ThemedText
          variant="caption"
          color={learningColors.textSecondary}
          style={styles.linkSource}
        >
          British Council LearnEnglish
        </ThemedText>
        <ChevronRight size={18} color={learningColors.textSecondary} />
      </Pressable>

      {/* 7. Tandai Selesai (mengikuti gaya visual SkillTrack) */}
      <Pressable
        onPress={onComplete}
        disabled={isCompleted}
        style={({ pressed }) => [
          styles.completeButton,
          isCompleted && styles.completeButtonDone,
          pressed && !isCompleted && styles.rowPressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={
          isCompleted ? "Materi sudah selesai" : `Tandai ${material.title} selesai`
        }
      >
        {isCompleted ? (
          <ThemedText style={styles.completeButtonText}>
            Materi Selesai
          </ThemedText>
        ) : (
          <View style={styles.doneRow}>
            <Check size={18} color={learningColors.text} strokeWidth={3} />
            <ThemedText style={styles.completeButtonText}>
              Tandai Selesai
            </ThemedText>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  detail: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    gap: 12,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: learningColors.text,
  },
  sectionCard: {
    backgroundColor: SUB_CARD_BG,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  rowPressed: {
    opacity: 0.8,
  },
  // Penjelasan
  explanationText: {
    color: learningColors.text,
    lineHeight: 21,
  },
  pointsWrap: {
    gap: 5,
    marginTop: 2,
  },
  pointRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pointDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: learningColors.primary,
  },
  pointText: {
    flex: 1,
  },
  // Contoh kalimat
  exampleRow: {
    gap: 3,
  },
  exampleRowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 10,
  },
  exampleSentence: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: "#7BE3C8",
  },
  exampleTranslation: {
    fontStyle: "italic",
  },
  // Vocabulary
  vocabRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  vocabWord: {
    flexBasis: "42%",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: learningColors.text,
  },
  vocabMeaning: {
    flex: 1,
  },
  // Latihan
  exerciseTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: learningColors.text,
  },
  optionsWrap: {
    gap: 8,
  },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  optionPressed: {
    borderColor: learningColors.primary,
  },
  optionSelected: {
    borderColor: learningColors.primary,
    backgroundColor: colors.blueLayer,
  },
  optionCorrect: {
    borderColor: learningColors.success,
  },
  optionWrong: {
    borderColor: WRONG_COLOR,
  },
  optionLetterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.blueLayer,
    alignItems: "center",
    justifyContent: "center",
  },
  optionLetter: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
    color: learningColors.text,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: learningColors.text,
  },
  fillInput: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    lineHeight: 20,
    color: learningColors.text,
    minHeight: 44,
    textAlignVertical: "top",
  },
  exerciseHint: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: "italic",
  },
  // Tombol periksa & feedback
  checkButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.blueLayer,
    borderColor: learningColors.primary,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  checkButtonDisabled: {
    opacity: 0.45,
  },
  checkButtonText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: learningColors.text,
  },
  feedback: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 9,
  },
  feedbackCorrect: {
    backgroundColor: "rgba(53, 217, 173, 0.1)",
    borderColor: "rgba(53, 217, 173, 0.45)",
  },
  feedbackWrong: {
    backgroundColor: "rgba(255, 122, 122, 0.1)",
    borderColor: "rgba(255, 122, 122, 0.4)",
  },
  feedbackTextWrap: {
    flex: 1,
    gap: 2,
  },
  feedbackTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  feedbackExplanation: {
    fontSize: 12,
    lineHeight: 17,
  },
  feedbackAnswerKey: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    color: learningColors.text,
  },
  // Link referensi + tombol selesai
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  linkText: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: learningColors.primary,
  },
  linkSource: {
    marginLeft: "auto",
  },
  completeButton: {
    height: 50,
    borderRadius: 14,
    backgroundColor: learningColors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  completeButtonDone: {
    opacity: 0.55,
  },
  completeButtonText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "600",
    color: learningColors.text,
  },
  doneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
