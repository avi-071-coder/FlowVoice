import React from "react";
import { Sparkles, Camera } from "lucide-react";

interface StoryItem {
  id: string;
  img: string;
  caption: string;
  tag: string;
  description: string;
}

const stories: StoryItem[] = [
  {
    id: "ocean",
    img: "/images/voice_hero_ocean.jpg",
    caption: "Golden hour shoreline walk",
    tag: "OUTDOOR FREEDOM",
    description: "Interruption-resilient voice while navigating coastal winds hands-free.",
  },
  {
    id: "cafe",
    img: "/images/voice_handsfree_cafe.jpg",
    caption: "Sunlit cafe workspace",
    tag: "WORKFLOW FLOW",
    description: "Refining restaurant parameters mid-sentence without touching a keyboard.",
  },
  {
    id: "kitchen",
    img: "/images/voice_kitchen_cooking.jpg",
    caption: "Cooking with zero hands",
    tag: "HOME LIVING",
    description: "Adding dietary filters while mixing ingredients, instantly updated.",
  },
  {
    id: "urban",
    img: "/images/voice_urban_walk.jpg",
    caption: "European street portrait",
    tag: "URBAN MOBILITY",
    description: "Realtime context switching during dynamic urban commutes.",
  },
];

export const PhotoStorySection: React.FC = () => {
  return (
    <section id="stories-section" className="photo-story-section">
      <div className="section-editorial-header">
        <div className="hero-eyebrow">
          <Camera size={12} />
          <span>AUTHENTIC HUMAN EXPERIENCES</span>
        </div>
        <h2>Designed for Human Life in Motion</h2>
        <span className="handwritten-subtitle">"Real voice assistants should feel natural, responsive, and souled."</span>
      </div>

      <div className="polaroid-grid">
        {stories.map((item) => (
          <div key={item.id} className="polaroid-card">
            <div className="polaroid-img-wrapper">
              <img src={item.img} alt={item.caption} loading="lazy" />
            </div>
            <div className="polaroid-caption">{item.caption}</div>
            <span className="polaroid-tag">{item.tag}</span>
          </div>
        ))}
      </div>
    </section>
  );
};
