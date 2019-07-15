#### crosslinkCommittee.ts
>After shuffle `indexCount` cards ( indices of validators ), return the `index`-th card

|                     | old deck              | new deck |
|:-------------------:|:----------------------|----------|
| 0                   |                       |          |
| ...                 |                       |          |
| i                   |   /-------------------|--->      |
|           ...       |  \|                   |          |
|                     |  \|                   |          |
|`getShuffledIndex(i)`|  \\___some validator  |          |
| ...                 |                       |          |
| `indexCount`        |                       |          |
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
	 
~~We know the committees of current and past epoch
 But we don't know committes of future
 So we can't know start shard of future epoch
 That is, we can't predict which shard will be processed in future epoch~~
 
>>`getShardDelta` need to access validators of each epoch
>>But we only access validators refers by `state`
>>So `getEpochStartShard` may not work ??

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