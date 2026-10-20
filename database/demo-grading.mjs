export function gradeQuestions(qs, answers) {
  const normalize = v => String(v ?? "").normalize("NFKC").trim().replace(/\s+/g, " ").toLowerCase();
  let totalPoints = 0,
    earnedPoints = 0,
    correctCount = 0,
    pending = false;
  const details = qs.map(q => {
    totalPoints += q.points;
    const choice = q.answers.find(a => a.is_correct);
    const selected = answers[q.id];
    const manual = ["essay", "speaking"].includes(q.type);
    pending ||= manual;
    const isCorrect = manual ? false : choice ? Number(selected) === choice.id : q.correct_text.split("|").some(v => normalize(v) === normalize(selected));
    if (isCorrect) {
      earnedPoints += q.points;
      correctCount++;
    }
    return {
      questionId: q.id,
      question_id: q.id,
      question_content: q.content,
      type: q.type,
      points: q.points,
      selectedAnswerId: choice ? Number(selected) || null : null,
      selected_answer: choice ? q.answers.find(a => a.id === Number(selected))?.content || "" : String(selected ?? ""),
      correctAnswerId: choice?.id || null,
      correct_answer: choice?.content || q.correct_text,
      isCorrect,
      is_correct: isCorrect,
      explanation: q.explanation,
      earnedPoints: isCorrect ? q.points : 0,
      needs_grading: manual
    };
  });
  return {
    scorePercentage: totalPoints ? +(earnedPoints / totalPoints * 100).toFixed(2) : 0,
    correctCount,
    totalQuestions: qs.length,
    earnedPoints,
    totalPoints,
    pending_grading: pending,
    details,
    questions: details
  };
}
