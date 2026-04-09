import { PlayerSchema } from "../schema/PlayerSchema";
import { addToInventory, countInventory } from "../schema/InventorySchema";
import { getQuest, getAvailableQuests, QUESTS } from "../data/quests";
import { CraftingSystem } from "./CraftingSystem";
import { EnergySystem } from "./EnergySystem";
import { QuestDefinition, QuestObjective, XP_PER_LEVEL } from "../types";

export interface QuestProgressMap {
  [questId: string]: {
    [objectiveIndex: number]: number; // current progress count
  };
}

/**
 * QuestSystem manages quest state, progress tracking, and reward distribution.
 */
export class QuestSystem {
  /**
   * Parse the player's quest progress JSON.
   */
  static getProgress(player: PlayerSchema): QuestProgressMap {
    try {
      return JSON.parse(player.questProgressJson || "{}");
    } catch {
      return {};
    }
  }

  /**
   * Save progress map back to the player's schema.
   */
  static saveProgress(player: PlayerSchema, progress: QuestProgressMap): void {
    player.questProgressJson = JSON.stringify(progress);
  }

  /**
   * Get array of active quest ids.
   */
  static getActiveQuestIds(player: PlayerSchema): string[] {
    return player.activeQuestIds ? player.activeQuestIds.split(",").filter(Boolean) : [];
  }

  /**
   * Get array of completed quest ids.
   */
  static getCompletedQuestIds(player: PlayerSchema): string[] {
    return player.completedQuestIds
      ? player.completedQuestIds.split(",").filter(Boolean)
      : [];
  }

  /**
   * Accept a quest. Returns false if not available or already active/completed.
   */
  static acceptQuest(
    player: PlayerSchema,
    questId: string
  ): { success: boolean; error?: string } {
    let quest: QuestDefinition;
    try {
      quest = getQuest(questId);
    } catch {
      return { success: false, error: "Unknown quest." };
    }

    if (player.level < quest.requiredLevel) {
      return {
        success: false,
        error: `You need to be level ${quest.requiredLevel} to start this quest.`,
      };
    }

    const activeIds = QuestSystem.getActiveQuestIds(player);
    const completedIds = QuestSystem.getCompletedQuestIds(player);

    if (activeIds.includes(questId)) {
      return { success: false, error: "Quest is already active." };
    }
    if (completedIds.includes(questId)) {
      return { success: false, error: "Quest already completed." };
    }

    // Check prerequisites
    for (const prereqId of quest.prerequisiteQuestIds) {
      if (!completedIds.includes(prereqId)) {
        return { success: false, error: "Prerequisites not met." };
      }
    }

    activeIds.push(questId);
    player.activeQuestIds = activeIds.join(",");

    // Initialize progress for each objective
    const progress = QuestSystem.getProgress(player);
    if (!progress[questId]) {
      progress[questId] = {};
      quest.objectives.forEach((_, i) => {
        progress[questId][i] = 0;
      });
    }
    QuestSystem.saveProgress(player, progress);

    return { success: true };
  }

  /**
   * Update progress for a specific action type across all active quests.
   * Called by the game room on relevant player actions.
   */
  static updateProgress(
    player: PlayerSchema,
    actionType: QuestObjective["type"],
    itemId?: string,
    quantity: number = 1
  ): string[] {
    const activeIds = QuestSystem.getActiveQuestIds(player);
    const progress = QuestSystem.getProgress(player);
    const readyToComplete: string[] = [];

    for (const questId of activeIds) {
      let quest: QuestDefinition;
      try {
        quest = getQuest(questId);
      } catch {
        continue;
      }

      let updated = false;
      quest.objectives.forEach((objective, i) => {
        if (objective.type !== actionType) return;

        // For item-based objectives, match itemId
        if (objective.itemId && objective.itemId !== itemId) return;

        if (!progress[questId]) progress[questId] = {};
        progress[questId][i] = (progress[questId][i] ?? 0) + quantity;
        updated = true;
      });

      if (updated) {
        // Check if all objectives are complete
        const allDone = quest.objectives.every((obj, i) => {
          const current = progress[questId]?.[i] ?? 0;
          const required = obj.quantity ?? obj.targetLevel ?? 1;
          return current >= required;
        });

        if (allDone) {
          readyToComplete.push(questId);
        }
      }
    }

    QuestSystem.saveProgress(player, progress);
    return readyToComplete;
  }

  /**
   * Update level-based quest objectives when a player levels up.
   */
  static onLevelUp(player: PlayerSchema): string[] {
    return QuestSystem.updateProgress(player, "reach_level", undefined, player.level);
  }

  /**
   * Claim rewards for a completed quest.
   * Removes from active, adds to completed, grants rewards.
   */
  static claimReward(
    player: PlayerSchema,
    questId: string
  ): { success: boolean; error?: string; reward?: QuestDefinition["rewards"] } {
    let quest: QuestDefinition;
    try {
      quest = getQuest(questId);
    } catch {
      return { success: false, error: "Unknown quest." };
    }

    // Verify quest is actually complete
    const progress = QuestSystem.getProgress(player);
    const allDone = quest.objectives.every((obj, i) => {
      const current = progress[questId]?.[i] ?? 0;
      const required = obj.quantity ?? obj.targetLevel ?? 1;
      return current >= required;
    });

    if (!allDone) {
      return { success: false, error: "Quest objectives not yet complete." };
    }

    // Remove from active
    const activeIds = QuestSystem.getActiveQuestIds(player);
    const newActive = activeIds.filter((id) => id !== questId);
    player.activeQuestIds = newActive.join(",");

    // Add to completed
    const completedIds = QuestSystem.getCompletedQuestIds(player);
    if (!completedIds.includes(questId)) {
      completedIds.push(questId);
    }
    player.completedQuestIds = completedIds.join(",");

    // Grant rewards
    const { rewards } = quest;

    if (rewards.silver) {
      player.silver += rewards.silver;
    }

    if (rewards.xp) {
      QuestSystem.addXP(player, rewards.xp);
    }

    if (rewards.blueprintIds) {
      for (const bpId of rewards.blueprintIds) {
        CraftingSystem.grantBlueprint(player, bpId);
      }
    }

    if (rewards.itemRewards) {
      for (const itemStack of rewards.itemRewards) {
        addToInventory(player.inventory, itemStack.itemId, itemStack.quantity);
      }
    }

    return { success: true, reward: rewards };
  }

  /**
   * Add XP to a player, handling level ups.
   * Returns the new level if leveled up, otherwise undefined.
   */
  static addXP(player: PlayerSchema, amount: number): number | undefined {
    player.xp += amount;
    let leveledUp = false;

    while (player.xp >= player.xpToNextLevel) {
      player.xp -= player.xpToNextLevel;
      player.level += 1;
      player.xpToNextLevel = player.level * XP_PER_LEVEL;
      leveledUp = true;

      // Update energy on level up
      EnergySystem.onLevelUp(player);

      // Check level-based quest progress
      QuestSystem.onLevelUp(player);
    }

    return leveledUp ? player.level : undefined;
  }

  /**
   * Get available quests for a player (not yet active/completed, prereqs met).
   */
  static getAvailableForPlayer(player: PlayerSchema): QuestDefinition[] {
    const completedIds = QuestSystem.getCompletedQuestIds(player);
    const activeIds = QuestSystem.getActiveQuestIds(player);

    return getAvailableQuests(player.level, completedIds).filter(
      (q) => !activeIds.includes(q.id)
    );
  }

  /**
   * Get active quests with current progress.
   */
  static getActiveWithProgress(
    player: PlayerSchema
  ): Array<{ quest: QuestDefinition; progress: number[] }> {
    const activeIds = QuestSystem.getActiveQuestIds(player);
    const progressMap = QuestSystem.getProgress(player);

    return activeIds
      .map((questId) => {
        let quest: QuestDefinition | undefined;
        try {
          quest = getQuest(questId);
        } catch {
          return null;
        }
        const progress = quest.objectives.map((_, i) => progressMap[questId]?.[i] ?? 0);
        return { quest, progress };
      })
      .filter(Boolean) as Array<{ quest: QuestDefinition; progress: number[] }>;
  }
}
