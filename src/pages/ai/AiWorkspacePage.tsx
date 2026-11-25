import { Bot, Languages, ShieldAlert, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { ErrorBanner, SuccessBanner } from '../../components/common/StateViews';
import { useAuth } from '../../context/AuthContext';
import { aiService } from '../../services/aiService';
import type { AiTranslationRecord, CandidateMatchResult, PropertyMatchResult } from '../../types/ai';

export function AiWorkspacePage() {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Listing Assistant
  const [rawNotes, setRawNotes] = useState('');
  const [draftModule, setDraftModule] = useState<'staff' | 'property' | 'school'>('property');
  const [generated, setGenerated] = useState<{
    suggestedTitle: string;
    suggestedSummary: string;
    suggestedDescription: string;
    disclaimer: string;
  } | null>(null);

  // Translation
  const [translateInput, setTranslateInput] = useState('');
  const [translationRes, setTranslationRes] = useState<AiTranslationRecord | null>(null);

  // Matching
  const [candidateMatches, setCandidateMatches] = useState<CandidateMatchResult[]>([]);
  const [propertyMatches, setPropertyMatches] = useState<PropertyMatchResult[]>([]);

  // Assistant
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-gradient-to-r from-brand-950 to-brand-800 px-6 py-5 text-white">
        <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-500">
          Phase 7 · Independent Server-Side AI Module
        </span>
        <h1 className="text-2xl font-extrabold">AI Listing Assistant, Translation &amp; Matching</h1>
        <p className="mt-1 text-xs text-brand-100">
          Original submitted text is always preserved separately. AI never verifies legal titles or guarantees candidate qualifications.
        </p>
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {notice ? <SuccessBanner message={notice} /> : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Listing Assistant */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">AI Listing Assistant</h2>
          </div>
          <select
            value={draftModule}
            onChange={(e) => setDraftModule(e.target.value as 'staff' | 'property' | 'school')}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="property">Property Connect Listing</option>
            <option value="staff">Staff Connect Job Vacancy</option>
            <option value="school">School Connect Profile</option>
          </select>
          <textarea
            rows={3}
            value={rawNotes}
            onChange={(e) => setRawNotes(e.target.value)}
            placeholder="Enter rough notes (e.g. 2 BHK flat near Metro, Kochi, family preferred, 22k rent)..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                const res = await aiService.generateProfessionalListing(user, { module: draftModule, rawNotes });
                setGenerated(res);
                setNotice('Draft generated. Please review before publishing.');
              } catch (err) {
                setError(err instanceof Error ? err.message : 'AI generation failed.');
              }
            }}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Polish Listing Draft
          </button>
          {generated ? (
            <div className="space-y-2 rounded-xl bg-slate-50 p-4 text-xs">
              <p className="font-bold text-slate-900">{generated.suggestedTitle}</p>
              <p className="text-slate-700">{generated.suggestedDescription}</p>
              <p className="flex items-start gap-1 text-amber-800">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{generated.disclaimer}</span>
              </p>
            </div>
          ) : null}
        </section>

        {/* Language Detection & EN/HI/ML Translation */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <Languages className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">Language Detection &amp; Translation (EN / HI / ML)</h2>
          </div>
          <textarea
            rows={3}
            value={translateInput}
            onChange={(e) => setTranslateInput(e.target.value)}
            placeholder="Enter English, हिन्दी, or മലയാളം text..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                const tr = await aiService.detectAndTranslateText(user, {
                  entityType: 'listing_preview',
                  entityId: `preview-${Date.now()}`,
                  text: translateInput,
                });
                setTranslationRes(tr);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Translation failed.');
              }
            }}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Detect &amp; Translate
          </button>
          {translationRes ? (
            <div className="space-y-1.5 rounded-xl bg-slate-50 p-4 text-xs">
              <p><strong>Detected:</strong> {translationRes.original_language.toUpperCase()}</p>
              <p><strong>Original Preserved:</strong> {translationRes.original_text}</p>
              <p><strong>EN:</strong> {translationRes.translations.en}</p>
              <p><strong>HI:</strong> {translationRes.translations.hi}</p>
              <p><strong>ML:</strong> {translationRes.translations.ml}</p>
            </div>
          ) : null}
        </section>

        {/* Candidate & Property Matching */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">AI Candidate &amp; Property Matching</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={async () => {
                setError(null);
                try {
                  setCandidateMatches(await aiService.matchCandidatesToJob(user, 'job-1'));
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Candidate matching failed.');
                }
              }}
              className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-semibold text-brand-700"
            >
              Match Candidates to Sample Job
            </button>
            <button
              type="button"
              onClick={async () => {
                setError(null);
                try {
                  setPropertyMatches(
                    await aiService.matchPropertiesToRequirements(user, {
                      purpose: 'RENT',
                      maxBudget: 35000,
                      preferredCity: 'Kochi',
                    })
                  );
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Property matching failed.');
                }
              }}
              className="rounded-lg border border-brand-600 px-3 py-2 text-xs font-semibold text-brand-700"
            >
              Match Rental Properties in Kochi
            </button>
          </div>
          {candidateMatches.map((m) => (
            <div key={m.candidate_id} className="rounded-xl border border-slate-200 p-3 text-xs">
              <div className="flex justify-between font-bold">
                <span>{m.full_name}</span>
                <span className="text-brand-700">{m.score}% match</span>
              </div>
              <p className="text-slate-600">{m.reasons.join(' · ')}</p>
              <p className="mt-0.5 text-[10px] text-amber-800">{m.disclaimer}</p>
            </div>
          ))}
          {propertyMatches.map((p) => (
            <div key={p.property_id} className="rounded-xl border border-slate-200 p-3 text-xs">
              <div className="flex justify-between font-bold">
                <span>{p.title}</span>
                <span className="text-emerald-700">{p.score}% match</span>
              </div>
              <p className="text-slate-600">{p.reasons.join(' · ')}</p>
              <p className="mt-0.5 text-[10px] text-amber-800">{p.disclaimer}</p>
            </div>
          ))}
        </section>

        {/* AI Customer Assistant */}
        <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 text-brand-700">
            <Bot className="h-5 w-5" />
            <h2 className="text-lg font-bold text-slate-900">AI Platform Customer Assistant</h2>
          </div>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask about plans, property title policy, or DPDPA deletion..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={async () => {
              setError(null);
              try {
                setAnswer(await aiService.askPlatformAssistant(user, question));
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Assistant error.');
              }
            }}
            className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white"
          >
            Ask Assistant
          </button>
          {answer ? (
            <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-800">{answer}</div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
