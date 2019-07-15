#### index.ts
>
	export function stateTransition(
	  state: BeaconState, block: BeaconBlock,
	  validateStateRoot = false,
	  verifySignatures = true
	): BeaconState {
		processSlots(state, block.slot);
		processBlock(state, block, verifySignatures);
		if (validateStateRoot){
		assert(block.stateRoot.equals(hashTreeRoot(state, BeaconState))
		}
		return state;
	}
>> proccessEpoch() moves into processSlots
