### chain/helpers/   
- stateTransitionHelpers.ts
>
    export function hash(value: bytes): bytes32 {
    }
>
    export function intToBytes(value: BN | number, length: number): bytes {}
>
    export function slotToEpoch(slot: Slot): Epoch {}
>
    export function getCurrentEpoch(state: BeaconState): Epoch {}
>
    export function getPreviousEpoch(state: BeaconState): Epoch {}
>
    export function getEpochStartSlot(epoch: Epoch): Slot {}
>
    export function isActiveValidator(validator: Validator, epoch: Epoch): boolean {
    return validator.activationEpoch <= epoch && epoch < validator.exitEpoch;
    }
>
    export function getActiveValidatorIndices(validators: Validator[], epoch: Epoch): ValidatorIndex[] {
      return validators.reduce((accumulator: ValidatorIndex[], validator: Validator, index: int) => {
        return isActiveValidator(validator, epoch)
          ? [...accumulator, index]
          : accumulator;
      }, []);
    }
>
    function shuffle<T>(values: T[], seed: bytes32): T[] {}
>
    export function split<T>(values: T[], splitCount: int): T[][] {}
>
    export function getEpochCommitteeCount(activeValidatorCount: int): int {
      return Math.max(
        1,
        Math.min(
          Math.floor(SHARD_COUNT / SLOTS_PER_EPOCH),
          Math.floor(Math.floor(activeValidatorCount / SLOTS_PER_EPOCH) / TARGET_COMMITTEE_SIZE),
        ),
      ) * SLOTS_PER_EPOCH;
    }
>
    export function getShuffling(seed: bytes32, validators: Validator[], slot: Slot): ValidatorIndex[][] {
      // Normalizes slot to start of epoch boundary
      const slotAtEpoch = slot - slot % SLOTS_PER_EPOCH;

      const activeValidatorIndices = getActiveValidatorIndices(validators, slotAtEpoch);

      const committeesPerSlot = getEpochCommitteeCount(activeValidatorIndices.length);

      // TODO fix below
      // Shuffle
      // const proposedSeed = Buffer.from(slot);
      // const newSeed = seed ^ seedY;
      // const shuffledActiveValidatorIndices = shuffle(activeValidatorIndices, newSeed);
      const shuffledActiveValidatorIndices = shuffle(activeValidatorIndices, seed);

      // Split the shuffle list into SLOTS_PER_EPOCH * committeesPerSlot pieces
      return split(shuffledActiveValidatorIndices, committeesPerSlot * SLOTS_PER_EPOCH);
    }
> TODO skipped some functions from there
> 
    export function getCrosslinkCommitteesAtSlot(state: BeaconState, slot: Slot, registryChange: boolean = false): CrosslinkCommittee[] {}
> in getCrosslinkCommitteeAtSlot()
>
> 
    export function getBeaconProposerIndex(state: BeaconState, slot: Slot): int {
      const firstCommittee = getCrosslinkCommitteesAtSlot(state, slot)[0].validatorIndices;
      return firstCommittee[slot % firstCommittee.length];
    }
    
>An entry or exit triggered in the epoch given by the input takes effect at the epoch given by the output.
 
    export function getEntryExitEffectEpoch(epoch: Epoch): Epoch {
    return epoch + 1 + ACTIVATION_EXIT_DELAY;
    }

    
- validatorStatus.ts
    
    
    export function exitValidator(state: BeaconState, index: ValidatorIndex): void {}
>in `exitValidator()`
    
    const entryExitEffectEpoch = getEntryExitEffectEpoch(getCurrentEpoch(state));
>>validators of some epoch can exit after some epoches
>>
  
    if (validator.exitEpoch <= entryExitEffectEpoch{return;}
>> the case validator has exited

    validator.exitEpoch = entryExitEffectEpoch;
>> otherwise, wait some epoches then exit

    
    export function slashValidator(state: BeaconState, index: ValidatorIndex): void {}
    
>in `slashValidator()`

    assert(state.slot < getEpochStartSlot(validator.withdrawalEpoch));
>>`validator.withdrawalEpoch` Epoch when validator is eligible to withdraw
>>slash before validator withdraw
    
    exitValidator(state, index);
>> set `validator.exitEpoch`




