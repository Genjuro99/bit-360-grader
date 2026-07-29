/*!
 * BIT360 Grader Engine — Lead Grader only
 * Version:   lead_grader_v1.1
 * Instrument: lead_grader (15-question, 0–100)
 *
 * This file contains ONLY the Lead Grader questions, weights, and scoring
 * function. It does NOT contain any professional assessment (BIT360-v2.3)
 * code, categories, thresholds, or engine logic.
 *
 * Questions and weights are identical to the canonical set in the
 * shared private engine. Outputs are byte-for-byte identical for the same inputs.
 *
 * License: MIT
 */
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = factory();
  } else {
    root.BIT360GraderEngine = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var LEAD_GRADER_VERSION = 'lead_grader_v1.1';

  // ── 15 canonical questions ────────────────────────────────────────────────
  // ids, labels, categories, and weights are locked to the approved canonical
  // set. Do not change without a new RC and parity test.
  var GRADER_QUESTIONS = [
    { id: 'gbp',               label: 'Google Business Profile claimed and fully complete?',        cat: 'Digital',    w: 10 },
    { id: 'google_rating',     label: 'Current Google rating',                                       cat: 'Reputation', w: 10, type: 'num' },
    { id: 'review_count',      label: 'Total number of Google reviews',                               cat: 'Reputation', w: 8,  type: 'num' },
    { id: 'review_response',   label: 'Owner responds to reviews consistently?',                      cat: 'Reputation', w: 8 },
    { id: 'website',           label: 'Functional, mobile-friendly website exists?',                  cat: 'Digital',    w: 8 },
    { id: 'online_menu',       label: 'Online menu is live, accurate, and shows prices?',              cat: 'Digital',    w: 7 },
    { id: 'online_ordering',   label: 'Online ordering enabled (direct or 3rd party)?',                cat: 'Digital',    w: 7 },
    { id: 'photos',            label: 'High-quality food photos visible online?',                      cat: 'Digital',    w: 6 },
    { id: 'hours_accurate',    label: 'Hours and contact info accurate across all platforms?',         cat: 'Digital',    w: 6 },
    { id: 'social_active',     label: 'Active on at least one social media platform?',                 cat: 'Social',     w: 6 },
    { id: 'social_consistent', label: 'Posts at least 3x per week consistently?',                      cat: 'Social',     w: 5 },
    { id: 'yelp_claimed',      label: 'Yelp or TripAdvisor profile claimed and active?',                cat: 'Reputation', w: 5 },
    { id: 'email_list',        label: 'Email list or loyalty program in place?',                       cat: 'Marketing',  w: 5 },
    { id: 'competitor_aware',  label: 'Owner can name top 2 direct local competitors?',                 cat: 'Ops',        w: 4 },
    { id: 'service_standard',  label: 'Front-of-house service standards are documented?',               cat: 'Ops',        w: 5 }
  ];

  // ── Scoring function ──────────────────────────────────────────────────────
  // Identical logic to the canonical calcGraderScore in the shared private engine.
  // Verified by parity tests in test-public-grader.js.
  function calcGraderScore(answers) {
    var earned = 0, total = 0;
    GRADER_QUESTIONS.forEach(function (q) {
      total += q.w;
      var a = answers[q.id];
      if (!a) return;
      if (q.type === 'num') {
        if (q.id === 'google_rating') {
          var v = parseFloat(a);
          if (v >= 4.5) earned += q.w;
          else if (v >= 4.0) earned += q.w * 0.7;
          else if (v >= 3.5) earned += q.w * 0.4;
        } else if (q.id === 'review_count') {
          var n = parseInt(a, 10);
          if (n >= 200) earned += q.w;
          else if (n >= 100) earned += q.w * 0.8;
          else if (n >= 50) earned += q.w * 0.5;
          else if (n >= 20) earned += q.w * 0.3;
        }
      } else {
        if (a === 'yes') earned += q.w;
        else if (a === 'partial') earned += q.w * 0.5;
      }
    });
    return total ? Math.round((earned / total) * 100) : 0;
  }

  return {
    LEAD_GRADER_VERSION: LEAD_GRADER_VERSION,
    GRADER_QUESTIONS:    GRADER_QUESTIONS,
    calcGraderScore:     calcGraderScore
  };
}));
