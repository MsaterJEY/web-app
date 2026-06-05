"use client";
import React, { useState } from 'react';
import { Hammer, Trees, ShieldAlert, Compass } from 'lucide-react';

// จำลองฐานข้อมูลจาก ResourceConfig.lua มาแสดงบนเว็บ
const resourceDatabase = [
  {
    name: "Tree",
    type: "Forest",
    maxHealth: 100,
    requiredTool: "Axe",
    respawnTime: "15s",
    drops: [
      { item: "Wood", amount: "3-5" },
      { item: "Fiber", amount: "1-2" }
    ]
  },
  {
    name: "Rock",
    type: "Rocky Shore",
    maxHealth: 150,
    requiredTool: "Pickaxe",
    respawnTime: "20s",
    drops: [
      { item: "Stone", amount: "2-4" },
      { item: "Iron Ore", amount: "0-1" }
    ]
  }
];

export default function HomePage() {
  const [selectedResource, setSelectedResource] = useState(resourceDatabase[0]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl tracking-wider text-amber-500">
            <Compass className="w-6 h-6 animate-spin-slow" />
            SANDBOX ISLAND
          </div>
          <nav className="hidden md:flex gap-6 text-sm text-slate-300">
            <a href="#about" className="hover:text-amber-500 transition-colors">About</a>
            <a href="#wiki" className="hover:text-amber-500 transition-colors">Resource Wiki</a>
          </nav>
          <a 
            href="https://www.roblox.com" // ใส่ Link แมปเกมของคุณตรงนี้
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-amber-600 hover:bg-amber-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all shadow-lg shadow-amber-900/20"
          >
            Play Game
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section id="about" className="py-20 text-center px-4 max-w-4xl mx-auto flex-1 flex flex-col justify-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
          Survival Starts Here
        </h1>
        <p className="mt-6 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Stranded on a tropical island. Gather raw resources, craft primitive tools, build secure shelters, and explore unknown dynamic islands. Will you survive the wild?
        </p>
      </section>

      {/* Resource Wiki Section */}
      <section id="wiki" className="bg-slate-950/50 py-16 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-8 justify-center md:justify-start">
            <Trees className="w-6 h-6 text-amber-500" />
            <h2 className="text-2xl font-bold">Island Resource Wiki</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* List */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Select Resource</span>
              {resourceDatabase.map((res) => (
                <button
                  key={res.name}
                  onClick={() => setSelectedResource(res)}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center ${
                    selectedResource.name === res.name 
                      ? 'bg-amber-950/20 border-amber-500/50 text-amber-400' 
                      : 'bg-slate-900/30 border-slate-800 text-slate-300 hover:bg-slate-900/50'
                  }`}
                >
                  <span className="font-semibold">{res.name}</span>
                  <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">{res.type}</span>
                </button>
              ))}
            </div>

            {/* Detailed View */}
            <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
              <h3 className="text-2xl font-bold text-amber-500 mb-4">{selectedResource.name} Details</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <span className="text-xs text-slate-400 block">Required Tool</span>
                  <span className="font-semibold text-lg flex items-center gap-2 mt-1">
                    <Hammer className="w-4 h-4 text-amber-500" /> {selectedResource.requiredTool}
                  </span>
                </div>
                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-900">
                  <span className="text-xs text-slate-400 block">Respawn Time</span>
                  <span className="font-semibold text-lg mt-1 block">{selectedResource.respawnTime}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-slate-400 uppercase tracking-wider mb-3">Guaranteed Drops</h4>
                <div className="space-y-2">
                  {selectedResource.drops.map((drop) => (
                    <div key={drop.item} className="flex justify-between items-center bg-slate-950/30 px-4 py-3 rounded-lg border border-slate-900">
                      <span className="font-medium text-slate-200">{drop.item}</span>
                      <span className="text-amber-500 font-bold">x{drop.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Sandbox Island Survival. Developed for Roblox.</p>
      </footer>
    </div>
  );
}