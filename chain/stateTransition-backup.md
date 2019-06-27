# stateTransition/


# Study ChainSafe's eth2.0 implementation


## Notes :memo:
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
>
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
>> The state has changed b/c processSlot()
>> So new slot of new block is same to slot of state

- proposerSignature.ts

    
    export default function processProposerSignature(state: BeaconState, block: BeaconBlock): void {}
>
      const b: BeaconBlock = {
        ...block,
        signature: EMPTY_SIGNATURE,
      };
>> ( "..." is [spread operator](https://basarat.gitbooks.io/typescript/docs/spread-operator.html) of typescript )
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
>
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
We don't really process the voting logic in this step ( that occurs in epoch processsing )

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
> Check the format of attestation ( informations of eth2.0 )
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
>>> We need to process in 1 epoch ( may cross epoch? )
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
>> Attestation consists of 3 parts: epoch, block and shard
>> 1st condition we hope
>>> for epoch, 
>>> `state.currentJustifiedEpoch` -->  `currentEpoch`

>>> for shard,
>>> `state.currentCrosslinks[data.shard]` --> `data.crosslinkDataRoot`
 
>> 2nd condition we hope ???

> For phase 0, we simplify shard chain
> 
	assert(data.crosslinkDataRoot.equals(ZERO_HASH));

>
	  assert(verifyIndexedAttestation(state, convertToIndexed(state, attestation)));
>> `convertToIndexed()` changes the format of attestation
>> Replace bitfields with validator indices
>> 
>> `verifyIndexedAttestation()` extracts validators' pubkeys by validator indices and verify bls signature of attestation
>> 
	const pendingAttestation: PendingAttestation = {
		data,
		aggregationBitfield: attestation.aggregationBitfield,
		inclusionDelay: state.slot - attestationSlot,
		proposerIndex: getBeaconProposerIndex(state),
	  };
	  
	if (data.targetEpoch === currentEpoch) {
		state.currentEpochAttestations.push(pendingAttestation);
	  } else {
		state.previousEpochAttestations.push(pendingAttestation);
	  }
>> Cache attestations of epoch
>> Remove custody bit informations and signature
>> Add inclusionDelay and current beacon proposer

> Check formats of attestations of new block
>
	export default function processAttestations(state: BeaconState, block: BeaconBlock): void {
	  assert(block.body.attestations.length <= MAX_ATTESTATIONS);
	  for (const attestation of block.body.attestations) {
		processAttestation(state, attestation);
	  }
>> 1 block has many attestations, process them

- deposits.ts
>
	export function processDeposit(state: BeaconState, deposit: Deposit): void
>>
	assert(verifyMerkleBranch(
		hash(serialize(deposit.data, DepositData)), 
		deposit.proof,
		DEPOSIT_CONTRACT_TREE_DEPTH,
		deposit.index,
		state.latestEth1Data.depositRoot,
	  ));
>> Check `deposit` is in merkle tree
>> We have recorded new depositRoot in epoch ( slot which is start of the epoch )  
	
	assert(deposit.index === state.depositIndex);
  	state.depositIndex += 1;
>> Deposits must be processed in order
>>
	const pubkey = deposit.data.pubkey;
	  const amount = deposit.data.amount;
	  const validatorIndex = state.validatorRegistry.findIndex((v) => v.pubkey.equals(pubkey));
	  if (validatorIndex === -1) {
		if (!bls.verify(
		  pubkey,
		  signingRoot(deposit.data, DepositData),
		  deposit.data.signature,
		  getDomain(state, Domain.DEPOSIT),
		)) {
		  return state;
		}
		const validator: Validator = {
		  pubkey,
		  withdrawalCredentials: deposit.data.withdrawalCredentials,
		  activationEligibilityEpoch: FAR_FUTURE_EPOCH,
		  activationEpoch: FAR_FUTURE_EPOCH,
		  exitEpoch: FAR_FUTURE_EPOCH,
		  withdrawableEpoch: FAR_FUTURE_EPOCH,
		  slashed: false,
		  effectiveBalance: bnMin(
			amount.sub(amount.mod(EFFECTIVE_BALANCE_INCREMENT)),
			MAX_EFFECTIVE_BALANCE
		  ),
		};
		state.validatorRegistry.push(validator);
		state.balances.push(amount);
>>or
>>
	if (validatorIndex === -1) {
		if (!bls.verify(//...)) {
		  return state;
		}
		const validator: Validator = {//...	};
		state.validatorRegistry.push(validator);
		state.balances.push(amount);
		
>> New validator, check signature and add he
>> `FAR_FUTURE_EPOCH` Infinity
>> `effectiveBalance`
>>>`EFFECTIVE_BALANCE_INCREMENT`=1 eth
>>>`MAX_EFFECTIVE_BALANCE`=32 eth
>>>`amount.sub(amount.mod(EFFECTIVE_BALANCE_INCREMENT))`
>>>>ignore fraction

>>>`bnMin()`
>>>>Balance can't exceed `MAX_EFFECTIVE_BALANCE`

>>
	state.validatorRegistry.push(validator);
	state.balances.push(amount);
>>Add validator, sepreate amount
>
	else {
		increaseBalance(state, validatorIndex, amount);
	  }
>>If the validator has deposited, increase his balance
>>
	export default function processDeposits(state: BeaconState, block: BeaconBlock): void {
	  // Verify that outstanding deposits are processed up to the maximum number of deposits
	  assert(block.body.deposits.length ===
		Math.min(MAX_DEPOSITS, state.latestEth1Data.depositCount - state.depositIndex));
	  for (const deposit of block.body.deposits) {
		processDeposit(state, deposit);
	  }
#### util/
- seed.ts
> Choose seed for each epoch
>> 
    export function generateSeed(state: BeaconState, epoch: Epoch): bytes32 {
      return hash(Buffer.concat([
        getRandaoMix(state, epoch + LATEST_RANDAO_MIXES_LENGTH - MIN_SEED_LOOKAHEAD),
        getActiveIndexRoot(state, epoch),
        intToBytes(epoch, 32),
      ]));
    }

1. get the random number of last epoch ( latest random number )
>
    export function getRandaoMix(state: BeaconState, epoch: Epoch): bytes32 {
    return state.latestRandaoMixes[epoch % LATEST_RANDAO_MIXES_LENGTH];
    }
>> get random number from latest generated random numbers recorded in block ( state ) 
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
>> Even randaoMix and activate set repeat, different epoch has different seed.
>> 
>>  Even we predict the activate set of some future epoch E
>>  We can't know E's seed until E's last slot ends.
>>> If we compute earlier, the randaoMix value is not the same after the E's last slot, the earlier seed is different and invalid. 
>>> Or the seed changes depends on when do we generate seed 
>>> Or epoch seed changes for each slot

>> differnt activate set produce diffrent seed (is this helpful?) 

- misc.ts
> Get proposer of current slot

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
>After shuffle `indexCount` cards ( indices of validators ), return the `index`-th card

|                     | old deck              | new deck |
|:-------------------:|:----------------------|----------|
| i                   |   /-------------------|--->      |
|                     |  \|                   |          |
|                     |  \|                   |          |
|`getShuffledIndex(i)`|  \\___some validator  |          |
>( i=`index` in this table )
>
	export function getShuffledIndex(index: ValidatorIndex, indexCount: number, seed: bytes32): number 
>>`ValidatorIndex`
>>>`export type ValidatorIndex = number64;`
>>>refer to [src/types/primitives.tx]()

>>`indexCount` 
>>> We shuffle all `indexCount` validators together ( no matter which committee )
>>> This is a deck of `indexCount` cards

	let permuted = index;
	
	//...
	
	return permuted;

>> `permuted` is what we want
>> 
	  for (let i = 0; i < SHUFFLE_ROUND_COUNT; i++) {
		const pivot = bytesToBN(
		  hash(Buffer.concat([seed, intToBytes(i, 1)]))
			.slice(0, 8)
		).modn(indexCount);
>> `pivot` is a blockcipher roundkey
>> `pivot` help us choosing the "partner"

>>  We use PRNG to get pivot of each round
>>  We can view the code as : 
>>  
	// pivot = PRNG(seed,i)
>> PRNG produce pivot for each round
>> PRNG may generate pivots = 0,1, ... , `indexCount`-1
>> `seed` of PRNG is `generateSeed(state, epoch)`
>> that is, seed of current epoch ( at current slot )
>> 	
		const flip = (pivot - permuted) % indexCount;
>> `flip` is the "partner" of `permuted` of i-th round
>> 
		const position = Math.max(permuted, flip);
>> Notice that "partner" and max(permuted,"partner") are unique in this round
>>
		const source = hash(Buffer.concat([
		  seed,
		  intToBytes(i, 1),
		  intToBytes(intDiv(position, 256), 4),
		]));
		const byte = source[intDiv(position % 256, 8)];
		const bit = (byte >> (position % 8)) % 2;
>>Rewrite the code as
>>
	bit = Fi(position)
>> Fi is a function mapping `position` to a random single bit
>> Fi or Fi,seed
>> Fi is function decided by i and seed ( Why need seed?seed doesn't appear in "swap or not" paper  )
>> 
	permuted = bit ? flip : permuted;
>>bit = 1, swap
>>bit = 0, not swap
>>

>>Note
>>>From function `getShuffledIndex(index, indexCount, seed)`
>>>
>>>It seems like we shuffle each card respectively
>>>But we use the same `seed` of each `getShuffledIndex` call
>>>
>>>So pivot used in each round is same for each card
>>>   
>>>All `getShuffledIndex` calls consist the whole shuffle
>>>
>>>We can conclude that
>>>1. 1 seed for 1 shuffle, no card wil repeat
>>>2. different seed seems like different shuffle, same card may appear in multiple positions
>>>3. seed use in PRNG and Fi
>>>It means different shuffle has different shuffle process ( different PRNG and Fi )
	  
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
	 
>> We know the committees of current and past epoch
>> But we don't know committes of future
>> So we can't know start shard of future epoch
>> That is, we can't predict which shard will be processed in future epoch

> Compute `data.shard` is processed in which slot ( depends on # of committees )
>  
    export function getAttestationDataSlot(state: BeaconState, data: AttestationData): Slot {
      const epoch = data.targetEpoch;
      const committeeCount = getEpochCommitteeCount(state, epoch);
      const offset = (data.shard + SHARD_COUNT - getEpochStartShard(state, epoch)) % SHARD_COUNT;
      return intDiv(getEpochStartSlot(epoch) + offset, intDiv(committeeCount, SLOTS_PER_EPOCH));
    }
    
>> `SHARD_COUNT` 1024
>> `offset` 
>>>We are processing `offset` shard of target epoch

>> the last line is wrong
>>> correct: 
`getEpochStartSlot(epoch) + intDiv(offset, intDiv(committeeCount, SLOTS_PER_EPOCH));`
>> We are processing the `intDiv(offset, intDiv(committeeCount, SLOTS_PER_EPOCH))`-th slot of `targetEpoch`

>> Note that
>>> `data.shard` is some shard processed in `data.targetEpoch`

> Shuffle deck `indices` by `seed`
> Divide the deck in `count` groups ( from top to bottom )
> Get the `index`-th group after shuffle 
>
	export function computeCommittee(
	  indices: ValidatorIndex[],
	  seed: bytes32,
	  index: number,
	  count: number
	): ValidatorIndex[]
>> The deck is activate validator indices
>> 1 group of validator indices for 1 committee
>> We want the `index`-th committee of this epoch

>> Assume the size of committee is S
>>> 0-th shard of this epoch: card 0, 1, 2, ... , S-1
>>> 1 st shard of this epoch: card S, S+1, S+2, ... , 2S-1
>>> 2 nd shard of this epoch: card 2S, 2S+1, 2S+2, ... , 3S-1
>>
	const start = intDiv(indices.length * index, count);
  	const end = intDiv(indices.length * (index + 1), count);
>> or
>>
	start = intDiv(indices.length * index, count)
	      = index * intDiv(indices.length, count)
>>`indices.length` = # of activate validators
>>`intDiv(indices.length, count)` = # of members of committee
>>`count` is the # of groups that we divide or committee count of this epoch
>>
	const end = intDiv(indices.length * (index + 1), count)
>> or
>> 	
	end = intDiv(indices.length * (index + 1), count)
	    = (index + 1) * intDiv( indices.length,count)
>>
	Array.from({length: end - start},
    (_, i) => i + start)
>>Construct array \[ start, start+1, ..., end-1 \]
>>card start to card (end-1) is the `index`-th committee
>>
	.map((i) => indices[getShuffledIndex(i, indices.length, seed)])
>> get the i-th card after shuffle
>> `indices` is the deck before the shuffle
>>see table of `getShuffledIndex()`

>>Note
>>>1. seed changes **every slot**
>>>That is, we shuffle **all validators each slot** ( and pick some committees each slot )
>>>Thus, **one may play committee member again in 1 epoch**
 
>>>>>Consider counterexample, after some people played committee member

>>>>>We exclude possibility that they play committee member again

>>>>>So in last slots of the epcoh, we may guess the members of committee

>>>>>This is not secure. So we need feature 1

>>>2. shards of the same slot use the same seed
>>>That means we shuffle once in 1 slot
>>>And take many groups of cards for shards in that slot
>>>Thus, **members of committees in the same slot must be different**

> Get committee of (`epoch`, `shard`)
> 
	export function getCrosslinkCommittee(
	  state: BeaconState,
	  epoch: Epoch,
	  shard: Shard
	): ValidatorIndex[]
	
> 
	return computeCommittee(
		getActiveValidatorIndices(state, epoch),
		generateSeed(state, epoch),
		(shard + SHARD_COUNT - getEpochStartShard(state, epoch)) % SHARD_COUNT,
		getEpochCommitteeCount(state, epoch)
	);
>> Shuffle deck of validator indices 
>> Take 1 group of the cards
>> 
>>`getActiveValidatorIndices(state, epoch)`
>>> which deck we shuffle
>>> We shuffle indices of validators

>> `generateSeed(state,epoch)`
>>> We need key for shuffle 
>>> Seed of `epoch` at current slot
>>> generates shuffle key ( pivot ) of each round

>> `(shard + SHARD_COUNT - getEpochStartShard(state,epoch)) % SHARD_COUNT`
>>> We only need some cards in this deck
>>> Validators are processing which shard of `epoch` 
>>> start from 0, less than 1024

>>	`getEpochCommitteeCount(state, epoch)`
>>>	How many groups do we divide the deck?
>>> 1 shard ( committee ) 1 group

- attestation.ts
>
	export function getAttestingIndices(
	  state: BeaconState,
	  attestationData: AttestationData,
	  bitfield: bytes
	): ValidatorIndex[]
>>
	const crosslinkCommittee =
		getCrosslinkCommittee(state, attestationData.targetEpoch, attestationData.shard);
>> Get indices of committee of `attestationData.shard`,`attestationData.targetEpoch`
>> 
	assert(verifyBitfield(bitfield, crosslinkCommittee.length));
>> Check that `bitfield`'s format is consitent with `crosslinkCommittee`
>>
	return crosslinkCommittee
		.filter((_, i) =>  getBitfieldBit(bitfield, i) === 0b1)
>> Get indices of who vote 1
>> "0b" is prefix of js binary representation
>> 
	.sort();
>> sort by deafult order, Unicode

> Returns the i-th bit of `bitfield`
> 
	export function getBitfieldBit(bitfield: bytes, i: number): number {
	  const bit = i % 8;
	  const byte = intDiv(i,  8);
	  return (bitfield[byte] >> bit) & 1;
	}

>> bitfield
>> [ 7 6 5 4 3 2 1 0-th bit,
>> 15 14 13 12 11 10 9 8-th bit,
>>  ... ]


> Check format of bitfield
> 
	export function verifyBitfield(bitfield: bytes, committeeSize: number): boolean {}
>Check bitfield matches committee size
>
	  if (bitfield.length !== intDiv(committeeSize + 7, 8)) {
		return false;
	  }
>> 1 validator 1 bit
>> `committeeSize` = 1,2,3,4,5,6,7,8	--> 1 byte
>> `committeeSize` = 9,10,11,12,13,14,15,16	--> 2 bytes
>> `committeeSize` = 17,18,19,20,21,22,23,24	--> 3 bytes
>>	  
	  for (let i = committeeSize; i < bitfield.length * 8; i++) {
		if (getBitfieldBit(bitfield, i) === 0b1) {
		  return false;
		}
	  }
>> Check `bitfield` is padded with zero bits only
>	  
	export function convertToIndexed(state: BeaconState, attestation: Attestation): IndexedAttestation
>>
	const attestingIndices =
    getAttestingIndices(state, attestation.data, attestation.aggregationBitfield);
>> Who attest in committee of `atteatation.data`
>>
	const custodyBit1Indices =
    getAttestingIndices(state, attestation.data, attestation.custodyBitfield);
>>
	const custodyBit0Indices = attestingIndices.filter((i) => custodyBit1Indices.includes(i));
>> Get who attests but has custodoy bit 1
>> 
	return {
		custodyBit0Indices,
		custodyBit1Indices,
		data: attestation.data,
		signature: attestation.signature,
	  }; 
>
	export function verifyIndexedAttestation(
	  state: BeaconState,
	  indexedAttestation: IndexedAttestation
	): bool
>>
	const custodyBit0Indices = indexedAttestation.custodyBit0Indices;
	  const custodyBit1Indices = indexedAttestation.custodyBit1Indices;
>>

	  const custodyBit0IndicesSet = new Set(custodyBit0Indices);
	  const duplicates = new Set(
		custodyBit1Indices.filter((i) => custodyBit0IndicesSet.has(i))
	  );
	  assert(duplicates.size === 0);
>>Ensure no duplicate indices across bit0 and bit1
>>
	// TO BE REMOVED IN PHASE 1
	  if (custodyBit0Indices.length > 0) {
		return false;
	  }
>>
	const totalAttestingIndices = custodyBit0Indices.length + custodyBit1Indices.length;
	  if (!(1 <= totalAttestingIndices && totalAttestingIndices <= MAX_INDICES_PER_ATTESTATION)) {
		return false;
	  }
>>Check length
>>
	const sortedCustodyBit0Indices = custodyBit0Indices.slice().sort();
	  if (!custodyBit0Indices.every((index, i) => index === sortedCustodyBit0Indices[i])) {
		return false;
	  }

	  const sortedCustodyBit1Indices = custodyBit1Indices.slice().sort();
	  if (!custodyBit1Indices.every((index, i) => index === sortedCustodyBit1Indices[i])) {
		return false;
	  }
>> Use `sort()` to shallow copy indices, sort again and compare with input indices
>> 
	return bls.verifyMultiple(
		[
		  bls.aggregatePubkeys(sortedCustodyBit0Indices.map((i) => state.validatorRegistry[i].pubkey)),
		  bls.aggregatePubkeys(sortedCustodyBit1Indices.map((i) => state.validatorRegistry[i].pubkey)),
		], [
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b0,
		  }, AttestationDataAndCustodyBit),
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b1,
		  }, AttestationDataAndCustodyBit),
		],
		indexedAttestation.signature,
		getDomain(state, Domain.ATTESTATION, slotToEpoch(indexedAttestation.data.targetEpoch)),
	  );
>>
	bls.verifyMultiple(
		[pubkeys],
		[message hashes],
		signature,
		domain
	)
>>	Use BLS scheme, even multiple people with different messages, we can "add" all signautes
>>	The "signatue sum" can still be verified
>>	The verification process is different with normal verification
>>	So we need new function `bls.verifyMultiple()`
>>	( We can also apply BLS scheme to another case -- all people sign the same message ) 
>>
	[
	  bls.aggregatePubkeys(sortedCustodyBit0Indices.map((i) => state.validatorRegistry[i].pubkey)),
	  bls.aggregatePubkeys(sortedCustodyBit1Indices.map((i) => state.validatorRegistry[i].pubkey)),
	]
>> `map()` collects public keys
>> `aggeratePubkeys()` aggergates public key array 
>>
	[
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b0,
		  }, AttestationDataAndCustodyBit),
		  hashTreeRoot({
			data: indexedAttestation.data,
			custodyBit: 0b1,
		  }, AttestationDataAndCustodyBit),
		]
>> validtors sign `indexedAttestation.data` with different custodybit
>> 
	indexedAttestation.signature
>> 2 types signature adds together




    