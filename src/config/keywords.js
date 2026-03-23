/**
 * HACOY Daily News Tracker — Keyword Configuration
 *
 * Keywords and scoring weights for relevance scoring.
 * Bilingual (EN + DE) to match both English and German articles.
 */

/** High-relevance keywords (15 points each) */
export const highKeywords = [
  // English
  'sustainable fashion', 'circular economy', 'ethical fashion',
  'organic cotton', 'gots certified', 'gots', 'slow fashion',
  'fair trade fashion', 'circular fashion', 'ethical clothing',
  'sustainable clothing', 'eco fashion', 'conscious fashion',
  'regenerative fashion', 'fashion transparency',
  // German
  'nachhaltige mode', 'kreislaufwirtschaft', 'ethische mode',
  'bio-baumwolle', 'faire mode', 'slow fashion',
  'nachhaltige kleidung', 'zirkuläre mode', 'öko-mode',
];

/** Medium-relevance keywords (10 points each) */
export const mediumKeywords = [
  // English
  'activewear', 'sportswear', 'munich', 'bavaria', 'bavarian',
  'textile innovation', 'supply chain transparency', 'upcycling',
  'recycled textiles', 'fashion rental', 'resale fashion',
  'secondhand fashion', 'fashion repair', 'capsule wardrobe',
  'european craftsmanship', 'artisan production', 'made in europe',
  'fashion startup', 'sustainable materials', 'biodegradable',
  // German
  'münchen', 'bayern', 'bayerisch', 'textilinnovation',
  'lieferkettentransparenz', 'upcycling', 'secondhand mode',
  'mode-startup', 'nachhaltige materialien', 'handwerk',
];

/** Low-relevance keywords (5 points each) */
export const lowKeywords = [
  // English
  'fashion tech', 'fashiontech', 'startup', 'eu regulation',
  'textile', 'manufacturing', 'craftsmanship', 'consumer psychology',
  'brand strategy', 'direct to consumer', 'd2c', 'dtc',
  'fashion industry', 'fashion week', 'retail innovation',
  'ecommerce fashion', 'fashion brand', 'luxury fashion',
  'fashion market', 'clothing industry', 'apparel',
  // German
  'mode-technologie', 'startup', 'eu-regulierung', 'textil',
  'fertigung', 'handwerkskunst', 'konsumpsychologie',
  'markenstrategie', 'modeindustrie', 'einzelhandel',
  'bekleidungsindustrie',
];

/** Geographic bonus keywords */
export const geoKeywords = {
  munich: {
    bonus: 20,
    terms: ['munich', 'münchen', 'bavaria', 'bayern', 'bavarian', 'bayerisch', 'oberbayern'],
  },
  dach: {
    bonus: 10,
    terms: [
      'germany', 'deutschland', 'austria', 'österreich', 'switzerland', 'schweiz',
      'berlin', 'hamburg', 'frankfurt', 'vienna', 'wien', 'zurich', 'zürich',
      'düsseldorf', 'cologne', 'köln', 'stuttgart', 'nuremberg', 'nürnberg',
      'salzburg', 'innsbruck', 'bern', 'basel', 'graz', 'linz',
    ],
  },
};

/** Known companies to track in fashion/sustainability space */
export const trackedCompanies = [
  'HACOY', 'Patagonia', 'Stella McCartney', 'Veja', 'Armedangels',
  'Hessnatur', 'Armed Angels', 'Nudie Jeans', 'Reformation',
  'Everlane', 'Eileen Fisher', 'People Tree', 'Thought Clothing',
  'Kings of Indigo', 'Mud Jeans', 'Ecoalf', 'Dedicated',
  'Knowledge Cotton Apparel', 'Lanius', 'Jan n June',
  'H&M', 'Zara', 'Inditex', 'Shein', 'Zalando', 'About You',
  'Adidas', 'Nike', 'Puma', 'Hugo Boss', 'Trigema',
  'Vaude', 'Jack Wolfskin', 'Brax', 'Marc O\'Polo',
  'Mytheresa', 'Net-a-Porter', 'Farfetch', 'Vestiaire Collective',
  'ThredUp', 'Depop', 'Vinted',
];

/** Scoring weights */
export const scoring = {
  highWeight: 15,
  mediumWeight: 10,
  lowWeight: 5,
  maxScore: 100,
  minThreshold: 15,
};
