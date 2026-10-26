import React, { useState } from 'react';
import { Clock, Users, ChefHat, Flame, Dumbbell, Wheat, Droplets, Lightbulb, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';

function MetaBadge({ icon: Icon, label, value, color }) {
  return (
    <div className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl', color)}>
      <Icon size={14} className="flex-shrink-0 opacity-80" />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">{label}</p>
        <p className="text-sm font-semibold leading-tight">{value}</p>
      </div>
    </div>
  );
}

function NutritionPill({ icon: Icon, label, value, bgColor, textColor }) {
  return (
    <div className={clsx('flex flex-col items-center justify-center px-3 py-2.5 rounded-xl gap-0.5', bgColor)}>
      <Icon size={14} className={clsx('mb-0.5', textColor)} />
      <p className={clsx('text-sm font-bold', textColor)}>{value}</p>
      <p className={clsx('text-[9px] font-semibold uppercase tracking-wider opacity-70', textColor)}>{label}</p>
    </div>
  );
}

export function RecipeCard({ recipe }) {
  const [checkedIngredients, setCheckedIngredients] = useState(new Set());
  const [activeTab, setActiveTab] = useState('ingredients');

  const toggleIngredient = (id) => {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const tabs = [
    { id: 'ingredients', label: `Ingredients (${recipe.ingredients.length})` },
    { id: 'instructions', label: `Steps (${recipe.instructions.length})` },
    { id: 'nutrition', label: 'Nutrition' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-xl bg-[var(--bg-elevated)] rounded-2xl border border-[var(--border-medium)] shadow-card overflow-hidden my-2"
    >
      {/* ── Header ── */}
      <div className="bg-gradient-to-r from-palm-600 to-sea-600 px-5 py-5 relative overflow-hidden">
        {/* Subtle pattern overlay */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='white' fill-opacity='1'%3E%3Cpath d='M20 0 C20 0 24 8 20 14 C16 8 20 0 20 0z'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative">
          <div className="flex items-start gap-3">
            <span className="text-3xl flex-shrink-0">{recipe.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-xl font-semibold text-white leading-tight">
                {recipe.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-white/20 text-white">
                  {recipe.cuisine}
                </span>
              </div>
            </div>
          </div>
          <p className="text-sm text-white/80 mt-2.5 leading-relaxed">
            {recipe.description}
          </p>
        </div>
      </div>

      {/* ── Meta badges ── */}
      <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-[var(--border-subtle)]">
        <MetaBadge
          icon={Clock}
          label="Cook Time"
          value={recipe.cookTime}
          color="bg-[var(--accent-sea-light)] text-sea-700 dark:text-sea-300"
        />
        <MetaBadge
          icon={Users}
          label="Serves"
          value={`${recipe.servings} people`}
          color="bg-[var(--accent-green-light)] text-palm-700 dark:text-palm-300"
        />
        <MetaBadge
          icon={ChefHat}
          label="Difficulty"
          value={recipe.difficulty}
          color="bg-[var(--accent-terra-light)] text-terracotta-600 dark:text-terracotta-300"
        />
      </div>

      {/* ── Tabs ── */}
      <div className="flex border-b border-[var(--border-subtle)] px-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={clsx(
              'flex-1 py-3 text-xs font-semibold transition-all duration-200 relative',
              activeTab === tab.id
                ? 'text-palm-700 dark:text-palm-400'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            )}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-1 right-1 h-0.5 bg-palm-600 dark:bg-palm-400 rounded-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="px-5 py-4 max-h-[380px] overflow-y-auto">

        {/* INGREDIENTS */}
        {activeTab === 'ingredients' && (
          <motion.div
            key="ingredients"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-1.5"
          >
            <p className="text-[10px] text-[var(--text-muted)] mb-2 font-medium">
              Tap to check off as you cook
            </p>
            {recipe.ingredients.map((ing) => {
              const checked = checkedIngredients.has(ing.id);
              return (
                <label
                  key={ing.id}
                  className="ingredient-item flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-[var(--border-subtle)] cursor-pointer group transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleIngredient(ing.id)}
                    className="sr-only"
                  />
                  <div className="flex-shrink-0">
                    {checked ? (
                      <CheckCircle2 size={18} className="text-palm-500" />
                    ) : (
                      <Circle size={18} className="text-[var(--border-medium)] group-hover:text-[var(--text-muted)]" />
                    )}
                  </div>
                  <span className={clsx(
                    'text-sm flex-1',
                    checked ? 'line-through text-[var(--text-muted)]' : 'text-[var(--text-primary)]'
                  )}>
                    <strong className="font-semibold">{ing.amount}</strong>{' '}
                    {ing.item}
                  </span>
                </label>
              );
            })}
          </motion.div>
        )}

        {/* INSTRUCTIONS */}
        {activeTab === 'instructions' && (
          <motion.div
            key="instructions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col gap-4"
          >
            {recipe.instructions.map((instr) => (
              <div key={instr.step} className="flex gap-3">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-palm-500 to-sea-500 flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{instr.step}</span>
                </div>
                <div className="flex-1 pb-4 border-b border-[var(--border-subtle)] last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{instr.title}</p>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{instr.detail}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* NUTRITION */}
        {activeTab === 'nutrition' && (
          <motion.div
            key="nutrition"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <p className="text-xs text-[var(--text-muted)]">Per serving (approx.)</p>
            <div className="grid grid-cols-5 gap-2">
              <NutritionPill
                icon={Flame}
                label="Calories"
                value={recipe.nutrition.calories}
                bgColor="bg-terracotta-50 dark:bg-terracotta-900/30"
                textColor="text-terracotta-600 dark:text-terracotta-300"
              />
              <NutritionPill
                icon={Dumbbell}
                label="Protein"
                value={recipe.nutrition.protein}
                bgColor="bg-[var(--accent-green-light)]"
                textColor="text-palm-700 dark:text-palm-300"
              />
              <NutritionPill
                icon={Wheat}
                label="Carbs"
                value={recipe.nutrition.carbs}
                bgColor="bg-amber-50 dark:bg-amber-900/20"
                textColor="text-amber-700 dark:text-amber-300"
              />
              <NutritionPill
                icon={Droplets}
                label="Fat"
                value={recipe.nutrition.fat}
                bgColor="bg-[var(--accent-sea-light)]"
                textColor="text-sea-700 dark:text-sea-300"
              />
              <NutritionPill
                icon={Wheat}
                label="Fiber"
                value={recipe.nutrition.fiber}
                bgColor="bg-earth-50 dark:bg-earth-900/30"
                textColor="text-earth-600 dark:text-earth-300"
              />
            </div>

            {/* Tips */}
            {recipe.tips && recipe.tips.length > 0 && (
              <div className="mt-4 rounded-xl bg-[var(--accent-green-light)] p-4 border border-palm-200 dark:border-palm-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb size={15} className="text-palm-600 dark:text-palm-400" />
                  <p className="text-xs font-semibold text-palm-700 dark:text-palm-300 uppercase tracking-wide">
                    Chef's Tips
                  </p>
                </div>
                <ul className="space-y-2">
                  {recipe.tips.map((tip, i) => (
                    <li key={i} className="flex gap-2 text-xs text-palm-800 dark:text-palm-200 leading-relaxed">
                      <span className="text-palm-500 flex-shrink-0 mt-0.5">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
