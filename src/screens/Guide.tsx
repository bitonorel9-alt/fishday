import { GUIDE, type GuideArticle } from "../content/guide";
import { FISH_PHOTOS } from "../content/fishPhotos";
import { Page } from "../ui/parts";

const SARGUS = `${import.meta.env.BASE_URL}${FISH_PHOTOS.sargus?.file ?? ""}`;

export function GuideHome() {
  return (
    <Page title="מדריך">
      <p class="muted">כל מה שצריך כדי לדוג טוב ובטוח.</p>
      <a class="card guide-fish" href="#/fish">
        <img src={SARGUS} alt="סרגוס" width="640" height="387" loading="lazy" decoding="async" />
        <span>
          <strong>מדריך דגים</strong>
          <span class="muted small">תמונות, זיהוי, ו"מה תפסתי?"</span>
        </span>
      </a>
      <ul class="guide-list">
        {GUIDE.map((a) => (
          <li key={a.id}>
            <a class="card" href={`#/guide/${a.id}`}>
              <strong>{a.title}</strong>
              <span class="muted small">{a.summary}</span>
            </a>
          </li>
        ))}
      </ul>
    </Page>
  );
}

export function GuideArticleView({ article }: { article: GuideArticle }) {
  return (
    <>
      <header class="detail-head">
        <a class="back" href="#/guide" aria-label="חזרה למדריך">→</a>
        <div>
          <h1 class="page-title">{article.title}</h1>
          <p class="muted small">{article.summary}</p>
        </div>
      </header>
      {article.sections.map((s, i) => (
        <section class="card rule" key={s.heading ?? i}>
          {s.heading && <h2>{s.heading}</h2>}
          {s.text?.map((t) => <p key={t}>{t}</p>)}
          {s.list && <ul class="plain">{s.list.map((t) => <li key={t}>{t}</li>)}</ul>}
        </section>
      ))}
      <ul class="sources">
        {article.sources.map((s) => <li key={s.url}><a href={s.url} target="_blank" rel="noopener">{s.label}</a></li>)}
      </ul>
    </>
  );
}
