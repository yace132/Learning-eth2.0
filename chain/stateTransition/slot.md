#### slot.ts
> Process slots up to `slot`
>
	export function processSlots(state: BeaconState, slot: Slot): void{
	  assert(state.slot <= slot);

	  while (state.slot < slot){
		processSlot(state);
		if ((state.slot + 1) % SLOTS_PER_EPOCH === 0){
		  processEpoch(state);
		}
		state.slot++;
	  }
	}
1. Cache state
2. Process next epoch
	e.g. epoch 3 ( slot 192 ) is processed in processSlots(192)
3. Advance slot
	Notice that, after v7, when we process epoch, `state.slot` hasn't updated
	e.g. In epoch 3, we access epoch 2 
	b/c `state.slot` = 191, when we compute currentEpoch, we get 2

> Cache state root and block root

	function processSlot(state: BeaconState): void {
	  const previousStateRoot = hashTreeRoot(state, BeaconState);
	  state.latestStateRoots[state.slot % SLOTS_PER_HISTORICAL_ROOT] = previousStateRoot;

	  if (state.latestBlockHeader.stateRoot.equals(ZERO_HASH)) {
		state.latestBlockHeader.stateRoot = previousStateRoot;
	  }

	  const previousBlockRoot = signingRoot(state.latestBlockHeader, BeaconBlockHeader);
	  state.latestBlockRoots[state.slot % SLOTS_PER_HISTORICAL_ROOT] = previousBlockRoot;
	}