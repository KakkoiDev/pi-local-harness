document.getElementById('toaster').toast({
  category: 'success',              // success | info | warning | error
  title: t('toast.note_deleted'),   // short, past tense
  description: '“Week 3 · Vocabulary”',
  action: { label: t('common.undo'), onclick: 'undoDelete("n_42")' },
  duration: 6000                    // ms; default 3000, errors 5000, -1 stays until closed
});
