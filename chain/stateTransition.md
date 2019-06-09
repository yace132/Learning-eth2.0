# chain/stateTransition/


# Learn ChainSafe's eth2.0


## Docs :memo:
### chain/stateTransition/   
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
#### slot.ts
> 
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
>

#### block/
- index.ts


    export default function processBlock(state: BeaconState, block: BeaconBlock): void {
    // Slot
    assert(block.slot === state.slot, "block root must equal state root");
    
    // Proposer signature
    processProposerSignature(state, block);
    
    // RANDAO
    processRandao(state, block);

    // Eth1 Data
    processEth1Data(state, block);

    // Transactions

    // Proposer slashings
    processProposerSlashings(state, block);

    // Attester slashings
    processAttesterSlashings(state, block);

    // Attestations
    processAttestations(state, block);

    // Deposits
    processDeposits(state, block);

    // Voluntary Exits
    processVoluntaryExits(state, block);

    // Transfers
    processTransfers(state, block);
    }
> in processBlock()
> 
    // Slot
    assert(block.slot === state.slot, "block root must equal state root");
>> The state is input of processBlock, so this is the previous state
>> But the block is the new block
>> So LHS should not be equal to RHS?

- proposerSignature.ts

    
    export default function processProposerSignature(state: BeaconState, block: BeaconBlock): void {}
>
      const b: BeaconBlock = {
        ...block,
        signature: EMPTY_SIGNATURE,
      };
>> "..." is [spread operator](https://basarat.gitbooks.io/typescript/docs/spread-operator.html) of typescript
>> add EMPTY_SIGNATURE to block
>> so it would be accepted by hashTreeRoot() function
>
      const blockWithoutSignatureRoot: bytes32 = hashTreeRoot(b, BeaconBlock);
>> get b's root
>
      const p: ProposalSignedData = {
        slot: state.slot,
        shard: 2**32, // TODO this will get removed in update to more recent spec
        blockRoot: blockWithoutSignatureRoot,
      };
      const proposalRoot = hashTreeRoot(p, ProposalSignedData);
>> validator sign slot and blockRoot

      const blockSignatureVerified = blsVerify( state.validatorRegistry[getBeaconProposerIndex(state, state.slot)].pubkey,
        proposalRoot,
        block.signature,
        getDomain(state.fork, getCurrentEpoch(state), Domain.PROPOSAL),
      );

      assert(blockSignatureVerified);
>> verify signatures
>> content is proposalRoot
>> signature is block.signature
>> notice the validators for this block
- randao.ts


    export default function processRandao(state: BeaconState, block: BeaconBlock): void {}
> in processRandao()
    
    const currentEpoch = getCurrentEpoch(state);
    const proposer = state.validatorRegistry[getBeaconProposerIndex(state, state.slot)];
      const randaoRevealVerified = blsVerify(
        proposer.pubkey,
        intToBytes(currentEpoch, 32),
        block.randaoReveal,
        getDomain(state.fork, currentEpoch, Domain.PROPOSAL),
      );
      assert(randaoRevealVerified);
      state.latestRandaoMixes[currentEpoch % LATEST_RANDAO_MIXES_LENGTH] =
        xor(getRandaoMix(state, currentEpoch), hash(block.randaoReveal));
>> `block.randaoReveal` 
>> a signature
>> proposer sign # of epoch as seed of RandaoMixes
>>create a random # for each "slot"
>>genearate proposer for each "slot"
>>for the same epoch, proposers sign same number( current epoch )
>>> so proposer can't sign other # to affect randaoMix 


>> `state.latestRandaoMixes` latest random #s
>>> update every block
>>> for the same epoch, update `state.latestRandaoMixes` of the same index, use last RandaoMixes with same index
>>> for next epoch, update the next element in `state.latestRandaoMixes`

>> `LATEST_RANDAO_MIXES_LENGTH`= 2**13 ~ 8000
>> 

>> decide RandaoMix of `currentEpoch`
>> xor old RandaoMix (of `currentEpoch` k)and `block.randaoReveal`
>> if no `state.latestRandaoMixes`, use `hash(block.randaoReveal)` as seed(xor with 0 is itself) 
- eth1Data.ts
    
    
    export default function processEth1Data(state: BeaconState, block: BeaconBlock): void {}
> in `processEth1Data()`
> `eth1Data` appears in block and votes (recorded in state) 
> `eth1DataVote` calculate all votes as `eth1Data` of block
>
> Also, when there is no such vote, count the block `eth1Data` as 1 vote, add it to `state.eth1DataVotes`
> 
We don't really process the voting logic in this step(that occurs in epoch processsing)

- proposerSlashings.ts
> slash proposer who propose different headers of the same block
> 
    export default function processProposerSlashings(state: BeaconState, block: BeaconBlock): void {}

>
    for (const proposerSlashing of block.body.proposerSlashings)

>> record misbehave proposers to block.body as proposerSlashings       

     assert(slotToEpoch(proposerSlashing.header1.slot) === slotToEpoch(proposerSlashing.header2.slot));
      assert(!serialize(proposerSlashing.header1, BeaconBlockHeader).equals(
        serialize(proposerSlashing.header2, BeaconBlockHeader)));
      assert(isSlashableValidator(proposer, getCurrentEpoch(state)));
>> misbehave proposer give the same epoch with different headers
>> can we punish wrong header or who propose too early?
>> 
    const proposalData1Verified = blsVerify();
    assert(proposalData1Verified);
    const proposalData2Verified = blsVerify();
    assert(proposalData2Verified);
    
>> check the misbehave proposer sign 2 different headers

    slashValidator(state, proposerSlashing.proposerIndex);
    
- attestations.ts
> some words
> 
    export function processAttestation(state: BeaconState, attestation: Attestation): void {}
> 
  
    assert(
    attestationSlot + MIN_ATTESTATION_INCLUSION_DELAY <= state.slot &&
    state.slot <= attestationSlot + SLOTS_PER_EPOCH
    );
>> `MIN_ATTESTATION_INCLUSION_DELAY` 
>>> 4 slots

>> We need to wait before `processAttestation` 
>>> at least 4 slots
    
>> `prcessAttestation` can't be too late
>>> We need to process in 1 epoch (may cross epoch?)
>>> 

    assert((
        currentEpoch === data.targetEpoch &&
        state.currentJustifiedEpoch === data.sourceEpoch &&
        state.currentJustifiedRoot.equals(data.sourceRoot) &&
        hashTreeRoot(state.currentCrosslinks[data.shard], Crosslink).equals(data.previousCrosslinkRoot)
      ) || (
        previousEpoch === data.targetEpoch &&
        state.previousJustifiedEpoch === data.sourceEpoch &&
        state.previousJustifiedRoot.equals(data.sourceRoot) &&
        hashTreeRoot(state.previousCrosslinks[data.shard], Crosslink).equals(data.previousCrosslinkRoot)
      ));
>> what is crosslink?
#### util/
- seed.ts
> choose seed for each epoch
>> 
    export function generateSeed(state: BeaconState, epoch: Epoch): bytes32 {
      return hash(Buffer.concat([
        getRandaoMix(state, epoch + LATEST_RANDAO_MIXES_LENGTH - MIN_SEED_LOOKAHEAD),
        getActiveIndexRoot(state, epoch),
        intToBytes(epoch, 32),
      ]));
    }

1. get the random number of last epoch(latest random number)
>
    export function getRandaoMix(state: BeaconState, epoch: Epoch): bytes32 {
    return state.latestRandaoMixes[epoch % LATEST_RANDAO_MIXES_LENGTH];
    }
>> get random # from latest generated random #s recorded in block(state) 
>> 
>> everyone can do it, just read blockchain data

>>argument `state, epoch + LATEST_RANDAO_MIXES_LENGTH - MIN_SEED_LOOKAHEAD` for last epoch random number
>>
>>Notice that 1 random number for 1 epoch
>>But this random number update for each slot
>>
2. get activate validators of current epoch 
>
    export function getActiveIndexRoot(state: BeaconState, epoch: Epoch): bytes32 {
      return state.latestActiveIndexRoots[epoch % LATEST_ACTIVE_INDEX_ROOTS_LENGTH];
    }
    
>>`LATEST_ACTIVE_INDEX_ROOTS_LENGTH` ~ 8000

>>`latestActiveIndexRoots`
>>> for latest 8000 epoches, records their activate validators (just record the root)
3. convert epoch to 32 bytes
4. hash(1,2,3)
>
>How random seed of this epoch?
>> Even randomMix and activate set repeat, different epoch has different seed.
>> 
>>  Even we predict the activate set of some future epoch E
>>  We can't know E's seed until E's last epoch ends.
>>> If we compute earlier, the randaoMix value is not the same after the E's last epoch, the earlier seed is different and invalid. 

>> differnt activate set produce diffrent seed (is this helpful?) 

- misc.ts
> get proposer of current slot
    export function getBeaconProposerIndex(state: BeaconState): ValidatorIndex {}
>    
        let i = 0;
      while (true) {
        const candidateIndex = firstCommittee[(currentEpoch + i) % firstCommittee.length];
        const randByte = hash(Buffer.concat([
          generateSeed(state, currentEpoch),
          intToBytes(intDiv(i, 32), 8),
        ]))[i % 32];
        const effectiveBalance = state.validatorRegistry[candidateIndex].effectiveBalance;
        if (effectiveBalance.muln(255).gten(MAX_EFFECTIVE_BALANCE * randByte)) {
          return candidateIndex;
        }
        i += 1;
    }
>
    const randByte = hash(Buffer.concat([
          generateSeed(state, currentEpoch),
          intToBytes(intDiv(i, 32), 8),
        ]))[i % 32];

>>`intToBytes(intDiv(i, 32), 8)`
>>>divide `i` in groups
>>>say 32 `i` forms a group
>>
>>`randByte`
>>>every group computes `randByte=hash(seed, # of group)`
>>>`randByte` has 32 bytes
>>>>`hash()` 
>>>>in `util/crypto.ts`
>>>>output bytes32

>>>each element assigns for each `i` in the same group
>>>
>>>we can conclude that this is a p.r.n.g
>>>hash(seed,0), hash(seed,1), hash(seed,2), ... ...
>>>1 random number 32 bytes, we just use 1 byte each time

    const effectiveBalance = state.validatorRegistry[candidateIndex].effectiveBalance;
        if (effectiveBalance.muln(255).gten(MAX_EFFECTIVE_BALANCE * randByte)) {
          return candidateIndex;
        }
>>`muln` and `gten` are operators of `bn.js`
>>`n` postfix, means js number
>>`gte` "g"reater "t"han or "e"qual 
>>`MAX_EFFECTIVE_BALANCE`
>>> max deposit, 32

>>`effectiveBalance.muln(255).gten(MAX_EFFECTIVE_BALANCE * randByte`
>>> that is,`effectiveBalance`>=32 * (`radnByte`/255)
>>or `effectiveBalance` >= some target random #

>>If target random # not greater than your `effectiveBalance`, you become the proposer
>>the probability is `effectiveBalance`/32
>>Thus, everone faces different target random #, you put more deposits, the chance you become the proposer is larger.
>> 
>>We only choose one person who passes the target.
>>even you are rich, there maybe someone who challenge first and become the propser

>>However, the challenge order is random
>>>`const candidateIndex = firstCommittee[(currentEpoch + i) % firstCommittee.length];` 

>>Who can challenge the test first depends on `currentEpoch` and # of current committee members(sufficient random?)
>>
>>Notice that even you are rich, that would not make you challenge first

- epoch.ts
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
- crosslinkCommittee.ts
>
    export function getAttestationDataSlot(state: BeaconState, data: AttestationData): Slot {
      const epoch = data.targetEpoch;
      const committeeCount = getEpochCommitteeCount(state, epoch);
      const offset = (data.shard + SHARD_COUNT - getEpochStartShard(state, epoch)) % SHARD_COUNT;
      return intDiv(getEpochStartSlot(epoch) + offset, intDiv(committeeCount, SLOTS_PER_EPOCH));
    }
    
>> SHARD_COUNT 1024
>> Count committee of targetEpoch
>> `offset` We are processing `offset` shard of target epoch
>> 128 slot (2nd epoch)
>> slot 128, slot 129, slot 130, slot 131
>> 128,129,130 131,132,133 134,135,136 137,138,139 shard
>> 238 + |-   (138 - start shard) / (committee/slot)   -|
    11220 -- 10001
    12345 -- 10002
    10000
> How may committees in epoch?

    export function getEpochCommitteeCount(state: BeaconState, epoch: Epoch): number {
          const activeValidatorIndices = getActiveValidatorIndices(state, epoch);
          return Math.max(
            1,
            Math.min(
              intDiv(SHARD_COUNT, SLOTS_PER_EPOCH),
              intDiv(intDiv(activeValidatorIndices.length, SLOTS_PER_EPOCH), TARGET_COMMITTEE_SIZE),
            ),
          ) * SLOTS_PER_EPOCH;
        }

>>`intDiv(SHARD_COUNT, SLOTS_PER_EPOCH)` = 16
>
>or
>
    Math.max(
                1,
                Math.min(
                  16,
                  // some #
            )
> or

     // 1 <= (some #) <=16

>>We hope 1~16 committee per slot
>> `TARGET_COMMITTEE_SIZE` = 128 > 111 for sufficient security
>> more committees is better, but don't exceed 16
>> Then 1 epoch may own 64, 128, 192, ..., 960, 1024 committees
>> We use all `ActiveValidator` for each epoch
>> Note that, EpochCommitteeCount changes for each epoch
>> `ActiveValidator` may changes? 

> compute how many shards can `epoch` process
> 
    export function getShardDelta(state: BeaconState, epoch: Epoch): number {
      return Math.min(
        getEpochCommitteeCount(state, epoch),
        SHARD_COUNT - intDiv(SHARD_COUNT, SLOTS_PER_EPOCH),
      );
    }
>> 1 shard 1 committee
>> number of shards = number of committees in `epoch`
>> But there is a max, 1024 - 64 

> Use startShard of next epoch and each epoch's shardDelta to compute stardShard of some epoch

    export function getEpochStartShard(state: BeaconState, epoch: Epoch): Shard {
      const currentEpoch = getCurrentEpoch(state);
      let checkEpoch = currentEpoch + 1;
      assert(epoch <= checkEpoch);
      let shard = (state.latestStartShard + getShardDelta(state, currentEpoch)) % SHARD_COUNT;
      while (checkEpoch > epoch) {
        checkEpoch -= 1;
        shard = (shard + SHARD_COUNT - getShardDelta(state, checkEpoch)) % SHARD_COUNT;
      }
      return shard;
    }

>> We want to get what's the start shard of some epoch 
>> However, # of shard of each epoch is not fixed
>> We need to some computation for it 
>> `shard = (state.latestStartShard + getShardDelta(state, currentEpoch)) % SHARD_COUNT`
>>> `state.latestStartShard` is the 1st shard processed by latest epoch 
>>> Because currentShard is started
>>> `state.latestStartShard` is the start shard of current epoch
>>>  So `shard` is the startShard of next epoch
>>>  
>> Here is a diagram of `getEpochStartShard()` logic :
>>   
    /**
     *	let CE = currentEpoch, E = epoch
     *	let d(e) = getShardDelta(state, e)
     *	<  E  >	...	<CE -3>	<CE -2>	<CE -1>	< CE  >	<CE +1>
     *	|-----|		|-----|	|-----|	|-----|	|-----|	|-----|
     *	  d(E)  	d(CE-3)	d(CE-2)	d(CE-1)	 d(CE)	|d(CE+1)
     *	|		|	|	|	|	|
     *	|			|	|	|	\shard
     *	|			|	|	\A = shard-d(CE)
     *	|			\...	\B = s1-d(CE-1)
     *	\s = stardShard(E+1)-d(E+1)
     */
     	








    