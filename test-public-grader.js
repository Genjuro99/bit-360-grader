/**
 * test-public-grader.js
 * Public Grader RC test suite
 *
 * Covers:
 *   Section 1  — Grader-only engine API surface
 *   Section 2  — All 15 questions present with correct ids, weights, categories
 *   Section 3  — Scoring boundaries (parity with shared engine)
 *   Section 4  — Zero external runtime dependencies in index.html
 *   Section 5  — No reference to full-engagement.html in any public file
 *   Section 6  — No reference to bit360-scoring-engine.js in any public file
 *   Section 7  — No jsPDF in any public file
 *   Section 8  — CTA link present, points to non-full-engagement URL
 *   Section 9  — No broken local file references (all src= files exist)
 *   Section 10 — Mobile: overflow-guard CSS present at 640px and 430px tiers
 *   Section 11 — Desktop: grader-grid 2-col, score-ring present
 *   Section 12 — Branded elements: Believe in Taste, Restaurant Grader
 *
 * Run: node test-public-grader.js
 * (from the bit360_public_grader directory)
 */
'use strict';

const fs   = require('fs');
const path = require('path');

let passed = 0, failed = 0;

function assert(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}
function assertEq(label, actual, expected) {
  const ok = actual === expected;
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}  (got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)})`);
    failed++;
  }
}

// ── Load engine ───────────────────────────────────────────────────────────────
const engineSrc = fs.readFileSync(path.join(__dirname, 'bit360-grader-engine.js'), 'utf8');
// Evaluate in a controlled context
const module_ = { exports: {} };
const fn = new Function('module', 'exports', engineSrc);
fn(module_, module_.exports);
const E = module_.exports;

const indexSrc   = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const engineText = engineSrc;

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1 — Grader-only engine API surface
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 1: Grader-only engine API surface ──');
assert('E.GRADER_QUESTIONS is an array',          Array.isArray(E.GRADER_QUESTIONS));
assert('E.calcGraderScore is a function',         typeof E.calcGraderScore === 'function');
assertEq('E.LEAD_GRADER_VERSION',                 E.LEAD_GRADER_VERSION, 'lead_grader_v1.1');
assert('Engine has no calculateProfessionalResult', !('calculateProfessionalResult' in E));
assert('Engine has no BITE_PHASES',               !('BITE_PHASES' in E));
assert('Engine has no tagProfessionalScan',       !('tagProfessionalScan' in E));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2 — All 15 questions with correct ids, weights, categories
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 2: 15 questions — ids, weights, categories ──');
assertEq('Exactly 15 questions', E.GRADER_QUESTIONS.length, 15);

const EXPECTED = [
  { id: 'gbp',               cat: 'Digital',    w: 10 },
  { id: 'google_rating',     cat: 'Reputation', w: 10 },
  { id: 'review_count',      cat: 'Reputation', w: 8  },
  { id: 'review_response',   cat: 'Reputation', w: 8  },
  { id: 'website',           cat: 'Digital',    w: 8  },
  { id: 'online_menu',       cat: 'Digital',    w: 7  },
  { id: 'online_ordering',   cat: 'Digital',    w: 7  },
  { id: 'photos',            cat: 'Digital',    w: 6  },
  { id: 'hours_accurate',    cat: 'Digital',    w: 6  },
  { id: 'social_active',     cat: 'Social',     w: 6  },
  { id: 'social_consistent', cat: 'Social',     w: 5  },
  { id: 'yelp_claimed',      cat: 'Reputation', w: 5  },
  { id: 'email_list',        cat: 'Marketing',  w: 5  },
  { id: 'competitor_aware',  cat: 'Ops',        w: 4  },
  { id: 'service_standard',  cat: 'Ops',        w: 5  },
];
const totalWeight = EXPECTED.reduce((s, q) => s + q.w, 0);
assertEq('Total weight = 100', totalWeight, 100);

EXPECTED.forEach(exp => {
  const q = E.GRADER_QUESTIONS.find(q => q.id === exp.id);
  assert(`Question ${exp.id} exists`,              !!q);
  if (q) {
    assertEq(`${exp.id} weight = ${exp.w}`,        q.w,   exp.w);
    assertEq(`${exp.id} category = ${exp.cat}`,    q.cat, exp.cat);
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3 — Scoring boundaries (parity with shared engine)
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 3: Scoring boundaries (parity) ──');
assertEq('Empty answers → 0', E.calcGraderScore({}), 0);

const perfect = {
  gbp:'yes', google_rating:'4.8', review_count:'250', review_response:'yes',
  website:'yes', online_menu:'yes', online_ordering:'yes', photos:'yes',
  hours_accurate:'yes', social_active:'yes', social_consistent:'yes',
  yelp_claimed:'yes', email_list:'yes', competitor_aware:'yes', service_standard:'yes'
};
assertEq('Perfect answers → 100', E.calcGraderScore(perfect), 100);

const partial = {
  gbp:'yes', google_rating:'4.2', review_count:'75', review_response:'partial',
  website:'yes', online_menu:'partial', online_ordering:'no', photos:'yes',
  hours_accurate:'yes', social_active:'yes', social_consistent:'no',
  yelp_claimed:'no', email_list:'no', competitor_aware:'yes', service_standard:'partial'
};
const partialScore = E.calcGraderScore(partial);
assert('Partial answers → 40–75', partialScore >= 40 && partialScore <= 75);

// google_rating tiers
const r45 = E.calcGraderScore({ google_rating:'4.5' });
const r40 = E.calcGraderScore({ google_rating:'4.0' });
const r35 = E.calcGraderScore({ google_rating:'3.5' });
const r30 = E.calcGraderScore({ google_rating:'3.0' });
assert('Rating 4.5 > 4.0', r45 > r40);
assert('Rating 4.0 > 3.5', r40 > r35);
assert('Rating 3.5 > 3.0', r35 > r30);
assertEq('Rating 3.0 → 0', r30, 0);

// review_count tiers
const c200 = E.calcGraderScore({ review_count:'200' });
const c100 = E.calcGraderScore({ review_count:'100' });
const c50  = E.calcGraderScore({ review_count:'50'  });
const c20  = E.calcGraderScore({ review_count:'20'  });
const c5   = E.calcGraderScore({ review_count:'5'   });
assert('200 reviews > 100', c200 > c100);
assert('100 reviews > 50',  c100 > c50);
assert('50 reviews > 20',   c50  > c20);
assertEq('5 reviews → 0',   c5,   0);

// boolean yes/partial/no
const yesS  = E.calcGraderScore({ website:'yes'     });
const partS = E.calcGraderScore({ website:'partial' });
const noS   = E.calcGraderScore({ website:'no'      });
assert('yes > partial > no', yesS > partS && partS > noS);
assertEq('no → 0', noS, 0);

// boundary: exactly 10 questions answered (score should be non-zero)
const ten = {};
E.GRADER_QUESTIONS.slice(0, 10).forEach(q => {
  ten[q.id] = q.type === 'num' ? (q.id === 'google_rating' ? '4.5' : '200') : 'yes';
});
assert('10 perfect answers → score > 0', E.calcGraderScore(ten) > 0);

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4 — Zero external runtime dependencies in index.html
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 4: Zero external runtime dependencies ──');
// No http/https src= or href= pointing to external scripts/styles
const externalScriptRe = /src\s*=\s*["']https?:\/\//gi;
const externalLinkRe   = /href\s*=\s*["']https?:\/\/[^"']*\.(js|css)/gi;
assert('No external script src in index.html',  !externalScriptRe.test(indexSrc));
assert('No external CSS href in index.html',    !externalLinkRe.test(indexSrc));
// No @import url() in CSS
assert('No @import url() in index.html',        !/@import\s+url\s*\(/i.test(indexSrc));
// No Google Fonts
assert('No fonts.googleapis.com in index.html', !indexSrc.includes('fonts.googleapis.com'));
assert('No fonts.gstatic.com in index.html',    !indexSrc.includes('fonts.gstatic.com'));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5 — No reference to full-engagement.html in any public file
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 5: No full-engagement.html references ──');
assert('index.html has no full-engagement.html link',   !indexSrc.includes('full-engagement'));
assert('grader engine has no full-engagement reference', !engineText.includes('full-engagement'));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6 — No reference to bit360-scoring-engine.js in any public file
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 6: No shared engine reference ──');
assert('index.html does not load bit360-scoring-engine.js',
  !indexSrc.includes('bit360-scoring-engine'));
assert('Grader engine does not reference bit360-scoring-engine.js',
  !engineText.includes('bit360-scoring-engine'));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7 — No jsPDF in any public file
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 7: No jsPDF ──');
assert('index.html has no jspdf script tag',  !indexSrc.toLowerCase().includes('jspdf'));
assert('Grader engine has no jsPDF reference', !engineText.toLowerCase().includes('jspdf'));
const jspdfFile = path.join(__dirname, 'jspdf.umd.min.js');
assert('jspdf.umd.min.js not present in directory', !fs.existsSync(jspdfFile));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8 — CTA link present and points to non-full-engagement URL
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 8: CTA link ──');
assert('CTA_URL is the approved Acuity URL',       indexSrc.includes("const CTA_URL = 'https://believeintaste.as.me/schedule/fd42ae71'"));
assert('CTA data-cta attribute present',          indexSrc.includes("data-cta': 'consultation'"));
assert('CTA does not link to full-engagement',    !indexSrc.match(/CTA_URL\s*=\s*['"][^'"]*full-engagement/));
assert('CTA link uses target=_blank',             indexSrc.includes("target: '_blank'"));
assert('CTA link uses rel=noopener noreferrer',   indexSrc.includes('noopener noreferrer'));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9 — No broken local file references
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 9: No broken local file references ──');
const srcRe = /src\s*=\s*["']([^"']+)["']/g;
let m;
const localSrcs = [];
while ((m = srcRe.exec(indexSrc)) !== null) {
  const src = m[1];
  if (!src.startsWith('http')) localSrcs.push(src);
}
localSrcs.forEach(src => {
  const fullPath = path.join(__dirname, src);
  assert(`Local file exists: ${src}`, fs.existsSync(fullPath));
});
assert('At least 3 local src references found', localSrcs.length >= 3);

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10 — Mobile: overflow-guard CSS at 640px and 430px tiers
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 10: Mobile overflow-guard CSS ──');
assert('640px media query present',              indexSrc.includes('max-width: 640px'));
assert('430px media query present',              indexSrc.includes('max-width: 430px'));
assert('overflow-x: hidden on body',             indexSrc.includes('overflow-x: hidden'));
assert('grader-grid collapses at 640px',         indexSrc.includes('grader-grid') && indexSrc.includes('grid-template-columns: 1fr'));
assert('score-item collapses at 640px',          indexSrc.includes('score-item') && indexSrc.includes('1fr auto'));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11 — Desktop: key layout classes present
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 11: Desktop layout classes ──');
assert('grader-grid 2-col defined',   indexSrc.includes('grid-template-columns: 1fr 1fr'));
assert('score-ring class defined',    indexSrc.includes('.score-ring'));
assert('score-ring-val class defined', indexSrc.includes('.score-ring-val'));
assert('topbar sticky positioning',   indexSrc.includes('position: sticky'));
assert('max-width 900px main',        indexSrc.includes('max-width: 900px'));

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12 — Branded elements
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n── Section 12: Branded elements ──');
assert('Brand name "Believe in Taste" in index.html',  indexSrc.includes('Believe in Taste'));
assert('"Restaurant Grader" in title tag',             indexSrc.includes('<title>Restaurant Grader'));
assert('"Restaurant Grader" in topbar-sub',            indexSrc.includes('Restaurant Grader'));
assert('Gold brand color #c9a84c defined',             indexSrc.includes('#c9a84c'));
assert('DM Serif Display font defined (system fallback)', indexSrc.includes('DM Serif Display'));
assert('Meta description present',                     indexSrc.includes('<meta name="description"'));

// ═══════════════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n══════════════════════════════════════════════════════');
if (failed === 0) {
  console.log(`PUBLIC GRADER RC: PASSED ${passed} / ${passed}`);
  console.log('All public grader checks passed.');
} else {
  console.error(`PUBLIC GRADER RC: PASSED ${passed} / ${passed + failed}  FAILED ${failed}`);
  process.exit(1);
}
console.log('══════════════════════════════════════════════════════\n');
