/** User-facing text that must stay consistent across UI, print report and docs. */

export const DISCLAIMER_SHORT =
  'For use by healthcare professionals. Estimates population-level risk; not a diagnosis. ' +
  'Not validated for Kuwait or other Gulf countries.';

export const DISCLAIMER_FULL = [
  'This tool is intended for use by qualified healthcare professionals as a decision aid. ' +
    'It is not a substitute for clinical judgement and does not provide a diagnosis or treatment recommendation for any individual.',
  'Each risk model applies only to the population it was developed for (shown on the first screen of each calculator). ' +
    'SCORE2 (40–69 years) and SCORE2-OP (70–89 years) are for apparently healthy people without established atherosclerotic cardiovascular disease, ' +
    'diabetes, moderate or severe chronic kidney disease, or familial hypercholesterolaemia; SCORE2-Diabetes is for type 2 diabetes without established ' +
    'ASCVD or severe target-organ damage.',
  'SCORE2, SCORE2-OP and SCORE2-Diabetes are calibrated to four European risk regions. None of the models has been calibrated or validated for the population ' +
    'of Kuwait or other Gulf (GCC) countries; for these patients the absolute risk shown may be inaccurate and the choice of risk region is a clinical judgement.',
  'This calculator is an independent implementation of the published risk algorithms. ' +
    'It is not produced, reviewed or endorsed by the European Society of Cardiology (ESC).',
  'No patient data are stored or transmitted. All calculations run locally in the browser.',
];

export const RESULT_EXPLANATION =
  'This is the estimated probability that this person will have a cardiovascular event ' +
  '(such as myocardial infarction, stroke or cardiovascular death) within the next 10 years, assuming current risk factor levels.';
