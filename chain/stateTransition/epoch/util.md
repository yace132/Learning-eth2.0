#### util.ts
> Get attestations that support some epoch ( current or previous epoch )
> 
	export function getMatchingSourceAttestations(
	  state: BeaconState,
	  epoch: Epoch
	): PendingAttestation[] {
	  const currentEpoch = getCurrentEpoch(state);
	  assert(epoch === currentEpoch || epoch === getPreviousEpoch(state));
	  return epoch === currentEpoch
		? state.currentEpochAttestations
		: state.previousEpochAttestations;
	}
>> `epoch` target epoch
>> Determine the type of voting
>> We can know where votes are stored from type 

>Get attestations which support some block
>
	export function getMatchingTargetAttestations(
	  state: BeaconState,
	  epoch: Epoch
	): PendingAttestation[] {
	  const blockRoot = getBlockRoot(state, epoch);
	  return getMatchingSourceAttestations(state, epoch)
		.filter((a) => a.data.targetRoot.equals(blockRoot));

>
	export function getWinningCrosslinkAndAttestingIndices(
	  state: BeaconState,
	  epoch: Epoch,
	  shard: Shard
	): [Crosslink, ValidatorIndex[]]
>>
	const attestations = getMatchingSourceAttestations(state, epoch)
		.filter((a) => a.data.crosslink.shard === shard);
>> Get all attestations that votes `shard` ( of `epoch` ) from beacon chain ( `state` )

	const currentCrosslinkRoot = hashTreeRoot(state.currentCrosslinks[shard], Crosslink);
	  const currentCrosslink = state.currentCrosslinks[shard];
>> Get current crosslink of `shard` from beacon chain
>> 
	const crosslinks = attestations.filter((a) => (
		currentCrosslinkRoot.equals(a.data.crosslink.parentRoot) ||
		equals(currentCrosslink, a.data.crosslink, Crosslink))
	  ).map((a) => a.data.crosslink);
>>Check does attestation of shard vote for shard parent or shard
>>Collect their crosslinks  
