"use client";

import { useEffect, useMemo, useState } from "react";
import tripData from "../destinations.json";

type VoteId = "love" | "okay" | "neutral" | "skip";
type Votes = Record<string, VoteId>;
const STORAGE_KEY = "japan-2026-destination-votes";

function Rating({ value, label }: { value: number; label: string }) {
  return <div className="rating" aria-label={`${label} ${value} / 5`}><span>{label}</span><span className="rating-dots" aria-hidden="true">{[1,2,3,4,5].map(n => <i key={n} className={n <= value ? "filled" : ""} />)}</span></div>;
}

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageIndex, setImageIndex] = useState(0);
  const [votes, setVotes] = useState<Votes>({});
  const [copyState, setCopyState] = useState("复制我的选择");
  const destinations = tripData.destinations;
  const destination = destinations[activeIndex];
  const selectedVote = votes[destination.id];

  useEffect(() => { try { setVotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch { setVotes({}); } }, []);
  const voteOptions = useMemo(() => tripData.meta.voteOptions, []);
  function vote(value: VoteId) { const next = {...votes, [destination.id]: value}; setVotes(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
  function resetVotes() { setVotes({}); localStorage.removeItem(STORAGE_KEY); setCopyState("复制我的选择"); }
  async function copyVotes() {
    const lines = voteOptions.map(option => {
      const names = destinations.filter(item => votes[item.id] === option.id).map(item => item.name.zh);
      return `${option.emoji} ${option.label}：${names.length ? names.join("、") : "—"}`;
    });
    await navigator.clipboard.writeText([tripData.meta.title, ...lines].join("\n"));
    setCopyState("✓ 已复制");
    window.setTimeout(() => setCopyState("复制我的选择"), 1600);
  }

  return <main>
    <header className="site-header"><div><p className="eyebrow">旅の候補 · TRIP SHORTLIST</p><h1>名古屋 → 立山黑部</h1></div><div className="count"><b>{activeIndex + 1}</b><span>/ {destinations.length}</span></div></header>
    <section className="card-shell" aria-live="polite"><article className="destination-card">
      <div className="gallery">
        <div className={`placeholder placeholder-${imageIndex + 1}`}><div className="mountain-mark" aria-hidden="true"><span/><span/></div><div className="image-label"><small>{destination.gallery.requirements[imageIndex].role.toUpperCase()} · 季节实景待补</small><strong>{destination.gallery.requirements[imageIndex].subject}</strong><span>{destination.gallery.requirements[imageIndex].seasonConstraint}</span></div></div>
        <button className="gallery-arrow left" onClick={() => setImageIndex((imageIndex - 1 + destination.gallery.requirements.length) % destination.gallery.requirements.length)} aria-label="上一张图片">‹</button>
        <button className="gallery-arrow right" onClick={() => setImageIndex((imageIndex + 1) % destination.gallery.requirements.length)} aria-label="下一张图片">›</button>
        <div className="gallery-topline"><span>PHOTO {String(imageIndex + 1).padStart(2,"0")}</span><span>{destination.region}</span></div>
        <div className="gallery-dots">{destination.gallery.requirements.map((item,index) => <button key={item.slot} className={index === imageIndex ? "active" : ""} onClick={() => setImageIndex(index)} aria-label={`查看第 ${index + 1} 张图片`} />)}</div>
      </div>
      <div className="card-content">
        <div className="title-row"><div><p className="japanese-name">{destination.name.ja} · {destination.name.en}</p><h2>{destination.name.zh}</h2></div><span className="season-score"><b>{destination.friendCard.season.rating}</b>/5<br/><small>季节匹配</small></span></div>
        <p className="one-line">{destination.friendCard.oneLine}</p>
        <div className="tags">{destination.friendCard.tags.map(tag => <span key={tag.label}>{tag.emoji} {tag.label}</span>)}</div>
        <p className="hook">{destination.friendCard.hook}</p>
        <section className="experience-block"><p className="section-kicker">TOP 3 EXPERIENCES</p><ol>{destination.friendCard.topExperiences.map((experience,index) => <li key={experience}><span>0{index+1}</span><p>{experience}</p></li>)}</ol></section>
        <aside className="season-note"><div className="season-icon">秋</div><div><h3>国庆去是什么样</h3><p>{destination.friendCard.season.summary}</p></div></aside>
        <div className="glance-grid"><div><small>最低停留</small><strong>{destination.friendCard.costAtGlance.minimumTime}</strong></div><div><small>推荐安排</small><strong>{destination.friendCard.costAtGlance.idealTime}</strong></div></div>
        <div className="ratings"><Rating label="体力要求" value={destination.friendCard.costAtGlance.physicalRating}/><Rating label="天气敏感" value={destination.friendCard.costAtGlance.weatherSensitivityRating}/></div>
        <section className="vote-panel"><div className="vote-heading"><div><span>YOUR VOTE</span><h3>{destination.friendCard.independentVerdictPrompt}</h3></div>{selectedVote && <b className="saved">✓ 已保存</b>}</div><div className="vote-grid">{voteOptions.map(option => <button key={option.id} className={selectedVote === option.id ? "selected" : ""} onClick={() => vote(option.id as VoteId)} aria-pressed={selectedVote === option.id}><span>{option.emoji}</span><b>{option.label}</b></button>)}</div></section>

        <details className="details-view">
          <summary><span><small>PLANNER NOTES</small>查看详细资料</span><b>＋</b></summary>
          <div className="details-body">
            {selectedVote && !destination.detail.plannerVerdict.showBeforeVote && <aside className="planner-verdict"><span>{destination.detail.plannerVerdict.grade}</span><div><small>规划者判断 · 投票后显示</small><p>{destination.detail.plannerVerdict.summary}</p></div></aside>}
            <section className="detail-section"><p className="detail-number">01</p><div><h3>怎么玩</h3><p>{destination.detail.coreSellingPoint}</p><div className="route-line">{destination.detail.typicalRoute.stops.map((stop,index) => <span key={stop}>{stop}{index < destination.detail.typicalRoute.stops.length-1 && <i>→</i>}</span>)}</div><dl><div><dt>路线</dt><dd>{destination.detail.typicalRoute.name}</dd></div><div><dt>距离</dt><dd>{destination.detail.typicalRoute.distanceKm} km</dd></div><div><dt>官方步行</dt><dd>{destination.detail.typicalRoute.officialWalkingTime}</dd></div><div><dt>实际游玩</dt><dd>{destination.detail.typicalRoute.realisticVisitTime}</dd></div></dl><p className="fine-note">延伸：{destination.detail.typicalRoute.extension}</p></div></section>
            <section className="detail-section"><p className="detail-number">02</p><div><h3>国庆季节表现</h3><p className="feature-text">{destination.detail.seasonality.stage}</p><p>{destination.detail.seasonality.temperatureContext}</p><p>{destination.detail.seasonality.clothing}</p><div className="expectation"><b>大概率会看到</b>{destination.friendCard.season.whatYouLikelySee.map(item => <span key={item}>· {item}</span>)}<em>别被误导：{destination.friendCard.season.misleadingExpectation}</em></div></div></section>
            <section className="detail-section"><p className="detail-number">03</p><div><h3>体力与天气</h3><div className="detail-ratings"><Rating label="体力要求" value={destination.detail.ratings.physical}/><Rating label="天气敏感" value={destination.detail.ratings.weatherSensitivity}/><Rating label="住一晚景观价值" value={destination.detail.ratings.overnightSceneryValue}/><Rating label="住一晚行程效率" value={destination.detail.ratings.overnightItineraryEfficiency}/></div><p>{destination.detail.overnight.value}</p></div></section>
            <section className="detail-section"><p className="detail-number">04</p><div><h3>交通与行李</h3>{destination.detail.access.mainEntrances.map(item => <p className="access-line" key={item}>↗ {item}</p>)}<p>{destination.detail.access.operatingSeason2026}</p><div className="pending-box"><small>路线嵌入</small><b>{destination.detail.routeIntegration.status === "pending_master_sheet" ? destination.detail.routeIntegration.displayText : destination.detail.routeIntegration.trafficCost}</b></div><p>{destination.detail.luggage}</p></div></section>
            <section className="detail-section"><p className="detail-number">05</p><div><h3>和其他候选的区别</h3><p className="compare-title">VS. {destination.detail.overlap.with} · 重叠度 {destination.detail.overlap.level}/5</p><p>{destination.detail.overlap.difference}</p><div className="fit-grid"><div><b>适合你，如果</b>{destination.detail.goodFor.map(item => <span key={item}>＋ {item}</span>)}</div><div><b>可能不适合，如果</b>{destination.detail.notFor.map(item => <span key={item}>－ {item}</span>)}</div></div></div></section>
            <section className="detail-section"><p className="detail-number">06</p><div><h3>预约风险</h3><p className="risk-level">风险：{destination.detail.bookingRisk.level}</p><p>{destination.detail.bookingRisk.summary}</p><p>{destination.detail.bookingRisk.note}</p></div></section>
            <section className="detail-section sources"><p className="detail-number">07</p><div><h3>信息源</h3><p className="verified">核验于 {destination.research.lastVerified}</p>{destination.sources.map((source,index) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer"><span>{String(index+1).padStart(2,"0")}</span><div><b>{source.title}</b><small>{source.supports.join(" · ")}</small></div><i>↗</i></a>)}</div></section>
          </div>
        </details>
      </div>
    </article></section>
    {destinations.length > 1 && <nav className="destination-nav" aria-label="目的地切换"><button disabled={activeIndex===0} onClick={() => {setActiveIndex(activeIndex-1);setImageIndex(0)}}>← 上一个</button><button disabled={activeIndex===destinations.length-1} onClick={() => {setActiveIndex(activeIndex+1);setImageIndex(0)}}>下一个 →</button></nav>}
    <section className="summary-panel"><p className="eyebrow">MY SHORTLIST</p><h2>我的选择</h2><div className="summary-groups">{voteOptions.map(option => { const names=destinations.filter(item => votes[item.id]===option.id).map(item => item.name.zh); return <div key={option.id}><span>{option.emoji}</span><b>{option.label}</b><p>{names.length ? names.join("、") : "—"}</p></div>})}</div><div className="summary-actions"><button className="copy-button" onClick={copyVotes} disabled={!Object.keys(votes).length}>{copyState}</button><button className="reset-button" onClick={resetVotes} disabled={!Object.keys(votes).length}>重置选择</button></div><p className="storage-note">选择只保存在这台设备的浏览器中，无需登录。</p></section>
  </main>;
}
