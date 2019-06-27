#### index.ts
>state transition
>
    export function executeStateTransition(state: BeaconState, block: BeaconBlock | null, prevBlockRoot: bytes32): BeaconState {
    processSlot(state, prevBlockRoot);
    if (block) {
        processBlock(state, block);
    }
    if (shouldProcessEpoch(state)) {
        processEpoch(state);
    }
    return state;
    }
>>process slot --> block --> epoch