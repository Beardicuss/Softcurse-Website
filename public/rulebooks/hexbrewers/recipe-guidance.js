/* Generated from the game rules sources. */
window.HEXBREWERS_RECIPE_GUIDANCE = {
  "blue": {
    "1": {
      "timing": "Immediately after placement",
      "choice": "Optional",
      "trigger": "Place Frostbile.",
      "resolution": "Draw chips equal to its printed value. Choose at most one to place and resolve normally; return every other sampled chip to the bag.",
      "multiple": "Each Frostbile resolves separately. A kept Frostbile can begin another sample.",
      "example": "A value-2 Frostbile samples two chips; you may place either one or neither.",
      "worksWellWith": "Plaguedust recovery and position-based Wraithbloom.",
      "tradeoff": "More resolved draws can still expose Voidshards."
    },
    "2": {
      "timing": "For the following draws",
      "choice": "Automatic",
      "trigger": "Place Frostbile.",
      "resolution": "Its value becomes the number of protected draws. If one of those draws shatters the crucible, you may keep both normal scoring rewards instead of choosing one.",
      "multiple": "A new Frostbile keeps the larger remaining protection; protection does not add together.",
      "example": "Value 2 protects the next two placed draws.",
      "worksWellWith": "High-value ingredients and raised pressure limits.",
      "tradeoff": "It protects rewards, not the crucible; the brew still shatters."
    },
    "3": {
      "timing": "Immediately after placement",
      "choice": "Automatic",
      "trigger": "This Frostbile itself finishes on a ruby space.",
      "resolution": "Gain 1 ruby.",
      "multiple": "Every Frostbile checks its own landing space and may pay once.",
      "example": "A Frostbile landing on space 9 gains one ruby.",
      "worksWellWith": "Ruby engines and droplet advancement.",
      "tradeoff": "No reward on an ordinary space."
    },
    "4": {
      "timing": "Immediately after placement",
      "choice": "Automatic",
      "trigger": "This Frostbile itself finishes on a ruby space.",
      "resolution": "Gain Prestige equal to its printed value.",
      "multiple": "Each Frostbile checks and scores independently.",
      "example": "A value-4 Frostbile landing on a ruby space gains 4 Prestige.",
      "worksWellWith": "Sequential Plaguedust movement and refined bags.",
      "tradeoff": "Expensive chips can miss the required spaces."
    },
    "5": {
      "timing": "Immediately after placement",
      "choice": "Automatic",
      "trigger": "Pressure is 2 or lower after Frostbile is placed.",
      "resolution": "Gain 1 ruby.",
      "multiple": "Every qualifying Frostbile pays once.",
      "example": "At pressure 2, a placed Frostbile grants one ruby.",
      "worksWellWith": "Early safe draws and ruby spending.",
      "tradeoff": "Its payoff disappears once pressure rises above 2."
    },
    "6": {
      "timing": "Immediately after placement",
      "choice": "Automatic",
      "trigger": "Pressure is exactly 6 or 7 after Frostbile is placed.",
      "resolution": "Gain Prestige equal to its printed value.",
      "multiple": "Every qualifying Frostbile scores independently.",
      "example": "At pressure 6, value-2 Frostbile gains 2 Prestige.",
      "worksWellWith": "Pressure control and late-brew timing.",
      "tradeoff": "It asks you to remain close to shattering."
    }
  },
  "red": {
    "1": {
      "timing": "When movement is calculated",
      "choice": "Automatic",
      "trigger": "Place Bloodthorn after Brimstones are already in the crucible.",
      "resolution": "Move +1 with 1–2 earlier Brimstones, or +2 with 3 or more.",
      "multiple": "Each Bloodthorn counts the Brimstones present when it is placed.",
      "example": "With three Brimstones already placed, value-1 Bloodthorn moves 3.",
      "worksWellWith": "Brimstone density and safe movement.",
      "tradeoff": "Brimstones drawn later do not improve an earlier Bloodthorn."
    },
    "2": {
      "timing": "When drawn; decide after brewing",
      "choice": "Optional",
      "trigger": "Draw Bloodthorn.",
      "resolution": "Set it beside the crucible without moving. After brewing ends, choose separately for each reserved chip: place it now, save it beside the crucible for a later round, or return it to the bag.",
      "multiple": "Every reserved Bloodthorn receives its own choice, and saved chips remain reserved between rounds.",
      "example": "Two reserved Bloodthorns may be handled differently: place one now and save the other.",
      "worksWellWith": "End-position Deathweave and planned future rounds.",
      "tradeoff": "Movement is delayed, and saving it denies its value to the current brew."
    },
    "3": {
      "timing": "Immediately after placement",
      "choice": "Optional",
      "trigger": "Bloodthorn is placed directly after a Voidshard.",
      "resolution": "Move it additional spaces equal to that preceding Voidshard's printed value.",
      "multiple": "Each qualifying Bloodthorn may take its own bonus.",
      "example": "After a value-3 Voidshard, value-1 Bloodthorn may move 4 total.",
      "worksWellWith": "Voidshard recovery and exact-seven builds.",
      "tradeoff": "The setup adds pressure before it adds movement."
    },
    "4": {
      "timing": "For later value-1 Voidshards this round",
      "choice": "Automatic",
      "trigger": "At least one Bloodthorn has already been placed.",
      "resolution": "Every subsequently placed value-1 Voidshard moves one additional space.",
      "multiple": "Additional Bloodthorns do not increase the bonus.",
      "example": "After Bloodthorn, a value-1 Voidshard moves 2 but still adds only 1 pressure.",
      "worksWellWith": "Raised pressure limits and fast position builds.",
      "tradeoff": "The extra movement can encourage another dangerous draw."
    },
    "5": {
      "timing": "When movement is calculated",
      "choice": "Automatic",
      "trigger": "Place Bloodthorn after distinct non-white colors.",
      "resolution": "Move +1 for three distinct colors already present, or +2 for six; maximum +2.",
      "multiple": "Each Bloodthorn recounts earlier colors when placed.",
      "example": "Blue, yellow, and green already placed grant +1.",
      "worksWellWith": "Broad multicolor bags.",
      "tradeoff": "Focused bags rarely reach the threshold."
    },
    "6": {
      "timing": "When movement is calculated",
      "choice": "Automatic",
      "trigger": "Place Bloodthorn after Echo Reeds.",
      "resolution": "Move +1 per earlier Echo Reed, to a maximum of +3.",
      "multiple": "Each Bloodthorn recounts Echo Reeds when placed.",
      "example": "Two earlier Echo Reeds make value-2 Bloodthorn move 4.",
      "worksWellWith": "Echo Reed concentration.",
      "tradeoff": "Requires Mirewrought ingredients and favorable order."
    }
  },
  "yellow": {
    "1": {
      "timing": "Immediately after placement",
      "choice": "Optional",
      "trigger": "Plaguedust is placed directly after a Voidshard.",
      "resolution": "Return that preceding Voidshard to the bag and subtract its value from pressure. Plaguedust remains where it landed.",
      "multiple": "Each Plaguedust can return only the immediately preceding chip.",
      "example": "Returning a value-2 Voidshard reduces pressure by 2.",
      "worksWellWith": "Selective Frostbile draws and aggressive stopping decisions.",
      "tradeoff": "It cannot return an older Voidshard."
    },
    "2": {
      "timing": "On the next placed chip",
      "choice": "Automatic",
      "trigger": "Place Plaguedust.",
      "resolution": "The next chip placed moves twice its normal calculated distance; then the effect ends.",
      "multiple": "The effect does not stack. If the next chip is Plaguedust, that chip is doubled and creates a fresh effect for the following chip.",
      "example": "A normally moving value-4 chip moves 8.",
      "worksWellWith": "High-value Bloodthorn and Frostbile.",
      "tradeoff": "Hidden draw order may spend it on a weak chip."
    },
    "3": {
      "timing": "Passive while brewing",
      "choice": "Automatic",
      "trigger": "Have Plaguedust in the crucible.",
      "resolution": "One or two raise the safe pressure limit from 7 to 8; three or more raise it to 9.",
      "multiple": "Copies advance the two thresholds; they do not add one limit per chip.",
      "example": "With three Plaguedusts, pressure 9 is safe and 10 shatters.",
      "worksWellWith": "Exact-seven Deathweave and risky draw engines.",
      "tradeoff": "Safety alone produces no reward."
    },
    "4": {
      "timing": "Immediately after each placement",
      "choice": "Optional",
      "trigger": "Place your first, second, or third Plaguedust of the round.",
      "resolution": "Move it +1, +2, or +3 respectively. Later Plaguedusts receive no bonus.",
      "multiple": "The count is shared across all Plaguedust values.",
      "example": "Your second Plaguedust may move two extra spaces.",
      "worksWellWith": "Position-band Wraithbloom and ruby-space Frostbile.",
      "tradeoff": "Requires drawing several copies in useful order."
    },
    "5": {
      "timing": "Immediately after placement",
      "choice": "Automatic",
      "trigger": "Plaguedust is placed directly after a Voidshard.",
      "resolution": "Gain 1 ruby.",
      "multiple": "Every qualifying Plaguedust pays once.",
      "example": "Two separate Voidshard→Plaguedust pairs gain two rubies.",
      "worksWellWith": "Ruby-spending engines.",
      "tradeoff": "Adds no protection from the preceding pressure."
    },
    "6": {
      "timing": "Immediately after placement",
      "choice": "Automatic",
      "trigger": "Plaguedust is placed directly after a Voidshard.",
      "resolution": "Advance the droplet 1 space.",
      "multiple": "Every qualifying Plaguedust advances it once.",
      "example": "A qualifying pair improves next round's starting position by one.",
      "worksWellWith": "Long-term droplet engines.",
      "tradeoff": "The current brew still carries the Voidshard's danger."
    }
  },
  "green": {
    "1": {
      "timing": "During end-of-round evaluation",
      "choice": "Automatic",
      "trigger": "Deathweave is one of the final two placed chips.",
      "resolution": "Gain 1 ruby for each qualifying Deathweave.",
      "multiple": "Both final spaces can qualify, for at most 2 rubies.",
      "example": "If the last two chips are both Deathweave, gain 2 rubies.",
      "worksWellWith": "Controlled stopping and ruby conversion.",
      "tradeoff": "Drawing once more can push it out of the final two."
    },
    "2": {
      "timing": "During end-of-round evaluation",
      "choice": "Optional",
      "trigger": "Deathweave is one of the final two placed chips.",
      "resolution": "Value 1 gains Brimstone 1; value 2 chooses Frostbile 1 or Bloodthorn 1; value 4 chooses Plaguedust 1 or Wraithbloom 1. Rewards require available shared stock.",
      "multiple": "Resolve each qualifying Deathweave separately in seating order.",
      "example": "A final value-2 Deathweave may add Frostbile 1 to the bag.",
      "worksWellWith": "Deferred Bloodthorn and adaptive bag building.",
      "tradeoff": "End position and shared stock can deny the desired reward."
    },
    "3": {
      "timing": "During end-of-round evaluation",
      "choice": "Optional",
      "trigger": "Finish with exactly 7 pressure and at least one Deathweave placed.",
      "resolution": "Move the final placed chip additional spaces equal to the total printed value of all placed Deathweave.",
      "multiple": "This is one combined movement, not one movement per Deathweave.",
      "example": "Deathweave values 1 and 2 move the final chip +3.",
      "worksWellWith": "Raised pressure limits and deliberate exact-seven brewing.",
      "tradeoff": "Missing exactly 7 yields nothing."
    },
    "4": {
      "timing": "During end-of-round evaluation",
      "choice": "Optional",
      "trigger": "Deathweave is one of the final two placed chips.",
      "resolution": "For each qualifying Deathweave, you may spend 1 ruby to advance the droplet 1 space.",
      "multiple": "Up to two conversions may occur, limited by your rubies.",
      "example": "Two final Deathweaves and two rubies can advance the droplet twice.",
      "worksWellWith": "Ruby-space Frostbile and long-term starts.",
      "tradeoff": "Competes with flask refills and other ruby uses."
    },
    "5": {
      "timing": "During end-of-round evaluation",
      "choice": "Automatic",
      "trigger": "Deathweave is one of the final two placed chips.",
      "resolution": "Gain 1 Prestige for each qualifying Deathweave.",
      "multiple": "Both final spaces may score, for at most 2 Prestige.",
      "example": "One qualifying Deathweave gains 1 Prestige.",
      "worksWellWith": "Precise stopping.",
      "tradeoff": "One extra draw can remove the payoff."
    },
    "6": {
      "timing": "During end-of-round evaluation",
      "choice": "Automatic",
      "trigger": "Deathweave is one of the final two placed chips.",
      "resolution": "Advance the droplet 1 space for each qualifying Deathweave.",
      "multiple": "Both final spaces may trigger, for at most 2 advances.",
      "example": "Two qualifying copies advance the droplet twice.",
      "worksWellWith": "Long-term starting position.",
      "tradeoff": "Low immediate movement and strict ending order."
    }
  },
  "purple": {
    "1": {
      "timing": "During end-of-round evaluation",
      "choice": "Optional",
      "trigger": "Finish with placed Wraithblooms.",
      "resolution": "Choose any unlocked milestone or skip: one grants 1 Prestige; two grant 1 Prestige and 1 ruby; three or more grant 2 Prestige and droplet +1.",
      "multiple": "Milestones are not cumulative; resolve one choice total, and you may deliberately take a lower unlocked reward.",
      "example": "With three Wraithblooms, you may take the three-copy reward or select either lower milestone instead.",
      "worksWellWith": "Collection and end-position engines.",
      "tradeoff": "Copies move only one space and unlock late."
    },
    "2": {
      "timing": "During end-of-round evaluation",
      "choice": "Optional",
      "trigger": "Finish with placed Wraithblooms.",
      "resolution": "Trade exactly 1 for Shadowmoss 1 +1 Prestige +1 ruby; 2 for Deathweave 1 + Frostbile 2 +3 Prestige +droplet 1; or 3 for Plaguedust 4 +6 Prestige +1 ruby +droplet 2. Rewards require stock.",
      "multiple": "Choose one trade total; traded Wraithblooms leave the crucible.",
      "example": "Trading two uses both placed copies and grants the complete two-copy package.",
      "worksWellWith": "Slow transmutation and tailored bag growth.",
      "tradeoff": "Large setup cost and limited shared stock."
    },
    "3": {
      "timing": "During end-of-round evaluation",
      "choice": "Automatic",
      "trigger": "A Wraithbloom was placed on space 10 or farther.",
      "resolution": "Each scores by its own landing space: 10–19 gains 1 Prestige, 20–29 gains 2, and 30+ gains 3.",
      "multiple": "Score every Wraithbloom separately.",
      "example": "Copies on spaces 12 and 22 score 1 + 2 Prestige.",
      "worksWellWith": "Movement multipliers and fast positioning.",
      "tradeoff": "Copies below space 10 score nothing."
    },
    "4": {
      "timing": "During end-of-round evaluation",
      "choice": "Optional",
      "trigger": "Finish with placed Wraithblooms and own an eligible colored ingredient.",
      "resolution": "Choose one upgrade total: with 1+ Wraithbloom upgrade one value 1→2; with 2+ upgrade one 2→4; with 3+ upgrade one 1→4. The old chip is removed and the new chip enters the bag; stock must exist.",
      "multiple": "Only one upgrade is made, regardless of copy count.",
      "example": "Three Wraithblooms may turn one value-1 colored chip directly into value 4.",
      "worksWellWith": "Long-term bag refinement.",
      "tradeoff": "Late access leaves fewer rounds to recover the investment."
    },
    "5": {
      "timing": "During end-of-round evaluation",
      "choice": "Automatic",
      "trigger": "At least one Wraithbloom is placed.",
      "resolution": "Gain Prestige equal to the number of distinct non-white colors in the crucible, maximum 4.",
      "multiple": "Additional Wraithblooms do not repeat the score.",
      "example": "Four distinct colors plus Wraithbloom gain 4 Prestige.",
      "worksWellWith": "Broad multicolor bags.",
      "tradeoff": "Focused builds score less and extra copies add no score."
    },
    "6": {
      "timing": "During end-of-round evaluation",
      "choice": "Automatic",
      "trigger": "Finish with placed Wraithblooms.",
      "resolution": "Gain 1 ruby per Wraithbloom and Prestige equal to their count, maximum 2 Prestige.",
      "multiple": "Rubies continue per copy; only Prestige is capped at 2.",
      "example": "Three copies gain 3 rubies and 2 Prestige.",
      "worksWellWith": "Ruby engines and collection.",
      "tradeoff": "Low movement and high purchase cost."
    }
  }
};
window.HEXBREWERS_RECIPE_STRATEGIES = {
  "1": [
    {
      "id": "set1-control-chain",
      "set": 1,
      "name": "Controlled Chain",
      "preferredColors": [
        "blue",
        "yellow",
        "purple"
      ],
      "thesis": "Filter draws, recover Voidshards, then convert safe depth into milestone value.",
      "counterweight": "More draws still increase exposure and the engine is expensive."
    },
    {
      "id": "set1-ruby-bloom",
      "set": 1,
      "name": "Ruby Bloom",
      "preferredColors": [
        "green",
        "purple",
        "black"
      ],
      "thesis": "Turn deliberate end positions and collection milestones into recurring rubies and droplet growth.",
      "counterweight": "Low early movement and strict end-position requirements."
    },
    {
      "id": "set1-ember-resonance",
      "set": 1,
      "name": "Ember Resonance",
      "preferredColors": [
        "red",
        "orange",
        "yellow"
      ],
      "thesis": "Build Brimstone density so Bloodthorn produces immediate movement spikes.",
      "counterweight": "Needs two ingredient families and sacrifices defensive purchases."
    }
  ],
  "2": [
    {
      "id": "set2-protected-surge",
      "set": 2,
      "name": "Protected Surge",
      "preferredColors": [
        "blue",
        "yellow",
        "red"
      ],
      "thesis": "Use protection and multiplication to support volatile high-value draws.",
      "counterweight": "Draw order can waste the multiplier or the protection."
    },
    {
      "id": "set2-adaptive-harvest",
      "set": 2,
      "name": "Adaptive Harvest",
      "preferredColors": [
        "green",
        "red",
        "blue"
      ],
      "thesis": "Convert precise green endings into ingredients while deferred red placement preserves flexibility.",
      "counterweight": "Several payoffs arrive only after brewing ends."
    },
    {
      "id": "set2-transmutation",
      "set": 2,
      "name": "Mire Transmutation",
      "preferredColors": [
        "purple",
        "green",
        "black"
      ],
      "thesis": "Invest in a slow purple engine that exchanges concentration for tailored bag growth.",
      "counterweight": "Late unlock, high cost, and weaker early rounds."
    }
  ],
  "3": [
    {
      "id": "set3-position-bloom",
      "set": 3,
      "name": "Position Bloom",
      "preferredColors": [
        "purple",
        "red",
        "orange"
      ],
      "thesis": "Use reliable movement and Voidshard resonance to reach purple's higher scoring bands.",
      "counterweight": "It forgoes pressure protection and must judge the stopping point carefully."
    },
    {
      "id": "set3-exact-seven",
      "set": 3,
      "name": "Sevenfold Resonance",
      "preferredColors": [
        "green",
        "red",
        "yellow"
      ],
      "thesis": "Use pressure capacity and Voidshard adjacency to engineer an exact-seven movement burst.",
      "counterweight": "Its highest payoff depends on a narrow pressure window."
    },
    {
      "id": "set3-ruby-lattice",
      "set": 3,
      "name": "Ruby Lattice",
      "preferredColors": [
        "blue",
        "green",
        "black"
      ],
      "thesis": "Stack ruby-space rewards while Shadowmoss contests rival engines.",
      "counterweight": "Board-space variance and opponent black-chip investment can suppress value."
    }
  ],
  "4": [
    {
      "id": "set4-whitefire",
      "set": 4,
      "name": "Whitefire",
      "preferredColors": [
        "red",
        "yellow",
        "purple"
      ],
      "thesis": "Accelerate white chips, scale repeated yellow draws, then refine weak chips.",
      "counterweight": "The same acceleration can push pressure over the shatter line."
    },
    {
      "id": "set4-ruby-pilgrimage",
      "set": 4,
      "name": "Ruby Pilgrimage",
      "preferredColors": [
        "blue",
        "green",
        "black"
      ],
      "thesis": "Earn prestige on ruby spaces and convert spare rubies into permanent starting distance.",
      "counterweight": "Rubies are contested between progress, flask recovery, and scoring setup."
    },
    {
      "id": "set4-refined-tempo",
      "set": 4,
      "name": "Refined Tempo",
      "preferredColors": [
        "purple",
        "yellow",
        "blue"
      ],
      "thesis": "Use yellow tempo for current rounds while purple upgrades improve every later draw.",
      "counterweight": "Late purple access leaves little time for upgrades to repay their cost."
    }
  ]
};
