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
  const destinations = tripData.destinations;
  const destination = destinations[activeIndex];
  const selectedVote = votes[destination.id];

  useEffect(() => { try { setVotes(JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")); } catch { setVotes({}); } }, []);
  const voteOptions = useMemo(() => tripData.meta.voteOptions, []);
  function vote(value: VoteId) { const next = {...votes, [destination.id]: value}; setVotes(next); localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }

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
      </div>
    </article></section>
    {destinations.length > 1 && <nav className="destination-nav" aria-label="目的地切换"><button disabled={activeIndex===0} onClick={() => {setActiveIndex(activeIndex-1);setImageIndex(0)}}>← 上一个</button><button disabled={activeIndex===destinations.length-1} onClick={() => {setActiveIndex(activeIndex+1);setImageIndex(0)}}>下一个 →</button></nav>}
  </main>;
}
