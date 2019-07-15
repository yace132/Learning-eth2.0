#### index.ts
>
	export function processEpoch(state: BeaconState): BeaconState {

	  processJustificationAndFinalization(state);

	  processCrosslinks(state);

	  processRewardsAndPenalties(state);

	  processRegistryUpdates(state);

	  processSlashings(state);

	  processFinalUpdates(state);

	  return state;
	}
