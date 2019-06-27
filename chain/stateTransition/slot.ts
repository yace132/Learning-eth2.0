#### slot.ts
> 
    export function processSlot(state: BeaconState, prevBlockRoot: bytes32): BeaconState {
    }
>> Per-slot processing (with some state caching)

>
> in function processSlot()
> 
    state.slot++;
>> Per-slot processing

>State caching
>
      state.latestBlockRoots[(state.slot - 1) % LATEST_BLOCK_ROOTS_LENGTH] = prevBlockRoot;
      if (state.slot % LATEST_BLOCK_ROOTS_LENGTH === 0) {
        state.batchedBlockRoots.push(merkleRoot(state.latestBlockRoots));
      }
      return state;
>> maybe State caching of spec (we also need to cache state)
>> TODO: Why add root to state.batchedBlockRoots here?