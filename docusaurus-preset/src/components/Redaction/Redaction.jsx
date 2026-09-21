/**
 * <Redaction />
 *
 * Filinq's mini-game. A document is going out. Black out everything in
 * it that may not be published, then publish it, before the clock does
 * that for you.
 *
 * Both mistakes cost, and they cost differently: leaving a name or a
 * citizen number visible is a breach and costs a life, blacking out
 * half the page costs points. A game that punished both the same would
 * teach people to redact everything, which is the other way of failing
 * at this.
 *
 * The rules live in ./engine.js with no DOM and no clock.
 *
 * Usage on a product page:
 *
 *   <Redaction />
 *
 * Fires the shared `connext:gameend` event on game over, and listens
 * for `connext:gamereplay`.
 *
 * Accessibility: every word is a toggle button that says whether it is
 * blacked out, so the document can be read and redacted from the
 * keyboard, and the countdown is announced rather than only drawn.
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {translate} from '@docusaurus/Translate';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {createGame, black, publish, step, remaining, summarise} from './engine';
import styles from './Redaction.module.css';

const GAME_ID = 'redaction';
const TICK_MS = 100;

/* The words of every document. Kept here rather than in the engine so
   the rules stay free of copy, and so each phrase is a translatable
   string in its own right.

   Built once, on first use rather than at module load, so a locale
   bundle is never read before Docusaurus has one. */
let cache = null;

/**
 * The values a field can be dealt.
 *
 * Every field draws from a pool, so two permits are not the same
 * permit and a player who learned "de Vries is the name" has learned
 * nothing. Which value a document gets is the engine's `pick`.
 *
 * The pools are also where the traps live, and they are the honest
 * ones: a date of birth must go and a decision date may stay, a
 * benefit amount must go and an invoice total may stay. The judgement
 * is whether the field is about a person, never what it looks like.
 */
function pools() {
  return {
    /* Must be blacked out */
    name: [
      translate({id: 'preset.redaction.value.name.1', message: 'J. de Vries', description: 'Redaction document value: a personal name, which must be redacted'}),
      translate({id: 'preset.redaction.value.name.2', message: 'M. el Amrani', description: 'Redaction document value: a personal name, which must be redacted'}),
      translate({id: 'preset.redaction.value.name.3', message: 'S. Bakker-Oost', description: 'Redaction document value: a personal name, which must be redacted'}),
      translate({id: 'preset.redaction.value.name.4', message: 'R. Tjon', description: 'Redaction document value: a personal name, which must be redacted'}),
      translate({id: 'preset.redaction.value.name.5', message: 'A. Kowalski', description: 'Redaction document value: a personal name, which must be redacted'}),
      translate({id: 'preset.redaction.value.name.6', message: 'F. Öztürk', description: 'Redaction document value: a personal name, which must be redacted'}),
    ],
    address: [
      translate({id: 'preset.redaction.value.address.1', message: 'Keizersgracht 12', description: 'Redaction document value: a home address, which must be redacted'}),
      translate({id: 'preset.redaction.value.address.2', message: 'Dorpsstraat 8b', description: 'Redaction document value: a home address, which must be redacted'}),
      translate({id: 'preset.redaction.value.address.3', message: 'Lange Nieuwstraat 233', description: 'Redaction document value: a home address, which must be redacted'}),
      translate({id: 'preset.redaction.value.address.4', message: 'Molenweg 4', description: 'Redaction document value: a home address, which must be redacted'}),
      translate({id: 'preset.redaction.value.address.5', message: 'Havenkade 71-C', description: 'Redaction document value: a home address, which must be redacted'}),
    ],
    bsn: [
      translate({id: 'preset.redaction.value.bsn.1', message: 'BSN 1234 56 789', description: 'Redaction document value: a citizen service number, which must be redacted'}),
      translate({id: 'preset.redaction.value.bsn.2', message: 'BSN 9876 54 321', description: 'Redaction document value: a citizen service number, which must be redacted'}),
      translate({id: 'preset.redaction.value.bsn.3', message: 'BSN 2048 11 903', description: 'Redaction document value: a citizen service number, which must be redacted'}),
      translate({id: 'preset.redaction.value.bsn.4', message: 'BSN 3317 08 264', description: 'Redaction document value: a citizen service number, which must be redacted'}),
    ],
    iban: [
      translate({id: 'preset.redaction.value.iban.1', message: 'NL91 ABNA 0417 1643 00', description: 'Redaction document value: a bank account, which must be redacted'}),
      translate({id: 'preset.redaction.value.iban.2', message: 'NL02 RABO 0300 0652 91', description: 'Redaction document value: a bank account, which must be redacted'}),
      translate({id: 'preset.redaction.value.iban.3', message: 'NL44 INGB 0007 7212 08', description: 'Redaction document value: a bank account, which must be redacted'}),
      translate({id: 'preset.redaction.value.iban.4', message: 'NL18 SNSB 0908 1173 24', description: 'Redaction document value: a bank account, which must be redacted'}),
    ],
    email: [
      translate({id: 'preset.redaction.value.email.1', message: 'j.devries@example.nl', description: 'Redaction document value: a personal email address, which must be redacted'}),
      translate({id: 'preset.redaction.value.email.2', message: 'm.elamrani@example.nl', description: 'Redaction document value: a personal email address, which must be redacted'}),
      translate({id: 'preset.redaction.value.email.3', message: 's.bakker@example.com', description: 'Redaction document value: a personal email address, which must be redacted'}),
      translate({id: 'preset.redaction.value.email.4', message: 'r.tjon@example.org', description: 'Redaction document value: a personal email address, which must be redacted'}),
    ],
    birthdate: [
      translate({id: 'preset.redaction.value.birthdate.1', message: '4 March 1971', description: 'Redaction document value: a date of birth, which must be redacted'}),
      translate({id: 'preset.redaction.value.birthdate.2', message: '22 September 1988', description: 'Redaction document value: a date of birth, which must be redacted'}),
      translate({id: 'preset.redaction.value.birthdate.3', message: '11 January 1954', description: 'Redaction document value: a date of birth, which must be redacted'}),
      translate({id: 'preset.redaction.value.birthdate.4', message: '30 June 1996', description: 'Redaction document value: a date of birth, which must be redacted'}),
    ],
    phone: [
      translate({id: 'preset.redaction.value.phone.1', message: '06 1234 5678', description: 'Redaction document value: a phone number, which must be redacted'}),
      translate({id: 'preset.redaction.value.phone.2', message: '06 4471 9920', description: 'Redaction document value: a phone number, which must be redacted'}),
      translate({id: 'preset.redaction.value.phone.3', message: '010 240 88 15', description: 'Redaction document value: a phone number, which must be redacted'}),
      translate({id: 'preset.redaction.value.phone.4', message: '06 3308 2277', description: 'Redaction document value: a phone number, which must be redacted'}),
    ],
    plate: [
      translate({id: 'preset.redaction.value.plate.1', message: '84-XT-JV', description: 'Redaction document value: a licence plate, which must be redacted'}),
      translate({id: 'preset.redaction.value.plate.2', message: 'GN-712-Z', description: 'Redaction document value: a licence plate, which must be redacted'}),
      translate({id: 'preset.redaction.value.plate.3', message: '19-BKH-3', description: 'Redaction document value: a licence plate, which must be redacted'}),
    ],
    medical: [
      translate({id: 'preset.redaction.value.medical.1', message: 'unfit for duty until October', description: 'Redaction document value: a health detail, which must be redacted'}),
      translate({id: 'preset.redaction.value.medical.2', message: 'on sick leave since March', description: 'Redaction document value: a health detail, which must be redacted'}),
      translate({id: 'preset.redaction.value.medical.3', message: 'in treatment since the summer', description: 'Redaction document value: a health detail, which must be redacted'}),
    ],
    benefit: [
      translate({id: 'preset.redaction.value.benefit.1', message: '1,187 euro a month', description: 'Redaction document value: a benefit paid to a person, which must be redacted'}),
      translate({id: 'preset.redaction.value.benefit.2', message: 'a hardship payment of 640 euro', description: 'Redaction document value: a benefit paid to a person, which must be redacted'}),
      translate({id: 'preset.redaction.value.benefit.3', message: 'debt counselling since 2024', description: 'Redaction document value: a benefit paid to a person, which must be redacted'}),
    ],

    /* May be published */
    company: [
      translate({id: 'preset.redaction.value.company.1', message: 'Bakkerij Janssen BV', description: 'Redaction document value: a company name, which may be published'}),
      translate({id: 'preset.redaction.value.company.2', message: 'Van Dijk Infra BV', description: 'Redaction document value: a company name, which may be published'}),
      translate({id: 'preset.redaction.value.company.3', message: 'Stichting Wijkwerk', description: 'Redaction document value: a company name, which may be published'}),
      translate({id: 'preset.redaction.value.company.4', message: 'Groenbeheer Noord BV', description: 'Redaction document value: a company name, which may be published'}),
      translate({id: 'preset.redaction.value.company.5', message: 'Aannemersbedrijf Kuiper', description: 'Redaction document value: a company name, which may be published'}),
    ],
    amount: [
      translate({id: 'preset.redaction.value.amount.1', message: '1,240 euro', description: 'Redaction document value: an invoiced amount, which may be published'}),
      translate({id: 'preset.redaction.value.amount.2', message: '18,500 euro', description: 'Redaction document value: an invoiced amount, which may be published'}),
      translate({id: 'preset.redaction.value.amount.3', message: '96,300 euro', description: 'Redaction document value: an invoiced amount, which may be published'}),
      translate({id: 'preset.redaction.value.amount.4', message: '740 euro', description: 'Redaction document value: an invoiced amount, which may be published'}),
    ],
    caseNumber: [
      translate({id: 'preset.redaction.value.caseNumber.1', message: 'case 2026-118', description: 'Redaction document value: a case number, which may be published'}),
      translate({id: 'preset.redaction.value.caseNumber.2', message: 'case 2026-0447', description: 'Redaction document value: a case number, which may be published'}),
      translate({id: 'preset.redaction.value.caseNumber.3', message: 'case 2025-2291', description: 'Redaction document value: a case number, which may be published'}),
      translate({id: 'preset.redaction.value.caseNumber.4', message: 'case 2026-0903', description: 'Redaction document value: a case number, which may be published'}),
    ],
    department: [
      translate({id: 'preset.redaction.value.department.1', message: 'the building department', description: 'Redaction document value: a department, which may be published'}),
      translate({id: 'preset.redaction.value.department.2', message: 'the social affairs department', description: 'Redaction document value: a department, which may be published'}),
      translate({id: 'preset.redaction.value.department.3', message: 'the parking enforcement team', description: 'Redaction document value: a department, which may be published'}),
      translate({id: 'preset.redaction.value.department.4', message: 'the public works department', description: 'Redaction document value: a department, which may be published'}),
      translate({id: 'preset.redaction.value.department.5', message: 'the open government desk', description: 'Redaction document value: a department, which may be published'}),
    ],
    policy: [
      translate({id: 'preset.redaction.value.policy.1', message: 'the open government act', description: 'Redaction document value: a law, which may be published'}),
      translate({id: 'preset.redaction.value.policy.2', message: 'the municipal parking bylaw', description: 'Redaction document value: a law, which may be published'}),
      translate({id: 'preset.redaction.value.policy.3', message: 'the youth act', description: 'Redaction document value: a law, which may be published'}),
      translate({id: 'preset.redaction.value.policy.4', message: 'the environment and planning act', description: 'Redaction document value: a law, which may be published'}),
    ],
    decisionDate: [
      translate({id: 'preset.redaction.value.decisionDate.1', message: '14 March 2026', description: 'Redaction document value: the date of a decision, which may be published'}),
      translate({id: 'preset.redaction.value.decisionDate.2', message: '2 April 2026', description: 'Redaction document value: the date of a decision, which may be published'}),
      translate({id: 'preset.redaction.value.decisionDate.3', message: '28 November 2025', description: 'Redaction document value: the date of a decision, which may be published'}),
      translate({id: 'preset.redaction.value.decisionDate.4', message: '9 July 2026', description: 'Redaction document value: the date of a decision, which may be published'}),
    ],
    location: [
      translate({id: 'preset.redaction.value.location.1', message: 'the town hall', description: 'Redaction document value: a public location, which may be published'}),
      translate({id: 'preset.redaction.value.location.2', message: 'the depot on the Havenweg', description: 'Redaction document value: a public location, which may be published'}),
      translate({id: 'preset.redaction.value.location.3', message: 'the district office', description: 'Redaction document value: a public location, which may be published'}),
      translate({id: 'preset.redaction.value.location.4', message: 'the Sint-Jansstraat car park', description: 'Redaction document value: a public location, which may be published'}),
    ],
    role: [
      translate({id: 'preset.redaction.value.role.1', message: 'the case officer', description: 'Redaction document value: a job title without a name, which may be published'}),
      translate({id: 'preset.redaction.value.role.2', message: 'the municipal secretary', description: 'Redaction document value: a job title without a name, which may be published'}),
      translate({id: 'preset.redaction.value.role.3', message: 'a parking enforcement officer', description: 'Redaction document value: a job title without a name, which may be published'}),
      translate({id: 'preset.redaction.value.role.4', message: 'the head of the open government desk', description: 'Redaction document value: a job title without a name, which may be published'}),
    ],
  };
}

/** The sentence around the fields: one fixed phrase per token. */
function phrases() {
  return {
    permitIntro: translate({id: 'preset.redaction.token.permitIntro', message: 'Permit granted to', description: 'Redaction document text'}),
    permitMiddle: translate({id: 'preset.redaction.token.permitMiddle', message: 'for a dormer at', description: 'Redaction document text'}),
    permitTail: translate({id: 'preset.redaction.token.permitTail', message: 'applicant reference', description: 'Redaction document text'}),
    permitEnd: translate({id: 'preset.redaction.token.permitEnd', message: 'Objections within six weeks.', description: 'Redaction document text'}),

    invoiceIntro: translate({id: 'preset.redaction.token.invoiceIntro', message: 'Invoice for', description: 'Redaction document text'}),
    invoiceMiddle: translate({id: 'preset.redaction.token.invoiceMiddle', message: 'payable to', description: 'Redaction document text'}),
    invoiceTail: translate({id: 'preset.redaction.token.invoiceTail', message: 'total', description: 'Redaction document text'}),
    invoiceEnd: translate({id: 'preset.redaction.token.invoiceEnd', message: 'Questions to', description: 'Redaction document text'}),

    objectionIntro: translate({id: 'preset.redaction.token.objectionIntro', message: 'Objection filed by', description: 'Redaction document text'}),
    objectionMiddle: translate({id: 'preset.redaction.token.objectionMiddle', message: 'born', description: 'Redaction document text'}),
    objectionTail: translate({id: 'preset.redaction.token.objectionTail', message: 'against decision', description: 'Redaction document text'}),
    objectionEnd: translate({id: 'preset.redaction.token.objectionEnd', message: 'Hearing on the fourteenth.', description: 'Redaction document text'}),

    reportIntro: translate({id: 'preset.redaction.token.reportIntro', message: 'Inspection report from', description: 'Redaction document text'}),
    reportMiddle: translate({id: 'preset.redaction.token.reportMiddle', message: 'contact on', description: 'Redaction document text'}),
    reportTail: translate({id: 'preset.redaction.token.reportTail', message: 'inspector', description: 'Redaction document text'}),
    reportEnd: translate({id: 'preset.redaction.token.reportEnd', message: 'Published under', description: 'Redaction document text'}),

    subsidyIntro: translate({id: 'preset.redaction.token.subsidyIntro', message: 'Subsidy of', description: 'Redaction document text'}),
    subsidyMiddle: translate({id: 'preset.redaction.token.subsidyMiddle', message: 'awarded to', description: 'Redaction document text'}),
    subsidyTail: translate({id: 'preset.redaction.token.subsidyTail', message: 'paid out to', description: 'Redaction document text'}),
    subsidyEnd: translate({id: 'preset.redaction.token.subsidyEnd', message: 'Decision dated', description: 'Redaction document text'}),

    wooIntro: translate({id: 'preset.redaction.token.wooIntro', message: 'Request received from', description: 'Redaction document text'}),
    wooMiddle: translate({id: 'preset.redaction.token.wooMiddle', message: 'for documents under', description: 'Redaction document text'}),
    wooTail: translate({id: 'preset.redaction.token.wooTail', message: 'confirmation sent to', description: 'Redaction document text'}),
    wooEnd: translate({id: 'preset.redaction.token.wooEnd', message: 'Handled by', description: 'Redaction document text'}),

    incidentIntro: translate({id: 'preset.redaction.token.incidentIntro', message: 'Incident logged at', description: 'Redaction document text'}),
    incidentMiddle: translate({id: 'preset.redaction.token.incidentMiddle', message: 'involving vehicle', description: 'Redaction document text'}),
    incidentTail: translate({id: 'preset.redaction.token.incidentTail', message: 'reported by', description: 'Redaction document text'}),
    incidentEnd: translate({id: 'preset.redaction.token.incidentEnd', message: 'Attended by', description: 'Redaction document text'}),

    benefitIntro: translate({id: 'preset.redaction.token.benefitIntro', message: 'Assistance granted to', description: 'Redaction document text'}),
    benefitMiddle: translate({id: 'preset.redaction.token.benefitMiddle', message: 'amounting to', description: 'Redaction document text'}),
    benefitTail: translate({id: 'preset.redaction.token.benefitTail', message: 'assessed by', description: 'Redaction document text'}),
    benefitEnd: translate({id: 'preset.redaction.token.benefitEnd', message: 'Decision under', description: 'Redaction document text'}),

    healthIntro: translate({id: 'preset.redaction.token.healthIntro', message: 'Occupational health note on', description: 'Redaction document text'}),
    healthMiddle: translate({id: 'preset.redaction.token.healthMiddle', message: 'reported as', description: 'Redaction document text'}),
    healthTail: translate({id: 'preset.redaction.token.healthTail', message: 'filed with', description: 'Redaction document text'}),
    healthEnd: translate({id: 'preset.redaction.token.healthEnd', message: 'under', description: 'Redaction document text'}),

    clauseQuestions: translate({id: 'preset.redaction.token.clauseQuestions', message: 'Questions to', description: 'Redaction document text'}),
    clauseReference: translate({id: 'preset.redaction.token.clauseReference', message: 'Applicant reference', description: 'Redaction document text'}),
    clausePayment: translate({id: 'preset.redaction.token.clausePayment', message: 'Payment to', description: 'Redaction document text'}),
    clausePaymentTail: translate({id: 'preset.redaction.token.clausePaymentTail', message: 'for', description: 'Redaction document text'}),
    clauseHandled: translate({id: 'preset.redaction.token.clauseHandled', message: 'Handled by', description: 'Redaction document text'}),
    clauseHandledTail: translate({id: 'preset.redaction.token.clauseHandledTail', message: 'at', description: 'Redaction document text'}),
    clausePost: translate({id: 'preset.redaction.token.clausePost', message: 'Post goes to', description: 'Redaction document text'}),
    clauseReachable: translate({id: 'preset.redaction.token.clauseReachable', message: 'Reachable on', description: 'Redaction document text'}),
    clauseBorn: translate({id: 'preset.redaction.token.clauseBorn', message: 'Date of birth', description: 'Redaction document text'}),
    clauseVehicle: translate({id: 'preset.redaction.token.clauseVehicle', message: 'Registered vehicle', description: 'Redaction document text'}),
    clauseFiled: translate({id: 'preset.redaction.token.clauseFiled', message: 'Filed under', description: 'Redaction document text'}),
    clauseFiledTail: translate({id: 'preset.redaction.token.clauseFiledTail', message: 'as', description: 'Redaction document text'}),
    clausePublished: translate({id: 'preset.redaction.token.clausePublished', message: 'Published', description: 'Redaction document text'}),
    clausePublishedTail: translate({id: 'preset.redaction.token.clausePublishedTail', message: 'at', description: 'Redaction document text'}),
    clauseCosigned: translate({id: 'preset.redaction.token.clauseCosigned', message: 'Co-signed by', description: 'Redaction document text'}),
    clauseHealth: translate({id: 'preset.redaction.token.clauseHealth', message: 'Health note:', description: 'Redaction document text'}),
  };
}

/** The text of one dealt token: a fixed phrase, or its dealt value. */
function tokenText(t, pick = 0) {
  if (!cache) cache = {values: pools(), fixed: phrases()};
  const pool = cache.values[t];
  if (pool) return pool[Math.min(pool.length - 1, Math.floor(pick * pool.length))];
  return cache.fixed[t] || '';
}

/**
 * What a screen reader hears for one word.
 *
 * Both verdicts on a word say themselves, because the colour they are
 * drawn in during the hold is the only other place that information
 * lives: red for what went out readable, orange for what went out
 * covered and did not have to.
 */
function wordLabel(token) {
  const text = tokenText(token.t, token.pick);
  if (token.missed) {
    return translate(
      {id: 'preset.redaction.word.missed', message: '{text}, published in full: this is the breach', description: 'Accessible label for a field that was left readable and went out with the document'},
      {text},
    );
  }
  if (token.overRedacted) {
    return translate(
      {id: 'preset.redaction.word.overRedacted', message: '{text}, blacked out, and it could have stayed', description: 'Accessible label for an ordinary word that was redacted although it could have been published'},
      {text},
    );
  }
  if (token.blacked) {
    return translate(
      {id: 'preset.redaction.word.blacked', message: '{text}, blacked out', description: 'Accessible label for a redacted word'},
      {text},
    );
  }
  return text;
}

export default function Redaction({className}) {
  const {i18n} = useDocusaurusContext();
  const locale = (i18n && i18n.currentLocale) || 'en';

  const [game, setGame] = useState(null);
  const [left, setLeft] = useState(1);
  const gameRef = useRef(null);
  const startedAtRef = useRef(0);
  const endedRef = useRef(false);

  const running = Boolean(game) && !game.over;
  const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) - startedAtRef.current;

  const begin = useCallback(() => {
    endedRef.current = false;
    startedAtRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const fresh = createGame({seed: Math.floor(Math.random() * 2 ** 31), now: 0});
    gameRef.current = fresh;
    setGame(fresh);
    setLeft(1);
  }, []);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => {
      const t = now();
      const next = step(gameRef.current, t);
      gameRef.current = next;
      setGame(next);
      setLeft(remaining(next, t));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  useEffect(() => {
    if (!game || !game.over || endedRef.current) return;
    endedRef.current = true;
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('connext:gameend', {
      detail: {
        id: GAME_ID,
        won: false,
        score: game.score,
        summary: summarise(game, locale),
        title: translate({id: 'preset.redaction.over.title', message: 'Three of those went out with a name still on them.', description: 'Headline on the game-over dialog after a redaction run'}),
        subtitle: translate({id: 'preset.redaction.over.subtitle', message: 'Which is the part that makes the news, not the paperwork.', description: 'Subtitle on the game-over dialog after a redaction run'}),
      },
    }));
  }, [game, locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onReplay = (e) => { if (e.detail && e.detail.id === GAME_ID) begin(); };
    window.addEventListener('connext:gamereplay', onReplay);
    return () => window.removeEventListener('connext:gamereplay', onReplay);
  }, [begin]);

  const toggle = useCallback((index) => {
    if (!gameRef.current || gameRef.current.over) return;
    const next = black(gameRef.current, index);
    gameRef.current = next;
    setGame(next);
  }, []);

  const send = useCallback(() => {
    if (!gameRef.current || gameRef.current.over) return;
    const t = now();
    const next = publish(gameRef.current, t);
    gameRef.current = next;
    setGame(next);
    setLeft(remaining(next, t));
  }, []);

  const doc = game ? game.doc : null;
  const last = game ? game.last : null;
  const pct = Math.round(left * 100);
  /* Every published page is held on screen for a beat with everything
     on it frozen — the point of the beat is to look at it, not to work
     on it. A breach is held long enough to read, in red; a clean one
     just long enough to see the bars go green. */
  const hold = game ? game.hold : null;
  const held = Boolean(hold);

  return (
    <section className={[styles.rd, className].filter(Boolean).join(' ')} aria-labelledby="redaction-title">
      <header className={styles.head}>
        <div>
          <p className={styles.eyebrow}>
            {translate({id: 'preset.redaction.eyebrow', message: 'Mini-game', description: 'Eyebrow above the redaction game on a product page'})}
          </p>
          <h3 className={styles.title} id="redaction-title">
            {translate({id: 'preset.redaction.title', message: 'Black it out', description: 'Name of the Filinq mini-game'})}
          </h3>
          <p className={styles.lede}>
            {translate({id: 'preset.redaction.lede', message: 'This document is going out. Black out what may not be published, then send it. Leave one thing in and it is a breach; black out the whole page and you have published stripes. The better you do, the more they staple to the page.', description: 'One-line explanation of the redaction rules'})}
          </p>
        </div>
        <div className={styles.hud} role="status" aria-live="polite">
          <span className={styles.hudPill}>
            {translate({id: 'preset.redaction.hud.score', message: 'Score {score}', description: 'Score readout on the redaction HUD'}, {score: Number(game ? game.score : 0).toLocaleString(locale)})}
          </span>
          <span className={styles.hudPill}>
            {translate({id: 'preset.redaction.hud.lives', message: 'Breaches left {lives}', description: 'Remaining-lives readout on the redaction HUD'}, {lives: game ? game.lives : 3})}
          </span>
        </div>
      </header>

      <div
        className={[
          styles.paper,
          hold && hold.result === 'breach' && styles.paperBreach,
          hold && hold.result === 'overRedacted' && styles.paperOver,
          hold && hold.result === 'clean' && styles.paperClean,
        ].filter(Boolean).join(' ')}>
        {doc ? (
          <>
            <p className={styles.doc}>
              {doc.tokens.map((token, i) => (
                <button
                  key={i}
                  type="button"
                  className={[
                    styles.word,
                    token.blacked && styles.wordBlacked,
                    token.missed && styles.wordMissed,
                    token.overRedacted && styles.wordOverRedacted,
                  ].filter(Boolean).join(' ')}
                  /* Which field this is, for the end-to-end tests: the
                     dealt values are pooled and translated, so a test
                     cannot recognise a citizen number by its text. */
                  data-token={token.t}
                  onClick={() => toggle(i)}
                  disabled={!running || held || token.blacked}
                  aria-pressed={token.blacked}
                  aria-label={wordLabel(token)}>
                  <span aria-hidden="true">{tokenText(token.t, token.pick)}</span>
                </button>
              ))}
            </p>
            <div
              className={styles.clock}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label={translate({id: 'preset.redaction.clock', message: 'Time before this document publishes itself', description: 'Accessible name of the redaction countdown'})}>
              <div className={[styles.clockFill, left < 0.3 && styles.clockLow].filter(Boolean).join(' ')} style={{width: `${pct}%`}} />
            </div>
          </>
        ) : (
          <p className={styles.idle}>
            {translate({id: 'preset.redaction.idle', message: 'A stack of documents, all of them due out today.', description: 'Placeholder before the redaction game starts'})}
          </p>
        )}
      </div>

      <footer className={styles.foot}>
        <button type="button" className={styles.publish} onClick={send} disabled={!running || held || !doc}>
          {translate({id: 'preset.redaction.publish', message: 'Publish it', description: 'Button that publishes the redacted document'})}
        </button>
        <button type="button" className={styles.start} onClick={begin}>
          {game
            ? translate({id: 'preset.redaction.restart', message: 'Restart', description: 'Button that restarts the redaction game'})
            : translate({id: 'preset.redaction.start', message: 'Open the stack', description: 'Button that starts the redaction game'})}
        </button>
        <p
          className={[
            styles.hint,
            last && last.result === 'breach' && styles.hintBreach,
            last && last.result === 'overRedacted' && styles.hintOver,
            last && last.result === 'clean' && styles.hintClean,
          ].filter(Boolean).join(' ')}
          role="status"
          aria-live="polite">
          {/* Two lines for one mistake: while the page is still up the
              message points at the marks on it, and once it has moved
              on there are no marks left to point at. */}
          {last && last.result === 'breach' && held && translate(
            {id: 'preset.redaction.feedback.breachHeld', message: 'Breach. {missed} field(s) went out still readable — the ones in red.', description: 'Feedback while a breached document is held on screen. {missed} is how many fields were left readable.'},
            {missed: last.missed},
          )}
          {last && last.result === 'breach' && !held && translate(
            {id: 'preset.redaction.feedback.breach', message: 'Breach. {missed} field(s) went out still readable.', description: 'Feedback after a breached document has moved on. {missed} is how many fields were left readable.'},
            {missed: last.missed},
          )}
          {last && last.result === 'clean' && translate({id: 'preset.redaction.feedback.clean', message: 'Clean. Everything that had to go is gone, and the rest is still readable.', description: 'Feedback after publishing a perfectly redacted document'})}
          {last && last.result === 'overRedacted' && held && translate(
            {id: 'preset.redaction.feedback.overHeld', message: 'Safe, but you blacked out {over} word(s) that could have stayed — the ones in orange.', description: 'Feedback while an over-redacted document is held on screen. {over} is how many ordinary words were blacked out.'},
            {over: last.over},
          )}
          {last && last.result === 'overRedacted' && !held && translate(
            {id: 'preset.redaction.feedback.over', message: 'Safe, but you blacked out {over} word(s) that could have stayed.', description: 'Feedback after publishing an over-redacted document. {over} is how many ordinary words were blacked out.'},
            {over: last.over},
          )}
          {!last && translate({id: 'preset.redaction.hint', message: 'Click a word to black it out. Names, numbers and addresses go; the sentence around them stays.', description: 'Hint under the redaction document'})}
        </p>
      </footer>
    </section>
  );
}
