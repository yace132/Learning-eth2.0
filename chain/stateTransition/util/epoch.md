#### epoch.ts
>
    export function slotToEpoch(slot: Slot): Epoch {
        return Math.floor(slot / SLOTS_PER_EPOCH);
    }
>> slot 0,1,2,..., 63 --> 0th epoch
>> slot 64,65,66,...,127 --> 1st epoch 
>
    export function getPreviousEpoch(state: BeaconState): Epoch {
      const currentEpoch = getCurrentEpoch(state);
      if (currentEpoch === GENESIS_EPOCH) {
        return GENESIS_EPOCH;
      }
      return currentEpoch - 1;
    }
    
>
    export function getCurrentEpoch(state: BeaconState): Epoch {
      return slotToEpoch(state.slot);
    }
>
    export function getEpochStartSlot(epoch: Epoch): Slot{
        return epoch * SLOTS_PER_EPOCH;
    }
>
	export function getDelayedActivationExitEpoch(epoch: Epoch): Epoch {
	  return epoch + 1 + ACTIVATION_EXIT_DELAY;
	}
>> delay `ACTIVATION_EXIT_DELAY`=4 epochs then activate or exit 