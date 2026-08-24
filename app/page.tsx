"use client";

import { useEffect, useMemo, useState } from "react";
import {
  destinations as fullDestinations,
  simplifyDestinationForRoundOne,
  simplifyDestinationForRoundTwo,
} from "../lib/destinations";

type VoteId = "love" | "okay" | "neutral" | "skip";
type Votes = Record<string, VoteId>;
const STORAGE_KEY = "japan-2026-destination-votes";
const SITE_TITLE = "2026 日本国庆｜目的地候选";
const VOTE_OPTIONS = [
  { id: "love", label: "很想去", emoji: "😍", score: 3 },
  { id: "okay", label: "可以", emoji: "🙂", score: 2 },
  { id: "neutral", label: "无所谓", emoji: "😐", score: 1 },
  { id: "skip", label: "不想去", emoji: "🙅", score: 0 },
] as const;

const roundOneDestinations = fullDestinations.map(simplifyDestinationForRoundOne);
const roundTwoDestinations = fullDestinations.map(simplifyDestinationForRoundTwo);

function formatDistanceKm(distance: { min: number; max: number; approximate: boolean }) {
  const range = distance.min === distance.max ? `${distance.min}` : `${distance.min}–${distance.max}`;
  return `${distance.approximate ? "约 " : ""}${range} km`;
}

function Rating({ value, label }: { value: number; label: string }) {
  return <div className="rating" aria-label={`${label} ${value} / 5`}><span>{label}</span><span className="rating-dots" aria-hidden="true">{[1,2,3,4,5].map(n => <i key={n} className={n <= value ? "filled" : ""} />)}</span></div>;
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [votes, setVotes] = useState<Votes>({});
  const [copyState, setCopyState] = useState("复制我的选择");
  const destinations = roundOneDestinations;
  const destination = destinations[activeIndex];
  const detail = roundTwoDestinations[activeIndex];
  const segmentDestinationEvaluation = detail.segmentAnalysis?.destinationEvaluations.find(
    item => item.destinationId === destination.id,
  );
  const segmentDecision = detail.segmentDecision?.decisions.find(
    item => item.destinationId === destination.id,
  );
  const comparisons = detail.segmentAnalysis?.comparisons.filter(
    comparison => comparison.destinationIds.includes(destination.id),
  ) ?? [];
  const galleryItem = destination.gallery.requirements[imageIndex];
  const selectedVote = votes[destination.id];

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      try {
        setVotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"));
      } catch {
        setVotes({});
      }
    });
    return () => window.cancelAnimationFrame(frameId);
  }, []);
  const voteOptions = useMemo(() => VOTE_OPTIONS, []);
  function vote(value: VoteId) { const next = {...votes, [destination.id]: value}; setVotes(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  function resetVotes() { setVotes({}); localStorage.removeItem(STORAGE_KEY); setCopyState("复制我的选择"); }
  async function copyVotes() {
    const lines = voteOptions.map(option => {
      const names = destinations.filter(item => votes[item.id] === option.id).map(item => item.name.zh);
      return `${option.emoji} ${option.label}：${names.length ? names.join("、") : "—"}`;
    });
    await navigator.clipboard.writeText([SITE_TITLE, ...lines].join("\n"));
    setCopyState("✓ 已复制");
    window.setTimeout(() => setCopyState("复制我的选择"), 1600);
  }

  return <main>
    <header className="site-header"><div><p className="eyebrow">旅の候補 · TRIP SHORTLIST</p><h1>{detail.segmentAnalysis?.segmentLabel ?? "目的地候选"}</h1></div><div className="count"><b>{activeIndex + 1}</b><span>/ {destinations.length}</span></div></header>
    <section className="card-shell" aria-live="polite"><article className="destination-card">
      <div className="gallery">
        <div className={`placeholder placeholder-${imageIndex + 1}`}><div className="mountain-mark" aria-hidden="true"><span/><span/></div></div>
        {galleryItem.assetUrl && (
          // Images are pre-optimized WebP assets; keeping a plain img avoids runtime transformation.
          // eslint-disable-next-line @next/next/no-img-element
          <img key={galleryItem.assetUrl} className="gallery-photo" src={galleryItem.assetUrl} alt={galleryItem.subject} loading={imageIndex === 0 ? "eager" : "lazy"} decoding="async" fetchPriority={imageIndex === 0 ? "high" : "auto"} onError={event => { event.currentTarget.hidden = true; }} />
        )}
        <div className="gallery-shade" aria-hidden="true" />
        <div className="image-label"><small>{galleryItem.role.toUpperCase()} · {galleryItem.assetUrl ? "真实图片" : "季节实景待补"}</small><strong>{galleryItem.subject}</strong><span>{galleryItem.seasonConstraint}</span></div>
        <button className="gallery-arrow left" onClick={() => setImageIndex((imageIndex - 1 + destination.gallery.requirements.length) % destination.gallery.requirements.length)} aria-label="上一张图片">‹</button>
        <button className="gallery-arrow right" onClick={() => setImageIndex((imageIndex + 1) % destination.gallery.requirements.length)} aria-label="下一张图片">›</button>
        <div className="gallery-topline"><span>PHOTO {String(imageIndex + 1).padStart(2,"0")}</span><span>{destination.region}</span></div>
        <div className="gallery-dots">{destination.gallery.requirements.map((item,index) => <button key={item.slot} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`查看第 ${index + 1} 张图片`} />)}</div>
      </div>
      <div className="card-content">
        <div className="title-row"><div><p className="japanese-name">{destination.name.ja} · {destination.name.en}</p><h2>{destination.name.zh}</h2></div><span className="season-score"><b>{destination.season.rating}</b>/5<br/><small>季节匹配</small></span></div>
        <p className="one-line">{destination.oneLine}</p>
        <div className="tags">{destination.tags.map(tag => <span key={tag.label}>{tag.emoji} {tag.label}</span>)}</div>
        <p className="hook">{destination.hook}</p>
        <section className="experience-block"><p className="section-kicker">TOP 3 EXPERIENCES</p><ol>{destination.topExperiences.map((experience,index) => <li key={experience}><span>0{index+1}</span><p>{experience}</p></li>)}</ol></section>
        <aside className="season-note"><div className="season-icon">秋</div><div><h3>国庆去是什么样</h3><p>{destination.season.summary}</p></div></aside>
        <div className="glance-grid"><div><small>最低停留</small><strong>{destination.minimumDuration}</strong></div><div><small>推荐安排</small><strong>{destination.idealDuration}</strong></div></div>
        <div className="ratings"><Rating label="体力要求" value={destination.physicalRating}/><Rating label="天气敏感" value={destination.weatherSensitivityRating}/></div>
        <section className="vote-panel"><div className="vote-heading"><div><span>YOUR VOTE</span><h3>只看这个目的地本身，你有多想去？</h3></div>{selectedVote && <b className="saved">✓ 已保存</b>}</div><div className="vote-grid">{voteOptions.map(option => <button key={option.id} className={selectedVote === option.id ? "selected" : ""} onClick={() => vote(option.id)} aria-pressed={selectedVote === option.id}><span>{option.emoji}</span><b>{option.label}</b></button>)}</div></section>

        <details className="details-view">
          <summary><span><small>PLANNER NOTES</small>查看详细资料</span><b>＋</b></summary>
          <div className="details-body">
            {selectedVote && segmentDecision && <aside className="planner-verdict"><span>{segmentDecision.grade}</span><div><small>最终规划判断 · 投票后显示</small><p>{segmentDecision.summary}</p></div></aside>}
            <section className="detail-section"><p className="detail-number">01</p><div><h3>怎么玩</h3><p>{detail.coreSellingPoint}</p><div className="route-line">{detail.typicalRoute.stops.map((stop,index) => <span key={stop}>{stop}{index < detail.typicalRoute.stops.length-1 && <i>→</i>}</span>)}</div><dl><div><dt>路线</dt><dd>{detail.typicalRoute.name}</dd></div><div><dt>距离</dt><dd>{formatDistanceKm(detail.typicalRoute.distanceKm)}</dd></div><div><dt>官方步行</dt><dd>{detail.typicalRoute.officialWalkingTime}</dd></div><div><dt>实际游玩</dt><dd>{detail.typicalRoute.realisticVisitTime}</dd></div></dl><p className="fine-note">延伸：{detail.typicalRoute.extension}</p></div></section>
            <section className="detail-section"><p className="detail-number">02</p><div><h3>国庆季节表现</h3><p className="feature-text">{detail.season.stage}</p><p>{detail.season.temperatureContext}</p><p>{detail.season.clothing}</p><div className="expectation"><b>大概率会看到</b>{detail.season.whatYouLikelySee.map(item => <span key={item}>· {item}</span>)}<em>别被误导：{detail.season.misleadingExpectation}</em></div></div></section>
            <section className="detail-section"><p className="detail-number">03</p><div><h3>体力与天气</h3><div className="detail-ratings"><Rating label="体力要求" value={detail.physicalRating}/><Rating label="天气敏感" value={detail.weatherSensitivityRating}/><Rating label="住一晚景观价值" value={detail.overnight.sceneryValueRating}/><Rating label="住一晚行程效率" value={detail.overnight.itineraryEfficiencyRating}/></div><p>{detail.overnight.value}</p></div></section>
            <section className="detail-section"><p className="detail-number">04</p><div><h3>交通与行李</h3>{detail.access.mainEntrances.map(item => <p className="access-line" key={item}>↗ {item}</p>)}<p>{detail.access.operatingSeason}</p><div className="pending-box"><small>路线嵌入</small><b>{segmentDestinationEvaluation?.routeIntegration.traffic.summary ?? "等待路段统一分析"}</b></div><p>{segmentDestinationEvaluation?.routeIntegration.luggagePlan ?? "等待路段统一分析"}</p><p>{detail.luggage}</p></div></section>
            <section className="detail-section"><p className="detail-number">05</p><div><h3>和其他候选的区别</h3>{comparisons.length ? comparisons.map(comparison => { const otherIndex = comparison.destinationIds[0] === destination.id ? 1 : 0; return <div key={comparison.destinationIds.join(":")}><p className="compare-title">VS. {comparison.destinationNames[otherIndex]} · 重叠度 {comparison.overlapLevel}/5</p><p>{comparison.difference}</p></div> }) : <div className="pending-box"><small>同路段比较</small><b>等待全部候选目的地资料齐备后统一生成</b></div>}<div className="fit-grid"><div><b>适合你，如果</b>{detail.fit.goodFor.map(item => <span key={item}>＋ {item}</span>)}</div><div><b>可能不适合，如果</b>{detail.fit.notFor.map(item => <span key={item}>－ {item}</span>)}</div></div></div></section>
            <section className="detail-section"><p className="detail-number">06</p><div><h3>预约风险</h3><p className="risk-level">风险：{detail.bookingRisk.level}</p><p>{detail.bookingRisk.summary}</p><p>{detail.bookingRisk.note}</p></div></section>
            <section className="detail-section sources"><p className="detail-number">07</p><div><h3>信息源</h3><p className="verified">核验于 {detail.research.lastVerified}</p>{detail.sources.map((source,index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{String(index+1).padStart(2,"0")}</span><div><b>{source.title}</b><small>{source.supports.join(" · ")}</small></div><i>↗</i></a>)}</div></section>
          </div>
        </details>
      </div>
    </article></section>
    {destinations.length > 1 && <nav className="destination-nav" aria-label="目的地切换"><button disabled={activeIndex===0} onClick={() => {setActiveIndex(activeIndex-1);setImageIndex(0)}}>← 上一个</button><button disabled={activeIndex===destinations.length-1} onClick={() => {setActiveIndex(activeIndex+1);setImageIndex(0)}}>下一个 →</button></nav>}
    <section className="summary-panel"><p className="eyebrow">MY SHORTLIST</p><h2>我的选择</h2><div className="summary-groups">{voteOptions.map(option => { const names=destinations.filter(item => votes[item.id]===option.id).map(item => item.name.zh); return <div key={option.id}><span>{option.emoji}</span><b>{option.label}</b><p>{names.length ? names.join("、") : "—"}</p></div>})}</div><div className="summary-actions"><button className="copy-button" onClick={copyVotes} disabled={!Object.keys(votes).length}>{copyState}</button><button className="reset-button" onClick={resetVotes} disabled={!Object.keys(votes).length}>重置选择</button></div><p className="storage-note">选择只保存在这台设备的浏览器中，无需登录。</p></section>
  </main>;
}
