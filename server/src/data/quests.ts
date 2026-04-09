import { QuestDefinition } from "../types";

/**
 * All quest definitions for Petaland.
 * The first quest chain introduces new players to the game loop.
 */
export const QUESTS: Record<string, QuestDefinition> = {
  // ── Starter Quest Chain ───────────────────────────────────────────────────
  quest_gather_carrots: {
    id: "quest_gather_carrots",
    title: "Wild Harvest",
    description:
      'The village elder says: "The fields are full of wild carrots. Gather 5 and bring them to me!"',
    requiredLevel: 1,
    objectives: [
      {
        type: "gather",
        itemId: "wild_carrot",
        quantity: 5,
        description: "Gather 5 Wild Carrots from the world",
      },
    ],
    rewards: {
      silver: 50,
      xp: 30,
      blueprintIds: ["bp_soil_bed", "bp_workbench", "bp_storage_box"],
      itemRewards: [{ itemId: "seed_carrot", quantity: 5 }],
    },
    prerequisiteQuestIds: [],
  },

  quest_craft_soil_bed: {
    id: "quest_craft_soil_bed",
    title: "Lay the Groundwork",
    description:
      'The farmer says: "Before you can plant crops, you need a proper soil bed. Craft one and place it!"',
    requiredLevel: 1,
    objectives: [
      {
        type: "craft",
        itemId: "soil_bed",
        quantity: 1,
        description: "Craft 1 Soil Bed",
      },
    ],
    rewards: {
      silver: 30,
      xp: 40,
      itemRewards: [
        { itemId: "seed_wheat", quantity: 10 },
        { itemId: "seed_carrot", quantity: 5 },
      ],
    },
    prerequisiteQuestIds: ["quest_gather_carrots"],
  },

  quest_first_harvest: {
    id: "quest_first_harvest",
    title: "First Harvest",
    description:
      'The farmer says: "Excellent! Now plant some seeds and harvest your very first crops!"',
    requiredLevel: 1,
    objectives: [
      {
        type: "gather",
        itemId: "carrot",
        quantity: 3,
        description: "Harvest 3 Carrots from your soil bed",
      },
    ],
    rewards: {
      silver: 50,
      xp: 50,
      blueprintIds: ["bp_bonfire"],
      itemRewards: [{ itemId: "seed_potato", quantity: 5 }],
    },
    prerequisiteQuestIds: ["quest_craft_soil_bed"],
  },

  quest_light_a_fire: {
    id: "quest_light_a_fire",
    title: "Light a Fire",
    description:
      'The cook says: "You must be hungry from all that farming! Build a bonfire and cook something to eat."',
    requiredLevel: 1,
    objectives: [
      {
        type: "build",
        itemId: "bonfire",
        quantity: 1,
        description: "Place a Bonfire on your land",
      },
      {
        type: "craft",
        itemId: "roasted_carrot",
        quantity: 1,
        description: "Cook 1 Roasted Carrot",
      },
    ],
    rewards: {
      silver: 80,
      xp: 60,
      blueprintIds: ["bp_fence"],
    },
    prerequisiteQuestIds: ["quest_first_harvest"],
  },

  quest_wood_and_stone: {
    id: "quest_wood_and_stone",
    title: "Gather Resources",
    description:
      'The builder says: "To expand your farm you\'ll need wood and stone. Gather plenty of both!"',
    requiredLevel: 2,
    objectives: [
      {
        type: "gather",
        itemId: "wood",
        quantity: 20,
        description: "Gather 20 Wood",
      },
      {
        type: "gather",
        itemId: "stone",
        quantity: 15,
        description: "Gather 15 Stone",
      },
    ],
    rewards: {
      silver: 100,
      xp: 80,
      blueprintIds: ["bp_plank", "bp_rope"],
    },
    prerequisiteQuestIds: ["quest_light_a_fire"],
  },

  quest_craft_materials: {
    id: "quest_craft_materials",
    title: "Crafting Materials",
    description:
      'The craftsman says: "Raw materials won\'t get you far. Process them into something useful!"',
    requiredLevel: 2,
    objectives: [
      {
        type: "craft",
        itemId: "plank",
        quantity: 5,
        description: "Craft 5 Planks",
      },
      {
        type: "craft",
        itemId: "rope",
        quantity: 3,
        description: "Craft 3 Rope",
      },
    ],
    rewards: {
      silver: 120,
      xp: 100,
      blueprintIds: ["bp_well", "bp_scarecrow"],
    },
    prerequisiteQuestIds: ["quest_wood_and_stone"],
  },

  quest_reach_level_5: {
    id: "quest_reach_level_5",
    title: "Rising Farmer",
    description:
      'The guild leader says: "Keep farming, crafting, and questing. Prove yourself by reaching Level 5!"',
    requiredLevel: 1,
    objectives: [
      {
        type: "reach_level",
        targetLevel: 5,
        description: "Reach Level 5",
      },
    ],
    rewards: {
      silver: 300,
      xp: 0,
      blueprintIds: ["bp_sawmill", "bp_furnace", "bp_loom", "bp_anvil"],
    },
    prerequisiteQuestIds: ["quest_craft_materials"],
  },

  quest_smelt_iron: {
    id: "quest_smelt_iron",
    title: "Iron Age",
    description:
      'The blacksmith says: "Real craftsmen work with iron. Build a furnace and smelt your first bars!"',
    requiredLevel: 5,
    objectives: [
      {
        type: "build",
        itemId: "furnace",
        quantity: 1,
        description: "Place a Furnace on your land",
      },
      {
        type: "craft",
        itemId: "iron_bar",
        quantity: 5,
        description: "Smelt 5 Iron Bars",
      },
    ],
    rewards: {
      silver: 400,
      xp: 200,
      blueprintIds: ["bp_iron_bar"],
    },
    prerequisiteQuestIds: ["quest_reach_level_5"],
  },

  quest_reach_level_10: {
    id: "quest_reach_level_10",
    title: "Master Artisan",
    description:
      'The grand architect says: "You\'ve come so far. Reach Level 10 and unlock the rarest buildings!"',
    requiredLevel: 5,
    objectives: [
      {
        type: "reach_level",
        targetLevel: 10,
        description: "Reach Level 10",
      },
    ],
    rewards: {
      silver: 1000,
      xp: 0,
      blueprintIds: ["bp_bakery", "bp_brewery", "bp_jeweler_table"],
    },
    prerequisiteQuestIds: ["quest_smelt_iron"],
  },

  // ── Daily / Repeatable Quests ─────────────────────────────────────────────
  quest_daily_sell_crops: {
    id: "quest_daily_sell_crops",
    title: "Market Day",
    description: 'The merchant says: "The market needs fresh crops! Sell 10 crops to the NPC shop today."',
    requiredLevel: 1,
    objectives: [
      {
        type: "deliver",
        itemId: "carrot",
        quantity: 10,
        description: "Sell 10 Carrots to the NPC shop",
      },
    ],
    rewards: {
      silver: 60,
      xp: 40,
    },
    prerequisiteQuestIds: [],
  },

  quest_daily_fish: {
    id: "quest_daily_fish",
    title: "The Daily Catch",
    description: 'The fisherman says: "I need 5 fish for today\'s stew. Can you catch them?"',
    requiredLevel: 3,
    objectives: [
      {
        type: "gather",
        itemId: "fish",
        quantity: 5,
        description: "Catch 5 Fish",
      },
    ],
    rewards: {
      silver: 80,
      xp: 50,
    },
    prerequisiteQuestIds: [],
  },

  quest_daily_cook: {
    id: "quest_daily_cook",
    title: "Feed the Village",
    description: 'The innkeeper says: "The village is hungry! Cook 3 hearty meals for us."',
    requiredLevel: 2,
    objectives: [
      {
        type: "craft",
        itemId: "baked_potato",
        quantity: 3,
        description: "Cook 3 Baked Potatoes",
      },
    ],
    rewards: {
      silver: 70,
      xp: 45,
    },
    prerequisiteQuestIds: [],
  },
};

export function getQuest(id: string): QuestDefinition {
  const quest = QUESTS[id];
  if (!quest) throw new Error(`Unknown quest id: ${id}`);
  return quest;
}

/** Return quests available to a player at a given level with completed prerequisites */
export function getAvailableQuests(
  playerLevel: number,
  completedQuestIds: string[]
): QuestDefinition[] {
  return Object.values(QUESTS).filter((quest) => {
    if (quest.requiredLevel > playerLevel) return false;
    for (const prereqId of quest.prerequisiteQuestIds) {
      if (!completedQuestIds.includes(prereqId)) return false;
    }
    return true;
  });
}

/** Seed crop grow times in ms (used by plant handler) */
export const SEED_GROW_TIMES: Record<string, number> = {
  seed_wheat: 5 * 60 * 1000,   // 5 min
  seed_carrot: 4 * 60 * 1000,  // 4 min
  seed_potato: 6 * 60 * 1000,  // 6 min
  seed_tomato: 8 * 60 * 1000,  // 8 min
  seed_sunflower: 10 * 60 * 1000, // 10 min
};

/** What each seed produces when harvested */
export const SEED_HARVEST_MAP: Record<string, { itemId: string; quantity: number }> = {
  seed_wheat: { itemId: "wheat", quantity: 3 },
  seed_carrot: { itemId: "carrot", quantity: 2 },
  seed_potato: { itemId: "potato", quantity: 2 },
  seed_tomato: { itemId: "tomato", quantity: 3 },
  seed_sunflower: { itemId: "sunflower", quantity: 2 },
};
