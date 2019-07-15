#### crosslink.ts
>Execute voting result of crosslink

	export function processCrosslinks(state: BeaconState): BeaconState
>>
	state.previousCrosslinks = state.currentCrosslinks.slice();
>>

	[previousEpoch, currentEpoch].forEach((epoch) => {
>>We vote for some shard of `currentEpoch` and `previousEpoch`
>>
	const comitteeCount = getEpochCommitteeCount(state, epoch);
		for (let offset = 0; offset < comitteeCount; offset++) {
		const shard = (getEpochStartShard(state, epoch) + offset) % SHARD_COUNT;
		const crosslinkCommittee = getCrosslinkCommittee(state, epoch, shard);
>>Execute results of shards consecutively ( Although we open votes in parallel )