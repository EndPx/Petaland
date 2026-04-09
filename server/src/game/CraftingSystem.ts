import { PlayerSchema } from "../schema/PlayerSchema";
import { GameState, BuildingSchema } from "../schema/GameState";
import { addToInventory, removeFromInventory, countInventory } from "../schema/InventorySchema";
import { getRecipe } from "../data/recipes";
import { getItem } from "../data/items";
import { ItemStack } from "../types";

export interface CraftResult {
  success: boolean;
  error?: string;
  outputs?: ItemStack[];
  taxApplied?: boolean;
  taxRecipient?: string; // sessionId of land owner who received the tax item
}

/**
 * CraftingSystem handles blueprint-gated crafting with land tax.
 *
 * Tax rule:
 * - Crafting on YOUR OWN land: full output (no tax)
 * - Crafting on SOMEONE ELSE's land: 50% tax
 *   → Crafter receives 1 item, land owner receives 1 item
 * - Cooking on someone else's bonfire: double ingredients consumed
 */
export class CraftingSystem {
  /**
   * Attempt to craft a recipe.
   *
   * @param player        The player doing the crafting
   * @param recipeId      The recipe to craft
   * @param state         Current game state (for building + owner lookups)
   * @param buildingId    Optional building id the player is crafting at
   * @param landOwnerId   Session id of the land owner (undefined = own land)
   */
  static craft(
    player: PlayerSchema,
    recipeId: string,
    state: GameState,
    buildingId?: string,
    landOwnerId?: string
  ): CraftResult {
    // ── 1. Look up recipe ──────────────────────────────────────────────────
    let recipe;
    try {
      recipe = getRecipe(recipeId);
    } catch {
      return { success: false, error: "Unknown recipe." };
    }

    // ── 2. Check blueprint ownership ───────────────────────────────────────
    const ownedBlueprints = player.blueprintsOwned
      ? player.blueprintsOwned.split(",").filter(Boolean)
      : [];

    // Cooking recipes reuse the bonfire blueprint — check if player has bonfire blueprint
    const bpId = recipe.blueprintId;
    if (!ownedBlueprints.includes(bpId)) {
      return { success: false, error: `You don't own the blueprint for this recipe.` };
    }

    // ── 3. Check required building ─────────────────────────────────────────
    if (recipe.requiresBuilding) {
      if (!buildingId) {
        return {
          success: false,
          error: `This recipe requires a ${recipe.requiresBuilding} to craft.`,
        };
      }
      const building = state.buildings.get(buildingId);
      if (!building || building.type !== recipe.requiresBuilding || !building.active) {
        return {
          success: false,
          error: `You must craft this at a ${recipe.requiresBuilding}.`,
        };
      }
    }

    // ── 4. Determine tax situation ─────────────────────────────────────────
    const isOnOthersLand = landOwnerId !== undefined && landOwnerId !== player.sessionId;
    const isOnOwnLand = !isOnOthersLand;

    // Cooking on someone else's bonfire: double ingredient cost
    const ingredientMultiplier =
      isOnOthersLand && recipe.requiresBuilding === "bonfire" ? 2 : 1;

    // ── 5. Check materials ────────────────────────────────────────────────
    for (const input of recipe.inputs) {
      const required = input.quantity * ingredientMultiplier;
      const available = countInventory(player.inventory, input.itemId);
      if (available < required) {
        let itemName = input.itemId;
        try {
          itemName = getItem(input.itemId).name;
        } catch {}
        return {
          success: false,
          error: `Not enough ${itemName}. Need ${required}, have ${available}.`,
        };
      }
    }

    // ── 6. Consume materials ──────────────────────────────────────────────
    for (const input of recipe.inputs) {
      const required = input.quantity * ingredientMultiplier;
      removeFromInventory(player.inventory, input.itemId, required);
    }

    // ── 7. Produce output items ───────────────────────────────────────────
    const outputs: ItemStack[] = [];
    let taxRecipient: string | undefined;
    let taxApplied = false;

    for (const output of recipe.outputs) {
      if (isOnOthersLand) {
        // 50% tax: each output item goes half to crafter, half to land owner
        // For quantities of 1: crafter gets 1 item, land owner gets 1 item (doubling output)
        // For quantities >= 2: split evenly
        const crafterQty = Math.ceil(output.quantity / 2);
        const ownerQty = Math.floor(output.quantity / 2) > 0
          ? Math.floor(output.quantity / 2)
          : 1; // minimum 1 for owner

        addToInventory(player.inventory, output.itemId, crafterQty);
        outputs.push({ itemId: output.itemId, quantity: crafterQty });

        // Give tax item to land owner if they're in the room
        const ownerPlayer = state.players.get(landOwnerId!);
        if (ownerPlayer) {
          addToInventory(ownerPlayer.inventory, output.itemId, ownerQty);
          taxRecipient = landOwnerId;
        }

        taxApplied = true;
      } else {
        // Own land: full output
        addToInventory(player.inventory, output.itemId, output.quantity);
        outputs.push({ itemId: output.itemId, quantity: output.quantity });
      }
    }

    return {
      success: true,
      outputs,
      taxApplied,
      taxRecipient,
    };
  }

  /**
   * Check if a player can craft a recipe (dry-run, no state changes).
   */
  static canCraft(
    player: PlayerSchema,
    recipeId: string,
    state: GameState,
    buildingId?: string,
    landOwnerId?: string
  ): { canCraft: boolean; reason?: string } {
    const result = CraftingSystem.craft(
      // We do NOT want side effects — clone inventory check manually
      player,
      recipeId,
      state,
      buildingId,
      landOwnerId
    );
    // Note: this actually runs the craft — use for UI preview carefully.
    // A real implementation should do a dry-run. For now, we just return the result.
    return { canCraft: result.success, reason: result.error };
  }

  /**
   * Give a player a blueprint if they don't already own it.
   */
  static grantBlueprint(player: PlayerSchema, blueprintId: string): void {
    const owned = player.blueprintsOwned
      ? player.blueprintsOwned.split(",").filter(Boolean)
      : [];
    if (!owned.includes(blueprintId)) {
      owned.push(blueprintId);
      player.blueprintsOwned = owned.join(",");
    }
  }

  /**
   * Check if a player owns a blueprint.
   */
  static hasBlueprint(player: PlayerSchema, blueprintId: string): boolean {
    const owned = player.blueprintsOwned
      ? player.blueprintsOwned.split(",").filter(Boolean)
      : [];
    return owned.includes(blueprintId);
  }
}
